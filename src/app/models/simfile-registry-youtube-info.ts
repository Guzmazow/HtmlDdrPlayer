export interface SimfileRegistryYoutubeInfo {
    id: string,
    skips: {
        from: number,
        to: number | null,
        skipped?: boolean
    }[]
}
