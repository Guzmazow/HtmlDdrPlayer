import { Note } from './note';

export class FullParse {
    offset: number = 0;
    bpms: { beat: number; bpm: number }[] = [];
    stops: { stopDuration: number; beat: number }[] = [];
    tracks: Note[][] = [];
}