import { Injectable } from '@angular/core';
import { ParsingService } from './parsing.service';
import { MediaService } from './media.service';
import { DisplayOptions } from '@models/display-options';
import { Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class DisplayService {

  onRedraw = new Subject();
  onSetup = new Subject();
  onStart = new Subject();

  displayOptions!: DisplayOptions;
  currentTime: number = 0;

  getTrackX(trackNumber: number) {
    return trackNumber * this.displayOptions.trackSize;
  }

  getNoteX(trackNumber: number) {
    return this.displayOptions.noteSpacingSize + trackNumber * this.displayOptions.trackSize;
  }

  getNoteY(noteTime: number) {
    let timeDistance = noteTime - this.currentTime;
    return (timeDistance / this.displayOptions.secondsPerPixel) + this.displayOptions.noteTopPadding;
  }

  constructor(private parsingService: ParsingService, private mediaService: MediaService) {

  }

  setup() {
    this.currentTime = this.parsingService.selectedMode.offset;
    this.displayOptions = new DisplayOptions(800, this.parsingService.selectedMode.tracks.length, 0.001);
    this.onSetup.next();
  }

  load() {
    this.onStart.next();
    this.tick();
  }

  tick() {
    var newTime = this.parsingService.selectedMode.offset + Math.round(this.mediaService.media.video.getCurrentTime() * 1000) / 1000
    if (this.currentTime != newTime) {
      this.currentTime = newTime;
      this.onRedraw.next();
    }
    requestAnimationFrame(this.tick.bind(this));
  }
}
