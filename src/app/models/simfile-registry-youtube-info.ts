export interface SimfileRegistryYoutubeInfo {
    id: string,
    offset?: number,
    skips: {
        from: number,
        to: number | null,
        skipped?: boolean
    }[]
}
