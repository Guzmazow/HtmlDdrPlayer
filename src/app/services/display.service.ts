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

  getTrackX(trackNumber: number) {
    return trackNumber * this.displayOptions?.trackSize ?? 0;
  }

  getNoteX(trackNumber: number) {
    return this.displayOptions.noteSpacingSize + trackNumber * this.displayOptions.trackSize;
  }

  getNoteY(noteTime: number) {
    let timeDistance = noteTime - this.currentTime;
    return (timeDistance / this.displayOptions.secondsPerPixel) + this.displayOptions.noteTopPadding;
  }

  constructor(private mediaService: MediaService, private simfileLoaderService: SimfileLoaderService) {
    this.mediaService.prepareMedia();
    simfileLoaderService.gameRequested.subscribe(r => {
      if(!r) return;
      this.gameRequest = r;
      this.currentTime = r.parsedSimfile.offset;
      this.displayOptions = new DisplayOptions(800, r.playableSimfileMode.tracks.length, 0.001);
      this.onSetup.next();
    })
  }

  play() {
    this.onStart.next();
    this.tick();
  }

  tick() {
    var newTime = Math.round((this.gameRequest?.parsedSimfile.offset ?? 0) + this.mediaService.media.video.getCurrentTime() * 1000) / 1000
    if (this.currentTime != newTime) {
      this.currentTime = newTime;
      this.onRedraw.next();
    }
    requestAnimationFrame(this.tick.bind(this));
  }
}
