import { Direction, Judgement } from './enums';

export class Media {
    audio!: HTMLAudioElement;
    arrowImageCache: Map<Direction, HTMLCanvasElement> = new Map<Direction, HTMLCanvasElement>();
    arrowGlowImageCache: Map<Direction, HTMLCanvasElement> = new Map<Direction, HTMLCanvasElement>();
    receptorImageCache: Map<Direction, HTMLCanvasElement> = new Map<Direction, HTMLCanvasElement>();
    receptorFlashImageCache: Map<Direction, HTMLCanvasElement> = new Map<Direction, HTMLCanvasElement>();
    judgementImageCache: Map<Judgement, HTMLCanvasElement> = new Map<Judgement, HTMLCanvasElement>();

    constructor() {

    }
}
