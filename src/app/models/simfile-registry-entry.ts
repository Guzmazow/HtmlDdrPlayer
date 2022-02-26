import { SimfileRegistryDailyMotionInfo, SimfileRegistryYoutubeInfo } from "./simfile-registry-video-info";

export interface SimfileRegistryEntry {
    filename: string;
    status?: string;
    youtubeVideos: SimfileRegistryYoutubeInfo[];
    dailyMotionVideos: SimfileRegistryDailyMotionInfo[];
    simfileDataBase64?: string
}
