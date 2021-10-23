import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { DisplayOptions } from '@models/display-options';
import { BehaviorSubject, Subject } from 'rxjs';
import { SimfileLoaderService } from './simfile-loader.service';
import { KeyboardService } from './keyboard.service';
import { Key } from '@models/enums';
import { Router } from '@angular/router';
import { Log } from './log.service';
import { GameRequest } from '@models/game-request';


@Injectable({
  providedIn: 'root'
})
export class DisplayService {

  onCurrentTimeSecondsChange = new BehaviorSubject<number>(0);
  onCurrentTimePercentageChange = new BehaviorSubject<number>(0);
  onGamePlayStateChange = new BehaviorSubject(false);

  requestedGame?: GameRequest;
  displayOptions: DisplayOptions = new DisplayOptions(0, 0, 0);

  private startDateTime: Date = new Date();
  private endDateTime: Date = new Date();

  
  // TODO: move out
  // currentPlayerTimeSeconds: number = 0;
  // skipedPlayTimeSecondsUntilNow: number = 0;

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
    private simfileLoaderService: SimfileLoaderService,
    private keyboardService: KeyboardService,
    private router: Router
  ) {
    this.keyboardService.onLongPress.subscribe(key => {
      Log.debug(`long pressed ${key}`);
      if (key == Key.CANCEL || key == Key.START || key == Key.SELECT) {
        this.endGame();
      }
    });

    this.keyboardService.onPress.subscribe(e => {
      if (e.state && e.key == Key.TEST) {
        if (this.mediaService.video.getPlayerState() == YT.PlayerState.PAUSED) {
          this.mediaService.video.playVideo();
        } else {
          this.mediaService.video.pauseVideo();
        }
      }
    });

    this.simfileLoaderService.gameRequested.subscribe(r => {
      if(!r) return;
      this.requestedGame = r;
      this.reset();
      this.displayOptions = new DisplayOptions(700, r.playableSimfileMode.tracks.length, 0.001);
      this.mediaService.onMediaLoaded.subscribe(() => {
        this.startGame(r.playableSimfileMode.totalTime);
      });
    })
  }

  getTrackX(trackNumber: number) {
    return Math.round(trackNumber * this.displayOptions.trackSize ?? 0);
  }

  getNoteX(trackNumber: number) {
    return Math.round(this.displayOptions.noteSpacingSize + trackNumber * this.displayOptions.trackSize);
  }

  getNoteY(noteTime: number) {
    let timeDistance = noteTime - this.onCurrentTimeSecondsChange.value;
    return Math.round((timeDistance / this.displayOptions.secondsPerPixel) + this.displayOptions.noteTopPadding);
  }

  endGame() {
    cancelAnimationFrame(this.lastframe);
    this.onGamePlayStateChange.next(false);
    this.router.navigate(['/']);
  }

  startGame(gameLengthSeconds: number) {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
    this.startDateTime = new Date();
    this.endDateTime = new Date(
      this.startDateTime.getTime() + //start
      gameLengthSeconds * 1000 + //simfile duration
      3000 //buffer TODO:config
    );    
    this.tick();
    this.onGamePlayStateChange.next(true);
  }

  tick() {
    if (!this.onGamePlayStateChange.value)
      return;

    if(this.endDateTime.getTime() < new Date().getTime()){
      this.endGame();
      return;
    }
      
    // if (this.mediaService.video.getDuration() > 0) {
    //   this.elapsedTimePercentage = this.mediaService.video.getCurrentTime() / this.mediaService.video.getDuration() * 100;
    // }
    // if (this.mediaService.video.getDuration() <= this.mediaService.video.getCurrentTime() + 2) {
    //   setTimeout(() => {
    //     this.end();
    //   }, 3000);
    //   return;
    // }


    // var newPlayerTime = Math.round(this.mediaService.video.getCurrentTime() * 1000) / 1000;
    // if (this.currentPlayerTime != newPlayerTime) {
    //   this.currentPlayerTime = newPlayerTime;
    // }
    // for (let skip of this.gameRequest.youtubeVideo.skips) {
    //   if (skip.skipped) continue;
    //   if (this.currentPlayerTime >= skip.from) {
    //     if (skip.to === null) {
    //       this.mediaService.video.stopVideo();
    //       skip.skipped = true;
    //       Log.debug(`ending ${skip.from}`);
    //       return;
    //     }
    //     // if (this.currentPlayerTime < skip.to) {
    //     this.mediaService.video.seekTo(skip.to, true);
    //     this.mediaService.video.playVideo();
    //     this.skipedPlayTimeUntilNow += (skip.to - skip.from);
    //     skip.skipped = true;
    //     Log.debug(`skipping: ${skip.from} to ${skip.to}`);
    //     // }
    //   }
    // }
    var newTimeMiliseconds = new Date().getTime() - this.startDateTime.getTime();
    var newTimeSeconds = newTimeMiliseconds / 1000;

    //TODO: move skip logic to youtube component
    //Math.round((this.currentPlayerTimeSeconds - this.skipedPlayTimeSecondsUntilNow /*+ (this.gameRequest.parsedSimfile.offset ?? 0) simfile parsing applies this*/ + (this.gameRequest.youtubeVideo.offset ?? 0)) * 1000) / 1000;
    if (this.onCurrentTimeSecondsChange.value != newTimeSeconds) {
      this.onCurrentTimeSecondsChange.next(newTimeSeconds);
    }

    this.lastframe = requestAnimationFrame(this.tick.bind(this));
  }
}
