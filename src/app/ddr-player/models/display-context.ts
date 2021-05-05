import { FullParse } from './full-parse';
import { Media } from './media';
import { i18nMetaToJSDoc } from '@angular/compiler/src/render3/view/i18n/meta';
import { PartialParse } from './partial-parse';
import { DisplayService } from '../display.service';
import { DisplayOptions } from './display-options';
import { NoteManager } from './note-manager';

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

    noteManager!: NoteManager;

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
    }

}
