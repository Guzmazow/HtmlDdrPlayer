import { NgxY2PlayerOptions } from "ngx-y2-player";

export interface SimfileRegistryVideo {
    id: string;
    offset?: number;
}

export interface SimfileRegistryYoutubeInfo extends SimfileRegistryVideo {
    skips: {
        from: number,
        to: number,
        skipped?: boolean
    }[];
    previewOptions?: NgxY2PlayerOptions;
}

export interface SimfileRegistryDailyMotionInfo extends SimfileRegistryVideo {
    iFrameUrl?: string;
}
