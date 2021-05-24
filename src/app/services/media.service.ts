import { EventEmitter, Injectable } from '@angular/core';
import { AllDirections, AllJudgements, AllNoteQuantizations, Direction, Judgement, NoteQuantization } from '@models/enums';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { Log } from './log.service';

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


  mineImageCache = new Map<Direction, Map<Number, HTMLCanvasElement>>([
    [Direction.LEFT, new Map<Number, HTMLCanvasElement>()],
    [Direction.DOWN, new Map<Number, HTMLCanvasElement>()],
    [Direction.UP, new Map<Number, HTMLCanvasElement>()],
    [Direction.RIGHT, new Map<Number, HTMLCanvasElement>()]
  ]);

  mineHitSoundCache?: HTMLAudioElement;

  mineHitSoundLoad = this.loadAudio("/assets/Sounds/MineHit.ogg");

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

  mineImageLoad = this.loadImage("/assets/Images/Mine.png");

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
      rollCapInactive: this.rollCapInactiveLoad,
      mine: this.mineImageLoad,
      mineHit: this.mineHitSoundLoad,
    }).subscribe(media => {
      this.mineHitSoundCache = media.mineHit;
      this.mineHitSoundCache.volume = 0.5;

      for (let direction of AllDirections) {
        let arrowImageDirectionCache = this.arrowImageCache.get(direction);
        if (arrowImageDirectionCache) {
          for (let index = 0; index < AllNoteQuantizations.length; index++) {
            let quantization = AllNoteQuantizations[index];
            arrowImageDirectionCache.set(quantization, this.adjustImage(media.arrow, noteSize, 0, media.arrow.height / 8 * index, undefined, media.arrow.height / 8, this.directionToRadians(direction)));
          }
        }

        this.receptorImageCache.set(direction, this.adjustImage(media.receptor, noteSize, 0, 0, undefined, undefined, this.directionToRadians(direction)));
        this.receptorFlashImageCache.set(direction, this.adjustImage(media.receptorFlash, noteSize, 0, 0, undefined, undefined, this.directionToRadians(direction)));
        let arrowGlowImageDirectionCache = this.arrowGlowImageCache.get(direction);
        if (arrowGlowImageDirectionCache) {
          for (let judgement of AllJudgements) {
            arrowGlowImageDirectionCache.set(judgement, this.adjustImage(media.arrowGlow, noteSize, 0, 0, undefined, undefined, this.directionToRadians(direction), judgement));
          }
        }
        let mineImageDirectionCache = this.mineImageCache.get(direction);
        if (mineImageDirectionCache) {
          for (let angle = 0; angle < 360; angle++) {
            mineImageDirectionCache.set(angle, this.adjustImage(media.mine, noteSize, 0, media.mine.width / 4 * direction, media.mine.width / 4, media.mine.height / 2, angle * Math.PI / 180));
          }
        }
      }

      this.holdBodyActiveImageCache = this.adjustImage(media.holdBodyActive, noteSize, undefined, undefined, undefined, undefined, undefined, undefined, Math.round(media.holdBodyActive.height * noteSize / 100));
      this.holdBodyInactiveImageCache = this.adjustImage(media.holdBodyInactive, noteSize, undefined, undefined, undefined, undefined, undefined, undefined, Math.round(media.holdBodyInactive.height * noteSize / 100));
      this.holdCapActiveImageCache = this.adjustImage(media.holdCapActive, noteSize, undefined, undefined, undefined, undefined, undefined, undefined, Math.round(media.holdCapActive.height * noteSize / 100));
      this.holdCapInactiveImageCache = this.adjustImage(media.holdCapInactive, noteSize, undefined, undefined, undefined, undefined, undefined, undefined, Math.round(media.holdCapInactive.height * noteSize / 100));
      this.rollBodyActiveImageCache = this.adjustImage(media.rollBodyActive, noteSize, undefined, undefined, undefined, undefined, undefined, undefined, Math.round(media.rollBodyActive.height * noteSize / 100));
      this.rollBodyInactiveImageCache = this.adjustImage(media.rollBodyInactive, noteSize, undefined, undefined, undefined, undefined, undefined, undefined, Math.round(media.rollBodyInactive.height * noteSize / 100));
      this.rollCapActiveImageCache = this.adjustImage(media.rollCapActive, noteSize, undefined, undefined, undefined, undefined, undefined, undefined, Math.round(media.rollCapActive.height * noteSize / 100));
      this.rollCapInactiveImageCache = this.adjustImage(media.rollCapInactive, noteSize, undefined, undefined, undefined, undefined, undefined, undefined, Math.round(media.rollCapInactive.height * noteSize / 100));




      for (let judgement of AllJudgements) {
        this.judgementImageCache.set(judgement, this.adjustImage(media.judgement, null, 0, judgement * media.judgement.height / 6, media.judgement.width, media.judgement.height / 6).toDataURL());
      }
      Log.debug('MEDIA images ready');
      this.onMediaLoaded.next(true);
    })
  }

  directionToRadians(rotateByDirection: Direction) {
    switch (rotateByDirection) {
      case Direction.LEFT: return 90 * Math.PI / 180;
      case Direction.DOWN: return 0;
      case Direction.RIGHT: return -90 * Math.PI / 180;
      case Direction.UP: return 180 * Math.PI / 180;
      default: return 0;
    }
  }

  loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      let img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    })
  }

  loadAudio(src: string) {
    return new Promise<HTMLAudioElement>((resolve, reject) => {
      let audio = new Audio();
      audio.oncanplaythrough = () => resolve(audio);
      audio.onerror = reject;
      audio.src = src;
      audio.load();
    })
  }


  adjustImage(image: HTMLImageElement, noteSize: number | null = null, clipStartX: number = 0, clipStartY: number = 0, clipWidth: number = image.width, clipHeight: number = image.height, rotateByRadians: number = 0, colorByJudgement: Judgement = Judgement.NONE, noteHeight: number | null = noteSize) {

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    if (ctx == null)
      throw 'ctx must not be null';
    ctx.imageSmoothingEnabled = false;

    canvas.width = noteSize ?? clipWidth;
    canvas.height = noteHeight ?? clipHeight;

    var halfWidth = canvas.width / 2;
    var halfHeight = canvas.height / 2;

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
    ctx.rotate(rotateByRadians);
    //source region dest. region    
    ctx.drawImage(image, clipStartX, clipStartY, clipWidth, clipHeight, -halfWidth, -halfHeight, canvas.width, canvas.height);
    ctx.rotate(-rotateByRadians);
    ctx.translate(-halfWidth, -halfHeight);

    return canvas;
  }
}
