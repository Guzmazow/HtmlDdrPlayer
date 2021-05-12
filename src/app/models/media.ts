import { Direction, Judgement } from './enums';

export class Media {
    audio!: HTMLAudioElement;
    video!: YT.Player;
    
    arrowImageCache = new Map<Direction, HTMLCanvasElement>();
    receptorImageCache = new Map<Direction, HTMLCanvasElement>();
    receptorFlashImageCache = new Map<Direction, HTMLCanvasElement>();
    receptorGlowImageCache = new Map<Direction, Map<Judgement, HTMLCanvasElement>>([
        [Direction.LEFT, new Map<Judgement, HTMLCanvasElement>()],
        [Direction.DOWN, new Map<Judgement, HTMLCanvasElement>()],
        [Direction.UP, new Map<Judgement, HTMLCanvasElement>()],
        [Direction.RIGHT, new Map<Judgement, HTMLCanvasElement>()]
    ]);
    judgementImageCache = new Map<Judgement, string>();

    constructor() {

    }
}
