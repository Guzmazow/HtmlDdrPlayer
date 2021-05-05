import { NoteType } from './enums';

export class Note {
    type: NoteType;
    time: number;
    pressed: boolean = false;
    precision: number | null = null;

    constructor(type: NoteType, time: number) {
        this.type = type;
        this.time = time;
    }
}