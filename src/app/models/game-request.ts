import { ParsedSimfileFolder } from "./parsed-folder";
import { ParsedSimfile } from "./parsed-simfile";
import { ParsedSimfileMode } from "./parsed-simfile-mode";
import { SimfileRegistryDailyMotionInfo, SimfileRegistryYoutubeInfo } from "./simfile-registry-video-info";

export class GameRequest {
    simfileFolder: ParsedSimfileFolder;
    parsedSimfile: ParsedSimfile;
    parsedSimfileMode: ParsedSimfileMode;
    youtubeVideo: SimfileRegistryYoutubeInfo;
    dailyMotionVideo: SimfileRegistryDailyMotionInfo;

    constructor(simfileFolder: ParsedSimfileFolder, parsedSimfile: ParsedSimfile, parsedSimfileMode: ParsedSimfileMode, youtubeVideo: SimfileRegistryYoutubeInfo, dailyMotionVideo: SimfileRegistryDailyMotionInfo) {
        this.simfileFolder = simfileFolder;
        this.parsedSimfile = parsedSimfile;
        this.parsedSimfileMode = parsedSimfileMode;
        this.parsedSimfileMode.resetJudgement();
        this.youtubeVideo = youtubeVideo;
        this.dailyMotionVideo = dailyMotionVideo;
    }
}
