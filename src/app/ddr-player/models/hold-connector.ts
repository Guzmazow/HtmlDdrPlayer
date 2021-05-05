import { DisplayContext } from './display-context';
import { Note } from './note';
import { NoteType } from './note-enums';

export class HoldConnector {
    x: number;
    startY: number;
    endY: number;
    startNote: Note;

    constructor(x: number, startY: number, endY: number, startNote: Note) {
        this.x = x;
        this.startY = startY;
        this.endY = endY;
        this.startNote = startNote;
    }

    draw(dCtx: DisplayContext) {
        let ctx = dCtx.noteLaneCanvasCtx;
        ctx.save();
        switch (this.startNote.type) {
            case NoteType.HOLD_HEAD:
                ctx.fillStyle = "orange";
                break;
            case NoteType.ROLL_HEAD:
                ctx.fillStyle = "green";
                break;
            default:
                ctx.fillStyle = "black";
                break;
        }
        ctx.fillRect(this.x + dCtx.displayOptions.noteSize * 0.25, this.startY, dCtx.displayOptions.noteSize * 0.5, this.endY - this.startY);
        ctx.restore();
    }

}