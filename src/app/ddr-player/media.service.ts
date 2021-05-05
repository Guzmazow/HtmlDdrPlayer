import { Injectable } from '@angular/core';
import { Media } from './models/media';
import { ParsingService } from './parsing.service';
import { Direction, Judgement } from './models/note-enums';
import { Direct } from 'protractor/built/driverProviders';

@Injectable({
  providedIn: 'root'
})
export class MediaService {

  media: Media = new Media();

  arrowImageLoad = this.loadImage("/assets/Noteskins/Outfox/_arrow 1x8 (doubleres).png");
  arrowGlowImageLoad = this.loadImage("/assets/Noteskins/Outfox/_glow (doubleres).png");
  receptorImageLoad = this.loadImage("/assets/Noteskins/Outfox/_receptor (doubleres).png");
  receptorFlashImageLoad = this.loadImage("/assets/Noteskins/Outfox/_rflash (doubleres).png");
  judgementImageLoad = this.loadImage("/assets/Judgements/default 1x6 (Doubleres).png");

  constructor(private parsingService: ParsingService) {

  }

  prepareMedia() {
    let filename = this.parsingService.partialParse.metaData.get("MUSIC");
    if (filename) {
      this.media.audio = new Audio(`${this.parsingService.smFileLocation.substring(0, this.parsingService.smFileLocation.lastIndexOf("/"))}/${filename}`);
      this.media.audio.load();
    }




    // let arrowImage = <HTMLImageElement>document.getElementById("noteskin-arrow");
    // let arrowGlowImage = <HTMLImageElement>document.getElementById("noteskin-arrow-glow");
    // let receptorImage = <HTMLImageElement>document.getElementById("noteskin-receptor");
    // let receptorFlashImage = <HTMLImageElement>document.getElementById("noteskin-receptor-flash");
    // let judgementImage = <HTMLImageElement>document.getElementById("noteskin-judgements");

    Promise.all([this.arrowImageLoad, this.arrowGlowImageLoad, this.receptorImageLoad, this.receptorFlashImageLoad, this.judgementImageLoad]).then((x) => {
      let arrowImage = x[0];
      let arrowGlowImage = x[1];
      let receptorImage = x[2];
      let receptorFlashImage = x[3];
      let judgementImage = x[4];

      let directions = [Direction.DOWN, Direction.LEFT, Direction.UP, Direction.RIGHT];
      for (let direction of directions) {
        this.media.arrowImageCache.set(direction, this.getClippedRegion(arrowImage, 0, 0, arrowImage.width, arrowImage.height / 8, direction));
        this.media.arrowGlowImageCache.set(direction, this.getClippedRegion(arrowGlowImage, 0, 0, arrowGlowImage.width, arrowGlowImage.height, direction));
        this.media.receptorImageCache.set(direction, this.getClippedRegion(receptorImage, 0, 0, receptorImage.width, receptorImage.height, direction));
        this.media.receptorFlashImageCache.set(direction, this.getClippedRegion(receptorFlashImage, 0, 0, receptorFlashImage.width, receptorFlashImage.height, direction));
      }
  
      let judgements = [Judgement.MARVELOUS, Judgement.PERFECT, Judgement.GREAT, Judgement.GOOD, Judgement.BAD, Judgement.MISS];
      for (let judgement of judgements) {
        this.media.judgementImageCache.set(judgement, this.getClippedRegion(judgementImage, 0, judgement * judgementImage.height / 6, judgementImage.width, judgementImage.height / 6, Direction.NONE));
      }
      console.log('MEDIA images ready');
    })

    console.log('MEDIA ready');
  }

  loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      let img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    })
  }


  getClippedRegion(image: HTMLImageElement, x: number, y: number, width: number, height: number, direction: Direction) {

    var canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');

    if (ctx == null)
      throw 'ctx must not be null';

    canvas.width = width;
    canvas.height = height;

    var halfWidth = canvas.width / 2;
    var halfHeight = canvas.height / 2;
    var angleInRadians = 0;
    switch (direction) {
      case Direction.LEFT: angleInRadians = 90 * Math.PI / 180; break;
      case Direction.DOWN: angleInRadians = 0; break;
      case Direction.RIGHT: angleInRadians = -90 * Math.PI / 180; break;
      case Direction.UP: angleInRadians = 180 * Math.PI / 180; break;
    }

    ctx.translate(halfWidth, halfHeight);
    ctx.rotate(angleInRadians);
    //source region dest. region
    ctx.drawImage(image, x, y, width, height, -halfWidth, -halfHeight, width, height);
    ctx.rotate(-angleInRadians);
    ctx.translate(-halfWidth, -halfHeight);

    return canvas;
  }


}
