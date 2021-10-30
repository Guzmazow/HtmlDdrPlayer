import { NgxY2PlayerOptions } from "ngx-y2-player";

export interface SimfileRegistryYoutubeInfo {
    id: string,
    offset?: number,
    skips: {
        from: number,
        to: number,
        skipped?: boolean
    }[]
    previewOptions?: NgxY2PlayerOptions
}
