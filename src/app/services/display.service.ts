import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { DisplayOptions } from '@models/display-options';
import { BehaviorSubject, Subject } from 'rxjs';
import { SimfileLoaderService } from './simfile-loader.service';
import { GameRequest } from '@models/game-request';
import { KeyboardService } from './keyboard.service';
import { Key } from '@models/enums';
import { Router } from '@angular/router';
import { Log } from './log.service';


@Injectable({
  providedIn: 'root'
})
export class DisplayService {

  onRedraw = new Subject<void>();
  onSetup = new Subject<void>();

  onGamePlayStateChange = new BehaviorSubject(false);
  onGameFinished = new Subject<void>();

  displayOptions: DisplayOptions = new DisplayOptions(0, 0, 0);
  gameRequest!: GameRequest;
  currentTime: number = 0;
  elapsedTimePercentage: number = 0;
  currentPlayerTime: number = 0;
  skipedPlayTimeUntilNow: number = 0;

  lastframe: number = 0;

  getTrackX(trackNumber: number) {
    return Math.round(trackNumber * this.displayOptions?.trackSize ?? 0);
  }

  getNoteX(trackNumber: number) {
    return Math.round(this.displayOptions.noteSpacingSize + trackNumber * this.displayOptions.trackSize);
  }

  getNoteY(noteTime: number) {
    let timeDistance = noteTime - this.currentTime;
    return Math.round((timeDistance / this.displayOptions.secondsPerPixel) + this.displayOptions.noteTopPadding);
  }

  constructor(
    private mediaService: MediaService,
    private simfileLoaderService: SimfileLoaderService,
    private keyboardService: KeyboardService,
    private router: Router
  ) {
    this.keyboardService.onLongPress.subscribe(key => this.endGameIfEndKey(key))
    this.keyboardService.onPress.subscribe(e => e.state && this.pauseIfTestKey(e.key))
    this.simfileLoaderService.gameRequested.subscribe(r => {
      if (!r) return;
      this.gameRequest = r;
      this.currentTime = 0;
      this.currentPlayerTime = 0;
      this.skipedPlayTimeUntilNow = 0;
      this.displayOptions = new DisplayOptions(700, r.playableSimfileMode.tracks.length, 0.001);
      this.mediaService.prepareMedia(this.displayOptions.noteSize);
      this.mediaService.onMediaLoaded.subscribe(() => {
        this.onSetup.next();
      });
    })
  }
  pauseIfTestKey(key: Key): void {
    if (key == Key.TEST) {
      if (this.mediaService.video.getPlayerState() == YT.PlayerState.PAUSED) {
        this.mediaService.video.playVideo();
      } else {
        this.mediaService.video.pauseVideo();
      }
    }
  }

  endGameIfEndKey(key: Key): void {
    Log.debug(`long pressed ${key}`);
    if (key == Key.CANCEL || key == Key.START || key == Key.SELECT) {
      this.end();
    }
  }

  end() {
    // if (document.fullscreenElement && document.exitFullscreen) {
    //   document.exitFullscreen();
    // }

    cancelAnimationFrame(this.lastframe);
    this.onGameFinished.next();
    this.onGamePlayStateChange.next(false);
    this.router.navigate(['/']);
  }

  play() {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
    this.gameRequest.youtubeVideo.skips.forEach(x => x.skipped = false)
    this.onGamePlayStateChange.next(true);
    this.tick();
  }

  tick() {
    if (this.gameRequest?.parsedSimfile) {
      if (this.mediaService.video.getDuration() > 0) {
        this.elapsedTimePercentage = this.mediaService.video.getCurrentTime() / this.mediaService.video.getDuration() * 100;
      }
      if (this.mediaService.video.getDuration() <= this.mediaService.video.getCurrentTime() + 2) {
        setTimeout(() => {
          this.end();
        }, 3000);
        return;
      }


      var newPlayerTime = Math.round(this.mediaService.video.getCurrentTime() * 1000) / 1000;
      if (this.currentPlayerTime != newPlayerTime) {
        this.currentPlayerTime = newPlayerTime;
      }
      for (let skip of this.gameRequest.youtubeVideo.skips) {
        if (skip.skipped) continue;
        if (this.currentPlayerTime >= skip.from) {
          if (skip.to === null) {
            this.mediaService.video.stopVideo();
            skip.skipped = true;
            Log.debug(`ending ${skip.from}`);
            return;
          }
          // if (this.currentPlayerTime < skip.to) {
          this.mediaService.video.seekTo(skip.to, true);
          this.mediaService.video.playVideo();
          this.skipedPlayTimeUntilNow += (skip.to - skip.from);
          skip.skipped = true;
          Log.debug(`skipping: ${skip.from} to ${skip.to}`);
          // }
        }
      }

      var newTime = Math.round((this.currentPlayerTime - this.skipedPlayTimeUntilNow /*+ (this.gameRequest.parsedSimfile.offset ?? 0) simfile parsing applies this*/ + (this.gameRequest.youtubeVideo.offset ?? 0)) * 1000) / 1000;
      if (this.currentTime != newTime && newTime > 0) {
        this.currentTime = newTime;
        this.onRedraw.next();
      }
    }
    this.lastframe = requestAnimationFrame(this.tick.bind(this));
  }
}
