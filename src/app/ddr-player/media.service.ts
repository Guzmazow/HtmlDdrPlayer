import { Injectable } from '@angular/core';
import { Media } from './models/media';
import { ParsingService } from './parsing.service';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  
  media: Media = new Media();

  constructor(private parsingService: ParsingService) { }

  loadAudio(){
    let filename = this.parsingService.partialParse.metaData.get("MUSIC");
    if(filename){
      this.media.audio = new Audio(`${this.parsingService.smFileLocation.substring(0, this.parsingService.smFileLocation.lastIndexOf("/"))}/${filename}`);
      this.media.audio.load();
    }
  }


}
