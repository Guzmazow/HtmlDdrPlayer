import { NoteType, Direction } from "./note-enums";

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

    getClippedRegion(image: HTMLImageElement, x: number, y: number, width: number, height: number, direction: Direction) {

        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');
        
        if(ctx == null)
            throw 'ctx must not be null';

        canvas.width = width;
        canvas.height = height;

        var halfWidth = canvas.width / 2;
        var halfHeight = canvas.height / 2;
        var angleInRadians = 0;
        switch (direction) {
            case Direction.LEFT: angleInRadians = 90 * Math.PI / 180; break;
            case Direction.DOWN: angleInRadians = 0; break;
            case Direction.RIGHT: angleInRadians = -90 * Math.PI / 180; break;
            case Direction.UP: angleInRadians = 180 * Math.PI / 180; break;
        }

        ctx.translate(halfWidth, halfHeight);
        ctx.rotate(angleInRadians);
        //source region dest. region
        ctx.drawImage(image, x, y, width, height, -halfWidth, -halfHeight, width, height);
        ctx.rotate(-angleInRadians);
        ctx.translate(-halfWidth, -halfHeight);

        return canvas;
    }

    draw(ctx: CanvasRenderingContext2D) {
        var clip = this.getClippedRegion(<HTMLImageElement>document.getElementById("noteskin-arrow"), 0, 0, 128, 128, this.direction);
        ctx.save();
        switch (this.noteType) {
            case NoteType.NORMAL:
                //ctx.fillRect(this.x, this.y, 40, 40);
                ctx.drawImage(clip, this.x, this.y, 40, 40);
                break;
            case NoteType.HOLD_HEAD: // Hold head
                ctx.fillRect(this.x, this.y, 40, 40);
                ctx.font = "40px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                ctx.fillText("v", this.x + 20, this.y + 36, 40);
                break;
            case NoteType.TAIL:
                ctx.strokeRect(this.x, this.y, 40, 40);
                break;
            case NoteType.ROLL_HEAD:
                ctx.fillRect(this.x, this.y, 40, 40);
                ctx.font = "40px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                ctx.fillText("x", this.x + 20, this.y + 36, 40);
                break;
            case NoteType.MINE:
                ctx.beginPath();
                ctx.arc(this.x + 20, this.y + 20, 20, 0, 2 * Math.PI);
                ctx.fill();
                // ctx.fillRect(this.x, this.y, 40, 40);
                ctx.font = "40px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                ctx.fillText("X", this.x + 20, this.y + 36, 40);
                break;
            default:
                ctx.strokeRect(this.x, this.y, 40, 40);
                ctx.font = "40px Arial";
                ctx.textAlign = "center";
                ctx.fillText("?", this.x + 20, this.y + 36, 40);
                break;
        }
        ctx.restore();
    }
}
