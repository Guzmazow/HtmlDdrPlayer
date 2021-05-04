import { Direction } from './note-enums';

export class Media {
    audio!: HTMLAudioElement;
    arrowImageCache: Map<Direction,HTMLCanvasElement> = new Map<Direction,HTMLCanvasElement>();
    
    constructor(){

    }
}
