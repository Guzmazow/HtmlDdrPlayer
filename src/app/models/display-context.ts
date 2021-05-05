import { FullParse } from './full-parse';
import { Media } from './media';
import { PartialParse } from './partial-parse';
import { DisplayOptions } from './display-options';

export class DisplayContext {
    noteLaneCanvas: HTMLCanvasElement;
    receptorCanvas: HTMLCanvasElement;
    judgementCanvas: HTMLCanvasElement;

    noteLaneCanvasCtx: CanvasRenderingContext2D;
    receptorCanvasCtx: CanvasRenderingContext2D;
    judgementCanvasCtx: CanvasRenderingContext2D;

    partialParse: PartialParse;
    fullParse: FullParse;
    media: Media;
    displayOptions: DisplayOptions;

    currentTime: number;

    constructor(
        noteLaneCanvas: HTMLCanvasElement,
        receptorCanvas: HTMLCanvasElement,
        judgementCanvas: HTMLCanvasElement,
        partialParse: PartialParse,
        fullParse: FullParse,
        media: Media,
        displayOptions: DisplayOptions,
    ) {
        this.noteLaneCanvas = noteLaneCanvas;
        this.receptorCanvas = receptorCanvas;
        this.judgementCanvas = judgementCanvas;

        let noteLaneCanvasCtx = noteLaneCanvas.getContext('2d');
        let receptorCanvasCtx = receptorCanvas.getContext('2d');
        let judgementCanvasCtx = judgementCanvas.getContext('2d');

        if(noteLaneCanvasCtx) this.noteLaneCanvasCtx = noteLaneCanvasCtx; else throw 'there must be a 2d context';
        if(receptorCanvasCtx) this.receptorCanvasCtx = receptorCanvasCtx; else throw 'there must be a 2d context';
        if(judgementCanvasCtx) this.judgementCanvasCtx = judgementCanvasCtx; else throw 'there must be a 2d context';

        this.partialParse = partialParse;
        this.fullParse = fullParse;
        this.currentTime = fullParse.offset;
        this.media = media;
        this.displayOptions = displayOptions;

        this.noteLaneCanvas.height = screen.height;
        this.noteLaneCanvas.width = this.displayOptions.noteLaneWidth;
        this.receptorCanvas.height = screen.height;
        this.receptorCanvas.width = this.displayOptions.noteLaneWidth;
        this.judgementCanvas.height = screen.height;
        this.judgementCanvas.width = screen.width;
    }

    getNoteX(trackNumber: number) {
        return this.displayOptions.noteSpacingSize + trackNumber * this.displayOptions.trackSize;
    }

    getNoteY(noteTime: number) {
        let timeDistance = noteTime - this.currentTime;
        return timeDistance / this.displayOptions.secondsPerPixel;
    }

}
