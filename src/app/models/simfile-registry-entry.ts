import { SimfileRegistryYoutubeInfo } from "./simfile-registry-youtube-info";

export interface SimfileRegistryEntry {
    filename: string;
    status?: string;
    youtubeVideos: SimfileRegistryYoutubeInfo[];
    simfileDataBase64?: string
}
