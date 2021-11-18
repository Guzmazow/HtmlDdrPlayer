import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { DisplayOptions } from '@models/display-options';
import { BehaviorSubject, first, Subject, takeWhile } from 'rxjs';
import { SimfileLoaderService } from './simfile-loader.service';
import { KeyboardService } from './keyboard.service';
import { Key } from '@models/enums';
import { PreloadingStrategy, Router } from '@angular/router';
import { Log } from './log.service';
import { GameRequest } from '@models/game-request';
import { Note } from '@models/note';
import { PreferenceService } from './preference.service';


@Injectable({
  providedIn: 'root'
})
export class DisplayService {

  onCurrentTimeSecondsChange = new BehaviorSubject<number>(0);
  onCurrentTimePercentageChange = new BehaviorSubject<number>(0);
  onGamePlayStateChange = new BehaviorSubject(false);

  requestedGame?: GameRequest;
  configuredBpmsTime: { from: number; to: number; bpm: number; }[] = [];
  displayOptions: DisplayOptions = new DisplayOptions(0, 0);

  private startDateTime: Date = new Date();
  private endDateTime: Date = new Date();
  private totalSeconds: number = 0;
  private static readonly timeTillEndGameScreen = 3000;
  private static readonly timeTillFirstNote = 3000;

  lastframe: number = 0;

  private reset() {
    this.requestedGame = undefined;
    this.displayOptions = new DisplayOptions(0, 0);
    this.onCurrentTimeSecondsChange.next(0);
    this.onCurrentTimePercentageChange.next(0);
    this.onCurrentTimeSecondsChange.next(0);
    this.startDateTime = new Date();
    this.endDateTime = new Date();
    this.configuredBpmsTime = [];
    this.totalSeconds = 0;
  }

  constructor(
    private mediaService: MediaService,
    private keyboardService: KeyboardService,
    private router: Router,
    private preferenceService: PreferenceService
  ) {
    Log.debug("DisplayService", "constructor")
    this.keyboardService.onLongPress.subscribe(key => {
      Log.debug("DisplayService", `long pressed ${key}`);
      if (this.onGamePlayStateChange.value && (key == Key.CANCEL || key == Key.START || key == Key.SELECT)) {
        this.endGame();
      }
    });

    this.keyboardService.onPress.subscribe(e => {
      //TODO: rewrite pause logic
      // if (e.state && e.key == Key.TEST) {
      //   if (this.mediaService.video.getPlayerState() == YT.PlayerState.PAUSED) {
      //     this.mediaService.video.playVideo();
      //   } else {
      //     this.mediaService.video.pauseVideo();
      //   }
      // }
    });
  }

  requestGame(r: GameRequest) {
    this.reset();
    this.requestedGame = r;
    const pref = this.preferenceService.onPreferenceChange.value;
    const minBpm = Math.min(...r.parsedSimfile.bpmsTime.map(x => x.bpm).filter(x => x > 0));
    const bpmLengths = r.parsedSimfile.bpmsTime
      .reduce<{ [key: number]: number }>((prev, curr, index, arr) => { prev[curr.bpm] = (prev[curr.bpm] ?? 0) + curr.to - curr.from; return prev; }, {}); /* group by bpm */
    
    let maxBpmLength = 0;
    let avgBpm = 0;
    for (const currentBpm in bpmLengths) {
      let currentBpmLength = bpmLengths[currentBpm];
      if(currentBpmLength > maxBpmLength){
        avgBpm = +currentBpm;
        maxBpmLength = currentBpmLength;        
      }
    }

    const minMod = pref.play.minMod ? pref.play.minMod / minBpm : 1;
    const avgMod = pref.play.avgMod ? pref.play.avgMod / avgBpm : 1;
    this.configuredBpmsTime = r.parsedSimfile.bpmsTime.map(x => {
      var newX = Object.assign({}, x)
      newX.bpm = newX.bpm * pref.play.xMod * minMod * avgMod;
      return newX;
    });
    Log.debug("DisplayService", `Found bpms: Min ${minBpm}, Avg ${avgBpm}`, `Bpms are calculated as: bpm * ${pref.play.xMod} * ${minMod} * ${avgMod}`, `Configured BPMS with preferences`, pref.play);
    Log.debug("DisplayService", "Original BPMS", r.parsedSimfile.bpmsTime);
    Log.debug("DisplayService", "Modded BPMS", this.configuredBpmsTime);

    this.displayOptions = new DisplayOptions(
      pref.display.laneWidth,  //Note lane horizontal stretch TODO:config
      r.parsedSimfileMode.tracks.length
    );
    this.mediaService.setYTVideo(this.requestedGame.youtubeVideo);
    this.mediaService.prepareMedia(this.displayOptions.noteSize).then(() => {
      this.startGame(r.parsedSimfileMode.totalTime);
    });
  }

  getTrackX(trackNumber: number) {
    return Math.round(trackNumber * this.displayOptions.trackSize ?? 0);
  }

  getNoteX(trackNumber: number) {
    return Math.round(this.displayOptions.noteSpacingSize + trackNumber * this.displayOptions.trackSize);
  }

  /**
   * @description Checks overlap borrowed from https://stackoverflow.com/a/12888920/15874691
   */
  is_overlapping(x1: number, x2: number, y1: number, y2: number) {
    return Math.max(x1, y1) <= Math.min(x2, y2)
  }

  /**
   * @description Checks overlap borrowed from https://stackoverflow.com/a/12888920/15874691 comment
   */
  overlap_amount(x1: number, x2: number, y1: number, y2: number) {
    return Math.min(x2, y2) - Math.max(x1, y1)
  }

  getNoteY(noteTime: number) {
    let distance = this.displayOptions.noteTopPadding;
    let fromTime = this.onCurrentTimeSecondsChange.value;
    let toTime = noteTime;

    //STOP logic
    {
      let toTimeWithStops = toTime;
      let fromTimeWithStops = fromTime;
      const stops = this.requestedGame?.parsedSimfile.stopsTime ?? [];
      let prevStops = 0;
      for (const stop of stops) {
        const endOfStop = stop.time + stop.stopDuration;
        if (this.is_overlapping(0, toTime, endOfStop, endOfStop)) {
          toTimeWithStops -= stop.stopDuration;
        }
        if (this.is_overlapping(fromTime, fromTime, stop.time, endOfStop)) {
          fromTimeWithStops = stop.time - prevStops;
        } else {
          if (this.is_overlapping(0, fromTime, endOfStop, endOfStop)) {
            fromTimeWithStops -= stop.stopDuration;
          }
        }
        prevStops += stop.stopDuration;
      }
      toTime = toTimeWithStops;
      fromTime = fromTimeWithStops;
    }

    //BPM logic
    {
      const bpms = this.configuredBpmsTime;
      const isReversed = toTime < fromTime;
      [fromTime, toTime] = [Math.min(toTime, fromTime), Math.max(toTime, fromTime)];
      for (const bpm of bpms) {
        if (this.is_overlapping(fromTime, toTime, bpm.from, (bpm.to ?? toTime))) {
          distance +=
            (isReversed ? -1 : 1) *
            this.overlap_amount(fromTime, toTime, bpm.from, (bpm.to ?? toTime)) *
            bpm.bpm
        }
      }
    }

    return Math.round(distance * 100) / 100;

    // CMod
    // let timeDistance = toTime - fromTime;
    // return Math.round((timeDistance / 0.001) + this.displayOptions.noteTopPadding);

  }

  endGame() {
    cancelAnimationFrame(this.lastframe);
    this.onGamePlayStateChange.next(false);
    this.router.navigate(['/']);
  }

  startGame(gameLengthSeconds: number) {
    // if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    //   document.documentElement.requestFullscreen().catch(err => {
    //     alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    //   });
    // }
    this.router.navigate(['/ddr-player']);
    this.startDateTime = new Date();
    this.endDateTime = new Date(
      this.startDateTime.getTime() + //start
      gameLengthSeconds * 1000 + //simfile duration
      DisplayService.timeTillEndGameScreen + //TODO:config
      DisplayService.timeTillFirstNote + //TODO:config
      ((this.requestedGame?.parsedSimfile?.offset ?? 0) * 1000)
    );
    this.totalSeconds = (this.endDateTime.getTime() - this.startDateTime.getTime()) / 1000;
    this.onGamePlayStateChange.next(true);
    this.tick();
  }

  tick() {
    if (!this.onGamePlayStateChange.value)
      return;

    if (this.endDateTime.getTime() < new Date().getTime()) {
      this.endGame();
      return;
    }

    var newTimeMiliseconds = new Date().getTime() - this.startDateTime.getTime() - ((this.requestedGame?.parsedSimfile?.offset ?? 0) * 1000) - DisplayService.timeTillFirstNote;
    var newTimeSeconds = (newTimeMiliseconds / 1000);
    // var newTimeSeconds = +((window as any).a ?? '0');

    if (this.onCurrentTimeSecondsChange.value != newTimeSeconds) {
      this.onCurrentTimeSecondsChange.next(newTimeSeconds);
      if (this.totalSeconds > 0) {
        this.onCurrentTimePercentageChange.next(newTimeSeconds / this.totalSeconds * 100);
      }
    }

    this.lastframe = requestAnimationFrame(this.tick.bind(this));
  }
}
