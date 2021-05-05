import { FullParse } from "./full-parse";

export class DisplayOptions {

    noteLaneWidth: number;
    trackSize: number;
    noteSize: number;
    noteSpacingSize: number;
    secondsPerPixel: number;

    constructor(noteLaneWidth: number, fullParse: FullParse, secondsPerPixel: number) {
        this.noteLaneWidth = noteLaneWidth;
        this.secondsPerPixel = secondsPerPixel;
        this.trackSize = noteLaneWidth / fullParse.tracks.length;
        this.noteSize = this.trackSize * 0.8;
        this.noteSpacingSize = this.trackSize * 0.2 / 2
    }


}
