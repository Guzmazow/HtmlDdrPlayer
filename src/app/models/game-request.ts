import { ParsedSimfile } from "./parsed-simfile";
import { ParsedSimfileMode } from "./parsed-simfile-mode";
import { PlayableSimfileMode } from "./playable-simfile-mode";

export class GameRequest {
    parsedSimfile: ParsedSimfile;
    parsedSimfileMode: ParsedSimfileMode;
    playableSimfileMode: PlayableSimfileMode;
    youtubeVideoId: string;

    constructor(parsedSimfile: ParsedSimfile, parsedSimfileMode: ParsedSimfileMode, youtubeVideoId: string) {
        this.parsedSimfile = parsedSimfile;
        this.parsedSimfileMode = parsedSimfileMode;
        this.youtubeVideoId = youtubeVideoId;
        this.playableSimfileMode = new PlayableSimfileMode(parsedSimfile, parsedSimfileMode);
    }
}
