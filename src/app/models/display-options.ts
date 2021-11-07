export class DisplayOptions {

    noteLaneWidth: number;
    trackSize: number;
    noteSize: number;
    noteSpacingSize: number;
    noteTopPadding: number;

    constructor(noteLaneWidth: number, trackCount: number) {
        this.noteLaneWidth = noteLaneWidth;
        this.trackSize = Math.round(noteLaneWidth / trackCount);
        this.noteSize = Math.round(this.trackSize * 0.9);
        this.noteSpacingSize = Math.round(this.trackSize * 0.1 / 2)
        this.noteTopPadding = Math.round(this.noteSize / 4);
    }



}
