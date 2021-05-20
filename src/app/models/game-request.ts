import { ParsedSimfile } from "./parsed-simfile";
import { ParsedSimfileMode } from "./parsed-simfile-mode";
import { PlayableSimfileMode } from "./playable-simfile-mode";
import { SimfileRegistryFolder } from "./simfile-registry-folder";
import { SimfileRegistryYoutubeInfo } from "./simfile-registry-youtube-info";

export class GameRequest {
    simfileFolder: SimfileRegistryFolder;
    parsedSimfile: ParsedSimfile;
    parsedSimfileMode: ParsedSimfileMode;
    playableSimfileMode: PlayableSimfileMode;
    youtubeVideo: SimfileRegistryYoutubeInfo;

    constructor(simfileFolder: SimfileRegistryFolder, parsedSimfile: ParsedSimfile, parsedSimfileMode: ParsedSimfileMode, youtubeVideo: SimfileRegistryYoutubeInfo) {
        this.simfileFolder = simfileFolder;
        this.parsedSimfile = parsedSimfile;
        this.parsedSimfileMode = parsedSimfileMode;
        this.youtubeVideo = youtubeVideo;
        this.playableSimfileMode = new PlayableSimfileMode(parsedSimfile, parsedSimfileMode);
    }
}
