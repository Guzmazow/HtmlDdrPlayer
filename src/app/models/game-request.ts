import { ParsedSimfileFolder } from "./parsed-folder";
import { ParsedSimfile } from "./parsed-simfile";
import { ParsedSimfileMode } from "./parsed-simfile-mode";
import { SimfileRegistryYoutubeInfo } from "./simfile-registry-youtube-info";

export class GameRequest {
    simfileFolder: ParsedSimfileFolder;
    parsedSimfile: ParsedSimfile;
    parsedSimfileMode: ParsedSimfileMode;
    youtubeVideo: SimfileRegistryYoutubeInfo;

    constructor(simfileFolder: ParsedSimfileFolder, parsedSimfile: ParsedSimfile, parsedSimfileMode: ParsedSimfileMode, youtubeVideo: SimfileRegistryYoutubeInfo) {
        this.simfileFolder = simfileFolder;
        this.parsedSimfile = parsedSimfile;
        this.parsedSimfileMode = parsedSimfileMode;
        this.parsedSimfileMode.resetJudgement();
        this.youtubeVideo = youtubeVideo;
    }
}
