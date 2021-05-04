import { DisplayContext } from './display-context';

export class HoldConnector {
    x: number;
    startY: number;
    endY: number;

    constructor(x: number, startY: number, endY: number) {
        this.x = x;
        this.startY = startY;
        this.endY = endY;
    }

    draw(dCtx: DisplayContext) {
        let ctx = dCtx.noteLaneCanvasCtx;
        ctx.save();
        ctx.fillStyle = "black"
        ctx.fillRect(this.x + dCtx.displayOptions.noteSize * 0.25, this.startY, dCtx.displayOptions.noteSize * 0.5, this.endY - this.startY);
        ctx.restore();
    }
}