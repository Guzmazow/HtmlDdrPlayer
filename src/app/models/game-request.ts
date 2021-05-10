import { ParsedSimfile } from "./parsed-simfile";
import { ParsedSimfileMode } from "./parsed-simfile-mode";

export class GameRequest {
    parsedSimfile: ParsedSimfile;
    parsedSimfileMode: ParsedSimfileMode;
    youtubeVideoId: string;

    constructor(parsedSimfile: ParsedSimfile, parsedSimfileMode: ParsedSimfileMode, youtubeVideoId: string) {
        this.parsedSimfile = parsedSimfile;
        this.parsedSimfileMode = parsedSimfileMode;
        this.youtubeVideoId = youtubeVideoId;
    }
}
