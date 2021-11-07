import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { DisplayOptions } from '@models/display-options';
import { BehaviorSubject, first, Subject, takeWhile } from 'rxjs';
import { SimfileLoaderService } from './simfile-loader.service';
import { KeyboardService } from './keyboard.service';
import { Key } from '@models/enums';
import { Router } from '@angular/router';
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
  displayOptions: DisplayOptions = new DisplayOptions(0, 0);

  private startDateTime: Date = new Date();
  private endDateTime: Date = new Date();
  private totalSeconds: number = 0;
  private static readonly timeTillEndGameScreen = 3000;
  private static readonly timeTillFirstNote = 3000;

  lastframe: number = 0;

  private reset() {
    this.onCurrentTimeSecondsChange.next(0);
    this.onCurrentTimePercentageChange.next(0);
    this.onCurrentTimeSecondsChange.next(0);
    this.startDateTime = new Date();
    this.endDateTime = new Date();
  }

  constructor(
    private mediaService: MediaService,
    private keyboardService: KeyboardService,
    private router: Router,
    private preferenceService: PreferenceService
  ) {
    Log.debug("DisplayService", "constructor")
    this.keyboardService.onLongPress.subscribe(key => {
      Log.debug(`long pressed ${key}`);
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
    this.requestedGame = r;
    this.reset();
    this.displayOptions = new DisplayOptions(
      this.preferenceService.onPreferenceChange.value.display.laneWidth,  //Note lane horizontal stretch TODO:config
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

  prevBPMMod = 0;


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
      for (const stop of stops) {
        const endOfStop = stop.time + stop.stopDuration;
        if (this.is_overlapping(fromTime, toTime, endOfStop, endOfStop)) {
          toTimeWithStops -= stop.stopDuration;
        }
        if (this.is_overlapping(fromTime, fromTime, stop.time, endOfStop)) {
          //  stop.time <= newTimeSeconds && newTimeSeconds <= endOfStop) {
          //Log.debug("NoteLaneComponent", `Keeping time (${newTimeSeconds}) stopped from ${stop.time} to ${endOfStop}`);
          fromTimeWithStops = stop.time;
        }
      }
      fromTime = fromTimeWithStops;
      toTime = toTimeWithStops;
    }

    //BPM logic
    {
      const bpms = this.requestedGame?.parsedSimfile.bpmsTime ?? [];
      const isReversed = toTime < fromTime;
      let reversableFromTime = isReversed ? toTime : fromTime;
      let reversableToTime = isReversed ? fromTime : toTime;
      for (const bpm of bpms) {
        if (this.is_overlapping(reversableFromTime, reversableToTime, bpm.from, (bpm.to ?? reversableToTime))) {
          distance += (isReversed ? -1 : 1) * this.overlap_amount(reversableFromTime, reversableToTime, bpm.from, (bpm.to ?? reversableToTime)) * bpm.bpm * this.preferenceService.onPreferenceChange.value.play.xMod
        }
      }
    }

    return Math.round(distance);
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
      DisplayService.timeTillEndGameScreen + DisplayService.timeTillFirstNote //TODO:config
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

    var newTimeMiliseconds = new Date().getTime() - this.startDateTime.getTime() - DisplayService.timeTillFirstNote;
    var newTimeSeconds = (newTimeMiliseconds / 1000);

    if (this.onCurrentTimeSecondsChange.value != newTimeSeconds) {
      this.onCurrentTimeSecondsChange.next(newTimeSeconds);
      if (this.totalSeconds > 0) {
        this.onCurrentTimePercentageChange.next(newTimeSeconds / this.totalSeconds * 100);
      }
    }

    this.lastframe = requestAnimationFrame(this.tick.bind(this));
  }
}
