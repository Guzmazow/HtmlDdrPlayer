import { Note } from "./note";

export interface SelectedMode {
    metaData: Map<string, string>;
    offset: number;
    bpms: { beat: number; bpm: number }[];
    stops: { stopDuration: number; beat: number }[];
    tracks: Note[][];
}
