export class DisplayOptions {

    noteLaneWidth: number;
    trackSize: number;
    noteSize: number;
    noteSpacingSize: number;
    secondsPerPixel: number;

    constructor(noteLaneWidth: number, trackCount: number, secondsPerPixel: number) {
        this.noteLaneWidth = noteLaneWidth;
        this.secondsPerPixel = secondsPerPixel;
        this.trackSize = noteLaneWidth / trackCount
        this.noteSize = this.trackSize * 0.8;
        this.noteSpacingSize = this.trackSize * 0.2 / 2
    }


}
