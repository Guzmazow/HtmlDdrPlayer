import { Injectable } from '@angular/core';
import { MediaService } from './media.service';
import { DisplayOptions } from '@models/display-options';
import { Subject } from 'rxjs';
import { SimfileLoaderService } from './simfile-loader.service';
import { GameRequest } from '@models/game-request';


@Injectable({
  providedIn: 'root'
})
export class DisplayService {

  onRedraw = new Subject();
  onSetup = new Subject();
  onStart = new Subject();

  displayOptions: DisplayOptions = new DisplayOptions(0, 0, 0);
  gameRequest!: GameRequest;
  currentTime: number = 0;
  currentPlayerTime: number = 0;
  skipedPlayeTimeUntilNow: number = 0;

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

  constructor(private mediaService: MediaService, private simfileLoaderService: SimfileLoaderService) {
    this.simfileLoaderService.gameRequested.subscribe(r => {
      if (!r) return;
      this.gameRequest = r;
      this.currentTime = r.parsedSimfile.offset;
      this.displayOptions = new DisplayOptions(700, r.playableSimfileMode.tracks.length, 0.001);
      this.mediaService.prepareMedia(this.displayOptions.noteSize);
      this.mediaService.onMediaLoaded.subscribe(()=>{
        this.onSetup.next();        
      });
    })
  }

  index = 0

  play() {
    this.onStart.next();
    this.tick();
  }

  tick() {
    if (this.gameRequest?.parsedSimfile) {

      var newPlayerTime = Math.round((this.gameRequest.parsedSimfile.offset ?? 0) + this.mediaService.media.video.getCurrentTime() * 1000) / 1000;
      if (this.currentPlayerTime != newPlayerTime) {
        this.currentPlayerTime = newPlayerTime;
      }
      for (let skip of this.gameRequest.parsedSimfile.skips) {
        if(skip.skipped) continue;
        if (this.currentPlayerTime >= skip.from) {
          if (skip.to === null) {
            this.mediaService.media.video.stopVideo();
            skip.skipped = true;
            console.log("ending", skip.from);
            return;
          }
          // if (this.currentPlayerTime < skip.to) {
            this.mediaService.media.video.seekTo(skip.to, true);
            this.mediaService.media.video.playVideo();
            this.skipedPlayeTimeUntilNow += (skip.to - skip.from);
            skip.skipped = true;
            console.log("skipping", skip.from, skip.to);
          // }
        }
      }

      var newTime = this.currentPlayerTime - this.skipedPlayeTimeUntilNow;
      if (this.currentTime != newTime) {
        this.currentTime = newTime;
        this.onRedraw.next();
      }
    }
    requestAnimationFrame(this.tick.bind(this));
  }
}
