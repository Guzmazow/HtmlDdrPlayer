export class HoldConnector {
    x: number;
    startY: number;
    endY: number;

    constructor(x: number, startY: number, endY: number) {
        this.x = x;
        this.startY = startY;
        this.endY = endY;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.fillRect(this.x + 10, this.startY, 20, this.endY - this.startY);
        ctx.restore();
    }
}