import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { DisplayOptions } from '@models/display-options';
import { BehaviorSubject, Subject } from 'rxjs';
import { SimfileLoaderService } from './simfile-loader.service';
import { GameRequest } from '@models/game-request';
import { KeyboardService } from './keyboard.service';
import { Key } from '@models/enums';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class DisplayService {

  onRedraw = new Subject();
  onSetup = new Subject();
  
  onGamePlayStateChange = new BehaviorSubject(false);

  displayOptions: DisplayOptions = new DisplayOptions(0, 0, 0);
  gameRequest!: GameRequest;
  currentTime: number = 0;
  currentPlayerTime: number = 0;
  skipedPlayeTimeUntilNow: number = 0;

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
    this.simfileLoaderService.gameRequested.subscribe(r => {
      if (!r) return;
      this.gameRequest = r;
      this.currentTime = 0;
      this.currentPlayerTime = 0;
      this.skipedPlayeTimeUntilNow = 0;
      this.displayOptions = new DisplayOptions(700, r.playableSimfileMode.tracks.length, 0.001);
      this.mediaService.prepareMedia(this.displayOptions.noteSize);
      this.mediaService.onMediaLoaded.subscribe(() => {
        this.onSetup.next();
      });
    })
  }

  index = 0





  endGameIfEndKey(key: Key): void {
    console.log('long pressed', key);
    if (key == Key.CANCEL || key == Key.START || key == Key.SELECT) {
      this.end();
    }
  }

  end(){
    cancelAnimationFrame(this.lastframe);
    this.onGamePlayStateChange.next(false);
    this.router.navigate(['/']);  
  }

  play() {
    this.gameRequest.youtubeVideo.skips.forEach(x => x.skipped = false)
    this.onGamePlayStateChange.next(true);
    this.tick();
  }

  tick() {
    if (this.gameRequest?.parsedSimfile) {
      if (this.mediaService.video.getDuration() <= this.mediaService.video.getCurrentTime() + 2) {
        setTimeout(() => {
          this.end();
        }, 10000);
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
            console.log("ending", skip.from);
            return;
          }
          // if (this.currentPlayerTime < skip.to) {
          this.mediaService.video.seekTo(skip.to, true);
          this.mediaService.video.playVideo();
          this.skipedPlayeTimeUntilNow += (skip.to - skip.from);
          skip.skipped = true;
          console.log("skipping", skip.from, skip.to);
          // }
        }
      }

      var newTime = Math.round((this.currentPlayerTime - this.skipedPlayeTimeUntilNow /*+ (this.gameRequest.parsedSimfile.offset ?? 0) simfile parsing applies this*/ + (this.gameRequest.youtubeVideo.offset ?? 0)) * 1000) / 1000;;
      if (this.currentTime != newTime) {
        this.currentTime = newTime;
        this.onRedraw.next();
      }
    }
    this.lastframe = requestAnimationFrame(this.tick.bind(this));
  }
}
