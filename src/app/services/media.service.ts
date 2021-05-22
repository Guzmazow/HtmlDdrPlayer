import { EventEmitter, Injectable } from '@angular/core';
import { AllDirections, AllJudgements, AllNoteQuantizations, Direction, Judgement, NoteQuantization } from '@models/enums';
import { BehaviorSubject, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MediaService {

  onMediaLoaded = new BehaviorSubject(false);

  audio!: HTMLAudioElement;
  video!: YT.Player;

  arrowImageCache = new Map<Direction, Map<NoteQuantization, HTMLCanvasElement>>([
    [Direction.LEFT, new Map<NoteQuantization, HTMLCanvasElement>()],
    [Direction.DOWN, new Map<NoteQuantization, HTMLCanvasElement>()],
    [Direction.UP, new Map<NoteQuantization, HTMLCanvasElement>()],
    [Direction.RIGHT, new Map<NoteQuantization, HTMLCanvasElement>()]
  ]);

  arrowGlowImageCache = new Map<Direction, Map<Judgement, HTMLCanvasElement>>([
    [Direction.LEFT, new Map<Judgement, HTMLCanvasElement>()],
    [Direction.DOWN, new Map<Judgement, HTMLCanvasElement>()],
    [Direction.UP, new Map<Judgement, HTMLCanvasElement>()],
    [Direction.RIGHT, new Map<Judgement, HTMLCanvasElement>()]
  ]);

  receptorImageCache = new Map<Direction, HTMLCanvasElement>();
  receptorFlashImageCache = new Map<Direction, HTMLCanvasElement>();

  judgementImageCache = new Map<Judgement, string>();

  holdBodyActiveImageCache?: HTMLCanvasElement;
  holdBodyInactiveImageCache?: HTMLCanvasElement;
  holdCapActiveImageCache?: HTMLCanvasElement;
  holdCapInactiveImageCache?: HTMLCanvasElement;

  rollBodyActiveImageCache?: HTMLCanvasElement;
  rollBodyInactiveImageCache?: HTMLCanvasElement;
  rollCapActiveImageCache?: HTMLCanvasElement;
  rollCapInactiveImageCache?: HTMLCanvasElement;

  arrowImageLoad = this.loadImage("/assets/Images/Arrow.png");
  arrowGlowImageLoad = this.loadImage("/assets/Images/ArrowGlow.png");

  receptorImageLoad = this.loadImage("/assets/Images/ArrowReceptor.png");
  receptorFlashImageLoad = this.loadImage("/assets/Images/ArrowReceptorFlash.png");

  holdBodyActiveLoad = this.loadImage("/assets/Images/HoldBodyActive.png");
  holdBodyInactiveLoad = this.loadImage("/assets/Images/HoldBodyInactive.png");
  holdCapActiveLoad = this.loadImage("/assets/Images/HoldCapActive.png");
  holdCapInactiveLoad = this.loadImage("/assets/Images/HoldCapInactive.png");

  rollBodyActiveLoad = this.loadImage("/assets/Images/RollBodyActive.png");
  rollBodyInactiveLoad = this.loadImage("/assets/Images/RollBodyInactive.png");
  rollCapActiveLoad = this.loadImage("/assets/Images/RollCapActive.png");
  rollCapInactiveLoad = this.loadImage("/assets/Images/RollCapInactive.png");

  judgementImageLoad = this.loadImage("/assets/Images/Judgement.png");

  constructor() {

  }

  setPlayer(target: YT.Player) {
    this.video = target;
  }

  prepareMedia(noteSize: number) {
    // let filename = this.parsingService.metaData.get("MUSIC");
    // if (filename) {
    //   this.media.audio = new Audio(`${this.parsingService.smFileLocation.substring(0, this.parsingService.smFileLocation.lastIndexOf("/"))}/${filename}`);
    //   this.media.audio.load();
    // }

    forkJoin({
      arrow: this.arrowImageLoad,
      arrowGlow: this.arrowGlowImageLoad,
      receptor: this.receptorImageLoad,
      receptorFlash: this.receptorFlashImageLoad,
      judgement: this.judgementImageLoad,
      holdBodyActive: this.holdBodyActiveLoad,
      holdBodyInactive: this.holdBodyInactiveLoad,
      holdCapActive: this.holdCapActiveLoad,
      holdCapInactive: this.holdCapInactiveLoad,
      rollBodyActive: this.rollBodyActiveLoad,
      rollBodyInactive: this.rollBodyInactiveLoad,
      rollCapActive: this.rollCapActiveLoad,
      rollCapInactive: this.rollCapInactiveLoad
    }).subscribe(images => {
      for (let direction of AllDirections) {
        let arrowImageDirectionCache = this.arrowImageCache.get(direction);
        if (arrowImageDirectionCache) {
          for (let index = 0; index < AllNoteQuantizations.length; index++) {
            let quantization = AllNoteQuantizations[index];
            arrowImageDirectionCache.set(quantization, this.adjustImage(images.arrow, noteSize, 0, images.arrow.height / 8 * index, images.arrow.width, images.arrow.height / 8, direction));
          }
        }

        this.receptorImageCache.set(direction, this.adjustImage(images.receptor, noteSize, 0, 0, images.receptor.width, images.receptor.height, direction));
        this.receptorFlashImageCache.set(direction, this.adjustImage(images.receptorFlash, noteSize, 0, 0, images.receptorFlash.width, images.receptorFlash.height, direction));
        let arrowGlowImageDirectionCache = this.arrowGlowImageCache.get(direction);
        if (arrowGlowImageDirectionCache) {
          for (let judgement of AllJudgements) {
            arrowGlowImageDirectionCache.set(judgement, this.adjustImage(images.arrowGlow, noteSize, 0, 0, images.arrowGlow.width, images.arrowGlow.height, direction, judgement));
          }
        }
      }

      this.holdBodyActiveImageCache = this.adjustImage(images.holdBodyActive, noteSize);
      this.holdBodyInactiveImageCache = this.adjustImage(images.holdBodyInactive, noteSize);
      this.holdCapActiveImageCache = this.adjustImage(images.holdCapActive, noteSize);
      this.holdCapInactiveImageCache = this.adjustImage(images.holdCapInactive, noteSize);
      this.rollBodyActiveImageCache = this.adjustImage(images.rollBodyActive, noteSize);
      this.rollBodyInactiveImageCache = this.adjustImage(images.rollBodyInactive, noteSize);
      this.rollCapActiveImageCache = this.adjustImage(images.rollCapActive, noteSize);
      this.rollCapInactiveImageCache = this.adjustImage(images.rollCapInactive, noteSize);

      for (let judgement of AllJudgements) {
        this.judgementImageCache.set(judgement, this.adjustImage(images.judgement, null, 0, judgement * images.judgement.height / 6, images.judgement.width, images.judgement.height / 6).toDataURL());
      }
      console.log('MEDIA images ready');
      this.onMediaLoaded.next(true);
    })
  }

  loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      let img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    })
  }


  adjustImage(image: HTMLImageElement, noteSize: number | null, clipStartX: number = 0, clipStartY: number = 0, clipWidth: number = image.width, clipHeight: number = image.height, rotateByDirection: Direction = Direction.NONE, colorByJudgement: Judgement = Judgement.NONE) {

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    if (ctx == null)
      throw 'ctx must not be null';
    ctx.imageSmoothingEnabled = false;

    canvas.width = noteSize ?? clipWidth;
    canvas.height = noteSize ?? clipHeight;

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
    ctx.drawImage(image, clipStartX, clipStartY, clipWidth, clipHeight, -halfWidth, -halfHeight, canvas.width, canvas.height);
    ctx.rotate(-angleInRadians);
    ctx.translate(-halfWidth, -halfHeight);

    return canvas;
  }
}
