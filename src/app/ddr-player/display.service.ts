import { Injectable, destroyPlatform } from '@angular/core';
import { FullParse } from './models/full-parse';
import { NoteManager } from './models/note-manager';
import { DisplayContext } from './models/display-context';
import { Media } from './models/media';
import { ParsingService } from './parsing.service';
import { MediaService } from './media.service';

@Injectable({
  providedIn: 'root'
})
export class DisplayService {

  displayContext!: DisplayContext;

  constructor(private parsingService: ParsingService, private mediaService: MediaService) {

  }

  prepareDisplayContext(){
    if(!this.parsingService.fullParse)
      throw 'parsingService.fullParse is required'

    this.displayContext = new DisplayContext(
      <HTMLCanvasElement>document.getElementById("note-lane-canvas"),
      <HTMLCanvasElement>document.getElementById("receptor-canvas"),
      <HTMLCanvasElement>document.getElementById("judgement-canvas"),
      this.parsingService.fullParse,
      this.mediaService.media
    )
  }

  load(){
    this.displayContext.noteLaneCanvas.height = screen.height;
    this.displayContext.noteLaneCanvas.width = 800;
    this.displayContext.receptorCanvas.height = screen.height;
    this.displayContext.receptorCanvas.width = 800;
    let noteManager: NoteManager = new NoteManager(this.displayContext);
    noteManager.draw();
  }
}
