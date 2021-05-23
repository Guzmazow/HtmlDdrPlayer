import { Judgement, NoteQuantization, NoteType, SimfileNoteType } from './enums';

export class Note {
    type: NoteType;
    time: number;
    quantization: NoteQuantization;
    totalBeat: number;
    judged: boolean = false;
    judgement: Judgement = Judgement.NONE;
    precision: number | null = null;
    //For hold/roll body/tail
    parent?: Note;

    constructor(type: SimfileNoteType, time: number, quantization: NoteQuantization, totalBeat: number) {
        switch (type) {
            case SimfileNoteType.EMPTY: this.type = NoteType.EMPTY; break;
            case SimfileNoteType.NORMAL: this.type = NoteType.NORMAL; break;
            case SimfileNoteType.HOLD_HEAD: this.type = NoteType.HOLD_HEAD; break;
            case SimfileNoteType.TAIL: this.type = NoteType.HOLD_ROLL_TAIL; break;
            case SimfileNoteType.ROLL_HEAD: this.type = NoteType.ROLL_HEAD; break;
            case SimfileNoteType.MINE: this.type = NoteType.MINE; break;
            default: this.type = NoteType.NONE;
        }
        this.time = time;
        this.quantization = quantization;
        this.totalBeat = totalBeat;
    }
}