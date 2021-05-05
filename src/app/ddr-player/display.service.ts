import { Injectable, destroyPlatform, EventEmitter } from '@angular/core';
import { FullParse } from './models/full-parse';
import { DisplayContext } from './models/display-context';
import { Media } from './models/media';
import { ParsingService } from './parsing.service';
import { MediaService } from './media.service';
import { DisplayOptions } from './models/display-options';


@Injectable({
  providedIn: 'root'
})
export class DisplayService {

  displayContext!: DisplayContext;

  redrawTriggered: EventEmitter<void> = new EventEmitter();
  startTriggered: EventEmitter<void> = new EventEmitter();

  constructor(private parsingService: ParsingService, private mediaService: MediaService) {

  }

  prepareDisplayContext() {
    if (!this.parsingService.fullParse)
      throw 'parsingService.fullParse is required'

    this.displayContext = new DisplayContext(
      <HTMLCanvasElement>document.getElementById("note-lane-canvas"),
      <HTMLCanvasElement>document.getElementById("receptor-canvas"),
      <HTMLCanvasElement>document.getElementById("judgement-canvas"),
      this.parsingService.partialParse,
      this.parsingService.fullParse,
      this.mediaService.media,
      new DisplayOptions(800, this.parsingService.fullParse.tracks.length, 0.001)
    )

  }

  load() {


    this.startTriggered.emit();

    this.tick();
  }

  tick() {
    var newTime = this.displayContext.fullParse.offset + Math.round(this.displayContext.media.audio.currentTime * 1000) / 1000
    if(this.displayContext.currentTime != newTime){
      this.displayContext.currentTime = newTime;
      this.redrawTriggered.emit();
    }
    requestAnimationFrame(this.tick.bind(this));
  }
}
