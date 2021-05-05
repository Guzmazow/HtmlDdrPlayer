import { NoteType, Direction } from "./enums";
import { DisplayContext } from './display-context';

export class NoteDisplay {
    x: number;
    y: number;
    noteType: NoteType;
    direction: Direction;

    constructor(x: number, y: number, noteType: NoteType, direction: Direction) {
        this.x = x;
        this.y = y;
        this.noteType = noteType;
        this.direction = direction;
    }



    draw(dCtx: DisplayContext) {
        let ctx = dCtx.noteLaneCanvasCtx;
        
        ctx.save();
        ctx.fillStyle = "black";
        let halfNoteSize = dCtx.displayOptions.noteSize * 0.5;
        let ninthNoteSize = dCtx.displayOptions.noteSize * 0.9;
        switch (this.noteType) {
            case NoteType.NORMAL:
                //ctx.fillRect(this.x, this.y, 40, 40);
                ctx.drawImage(dCtx.media.arrowImageCache.get(this.direction)!, this.x, this.y, dCtx.displayOptions.noteSize, dCtx.displayOptions.noteSize);
                break;
            case NoteType.HOLD_HEAD: // Hold head
                ctx.fillRect(this.x, this.y, dCtx.displayOptions.noteSize, dCtx.displayOptions.noteSize);
                ctx.font = `${dCtx.displayOptions.noteSize}px Arial`;
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                ctx.fillText("H", this.x + halfNoteSize, this.y + ninthNoteSize, dCtx.displayOptions.noteSize);
                break;
            case NoteType.TAIL:
                ctx.strokeRect(this.x, this.y, dCtx.displayOptions.noteSize, dCtx.displayOptions.noteSize);
                break;
            case NoteType.ROLL_HEAD:
                ctx.fillRect(this.x, this.y, dCtx.displayOptions.noteSize, dCtx.displayOptions.noteSize);
                ctx.font = `${dCtx.displayOptions.noteSize}px Arial`;
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                ctx.fillText("R", this.x + halfNoteSize, this.y + ninthNoteSize, dCtx.displayOptions.noteSize);
                break;
            case NoteType.MINE:
                ctx.beginPath();
                ctx.arc(this.x + halfNoteSize, this.y + halfNoteSize, halfNoteSize, 0, 2 * Math.PI);
                ctx.fill();
                // ctx.fillRect(this.x, this.y, 40, 40);
                ctx.font = `${dCtx.displayOptions.noteSize}px Arial`;
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                ctx.fillText("M", this.x + halfNoteSize, this.y + ninthNoteSize, dCtx.displayOptions.noteSize);
                break;
            default:
                ctx.strokeRect(this.x, this.y, dCtx.displayOptions.noteSize, dCtx.displayOptions.noteSize);
                ctx.font = `${dCtx.displayOptions.noteSize}px Arial`;
                ctx.textAlign = "center";
                ctx.fillText("?", this.x + halfNoteSize, this.y + ninthNoteSize, dCtx.displayOptions.noteSize);
                break;
        }
        ctx.restore();
    }
}
