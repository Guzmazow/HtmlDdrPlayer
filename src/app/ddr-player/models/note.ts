import { NoteType } from './note-enums';

export class Note {
    type: NoteType = NoteType.NONE;
    time: number = 0;
}