import { FullParse } from './full-parse';
import { Media } from './media';
import { i18nMetaToJSDoc } from '@angular/compiler/src/render3/view/i18n/meta';

export class DisplayContext {
    noteLaneCanvas: HTMLCanvasElement;
    receptorCanvas: HTMLCanvasElement;
    judgementCanvas: HTMLCanvasElement;

    noteLaneCanvasCtx: CanvasRenderingContext2D;
    receptorCanvasCtx: CanvasRenderingContext2D;
    judgementCanvasCtx: CanvasRenderingContext2D;

    fullParse: FullParse;
    media: Media;

    constructor(
        noteLaneCanvas: HTMLCanvasElement,
        receptorCanvas: HTMLCanvasElement,
        judgementCanvas: HTMLCanvasElement,
        fullParse: FullParse,
        media: Media
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

        this.fullParse = fullParse;
        this.media = media;
    }

}
