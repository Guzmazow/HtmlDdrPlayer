import { SimfileRegistryYoutubeInfo } from "./simfile-registry-youtube-info";

export interface SimfileRegistryEntry {
    filename: string;
    youtubeVideos: SimfileRegistryYoutubeInfo[];
}
