import { Note } from "./note";

export class SelectedMode {
    metaData: Map<string, string> = new Map<string, string>();
    offset: number = 0;
    bpms: { beat: number; bpm: number }[] = [];
    stops: { stopDuration: number; beat: number }[] = [];
    tracks: Note[][] = [];
}
