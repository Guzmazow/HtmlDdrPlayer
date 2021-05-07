import { Injectable } from '@angular/core';
import { Media } from '@models/media';
import { ParsingService } from './parsing.service';
import { AllDirections, AllJudgements, Direction, Judgement } from '@models/enums';

@Injectable({
  providedIn: 'root'
})
export class MediaService {

  media: Media = new Media();

  arrowImageLoad = this.loadImage("/assets/Noteskins/a_arrow 1x8 (doubleres).png");
  receptorGlowImageLoad = this.loadImage("/assets/Noteskins/a_glow (doubleres).png");
  receptorImageLoad = this.loadImage("/assets/Noteskins/a_receptor (doubleres).png");
  receptorFlashImageLoad = this.loadImage("/assets/Noteskins/a_rflash (doubleres).png");
  judgementImageLoad = this.loadImage("/assets/Judgements/default 1x6 (Doubleres).png");

  constructor(private parsingService: ParsingService) {

  }

  prepareMedia() {
    let filename = this.parsingService.partialParse.metaData.get("MUSIC");
    if (filename) {
      this.media.audio = new Audio(`${this.parsingService.smFileLocation.substring(0, this.parsingService.smFileLocation.lastIndexOf("/"))}/${filename}`);
      this.media.audio.load();
    }

    Promise.all([this.arrowImageLoad, this.receptorGlowImageLoad, this.receptorImageLoad, this.receptorFlashImageLoad, this.judgementImageLoad]).then((x) => {
      let arrowImage = x[0];
      let receptorGlowImage = x[1];
      let receptorImage = x[2];
      let receptorFlashImage = x[3];
      let judgementImage = x[4];

      for (let direction of AllDirections) {
        //TODO: Multi-Color arrows
        this.media.arrowImageCache.set(direction, this.adjustImage(arrowImage, 0, 0, arrowImage.width, arrowImage.height / 8, direction));
        this.media.receptorImageCache.set(direction, this.adjustImage(receptorImage, 0, 0, receptorImage.width, receptorImage.height, direction));
        this.media.receptorFlashImageCache.set(direction, this.adjustImage(receptorFlashImage, 0, 0, receptorFlashImage.width, receptorFlashImage.height, direction));
        var receptorGlowImageCache = this.media.receptorGlowImageCache.get(direction);
        if (receptorGlowImageCache) {
          for (let judgement of AllJudgements) {
            receptorGlowImageCache.set(judgement, this.adjustImage(receptorGlowImage, 0, 0, receptorGlowImage.width, receptorGlowImage.height, direction, judgement));
          }
        }
      }

      for (let judgement of AllJudgements) {
        this.media.judgementImageCache.set(judgement, this.adjustImage(judgementImage, 0, judgement * judgementImage.height / 6, judgementImage.width, judgementImage.height / 6, Direction.NONE));
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


  adjustImage(image: HTMLImageElement, clipStartX: number, clipStartY: number, clipWidth: number, clipHeight: number, rotateByDirection: Direction = Direction.NONE, colorByJudgement: Judgement = Judgement.NONE) {

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    if (ctx == null)
      throw 'ctx must not be null';

    canvas.width = clipWidth;
    canvas.height = clipHeight;

    var halfWidth = canvas.width / 2;
    var halfHeight = canvas.height / 2;
    var angleInRadians = 0;

    switch (rotateByDirection) {
      case Direction.LEFT: angleInRadians = 90 * Math.PI / 180; break;
      case Direction.DOWN: angleInRadians = 0; break;
      case Direction.RIGHT: angleInRadians = -90 * Math.PI / 180; break;
      case Direction.UP: angleInRadians = 180 * Math.PI / 180; break;
    }



    //https://codepen.io/sosuke/pen/Pjoqqp
    switch (colorByJudgement) {
      case Judgement.MARVELOUS: ctx.filter = 'invert(100%) invert(87%) sepia(7%) saturate(1647%) hue-rotate(160deg) brightness(103%) contrast(92%)'; break;
      case Judgement.PERFECT: ctx.filter = 'invert(100%) invert(100%) sepia(20%) saturate(7184%) hue-rotate(321deg) brightness(105%) contrast(104%)'; break;
      case Judgement.GREAT: ctx.filter = 'invert(100%) invert(69%) sepia(22%) saturate(3647%) hue-rotate(70deg) brightness(100%) contrast(136%)'; break;
      case Judgement.GOOD: ctx.filter = 'invert(100%) invert(82%) sepia(48%) saturate(457%) hue-rotate(60deg) brightness(102%) contrast(103%)'; break;
      case Judgement.BAD: ctx.filter = 'invert(100%) invert(30%) sepia(81%) saturate(6146%) hue-rotate(308deg) brightness(107%) contrast(101%)'; break;
      case Judgement.MISS: ctx.filter = 'invert(100%) invert(14%) sepia(87%) saturate(5317%) hue-rotate(352deg) brightness(90%) contrast(101%)'; break;
    }

    ctx.translate(halfWidth, halfHeight);
    ctx.rotate(angleInRadians);
    //source region dest. region    
    ctx.drawImage(image, clipStartX, clipStartY, clipWidth, clipHeight, -halfWidth, -halfHeight, clipWidth, clipHeight);
    ctx.rotate(-angleInRadians);
    ctx.translate(-halfWidth, -halfHeight);

    return canvas;
  }


}
