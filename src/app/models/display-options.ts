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
        this.trackSize = noteLaneWidth / trackCount;
        this.noteSize = this.trackSize * 0.9;
        this.noteSpacingSize = this.trackSize * 0.1 / 2
        this.noteTopPadding = this.noteSize / 4;
    }



}
