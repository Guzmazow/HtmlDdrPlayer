export class DisplayOptions {

    noteLaneWidth: number;
    trackSize: number;
    noteSize: number;
    noteSpacingSize: number;
    secondsPerPixel: number;
    noteTopPadding: number;

    constructor(noteLaneWidth: number, trackCount: number, secondsPerPixel: number) {
        this.noteLaneWidth = noteLaneWidth;
        this.secondsPerPixel = secondsPerPixel;
        this.trackSize = Math.round(noteLaneWidth / trackCount);
        this.noteSize = Math.round(this.trackSize * 0.9);
        this.noteSpacingSize = Math.round(this.trackSize * 0.1 / 2)
        this.noteTopPadding = Math.round(this.noteSize / 4);
    }



}
