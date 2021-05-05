import { DisplayContext } from "./display-context";
import { Direction, NoteType } from "./note-enums";

export class Receptor {
    x: number;
    y: number;
    direction: Direction;

    constructor(x: number, y: number, flash: boolean, direction: Direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
    }

    draw(dCtx: DisplayContext) {
        let ctx = dCtx.receptorCanvasCtx;
        ctx.drawImage(dCtx.media.receptorImageCache.get(this.direction)!, this.x, this.y, dCtx.displayOptions.noteSize, dCtx.displayOptions.noteSize);
    }
}
