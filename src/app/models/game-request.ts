import { ParsedSimfile } from "./parsed-simfile";
import { ParsedSimfileMode } from "./parsed-simfile-mode";
import { PlayableSimfileMode } from "./playable-simfile-mode";
import { SimfileRegistryYoutubeInfo } from "./simfile-registry-youtube-info";

export class GameRequest {
    parsedSimfile: ParsedSimfile;
    parsedSimfileMode: ParsedSimfileMode;
    playableSimfileMode: PlayableSimfileMode;
    youtubeVideo: SimfileRegistryYoutubeInfo;

    constructor(parsedSimfile: ParsedSimfile, parsedSimfileMode: ParsedSimfileMode, youtubeVideo: SimfileRegistryYoutubeInfo) {
        this.parsedSimfile = parsedSimfile;
        this.parsedSimfileMode = parsedSimfileMode;
        this.youtubeVideo = youtubeVideo;
        this.playableSimfileMode = new PlayableSimfileMode(parsedSimfile, parsedSimfileMode);
    }
}
