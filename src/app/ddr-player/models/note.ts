import { NoteType } from './note-enums';

export class Note {
    type: NoteType;
    time: number;
    pressed: boolean = false;
    precision: number = Number.MIN_VALUE;

    constructor(type: NoteType, time: number) {
        this.type = type;
        this.time = time;
    }
}