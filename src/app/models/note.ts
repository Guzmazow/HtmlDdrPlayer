import { Judgement, NoteQuantization, NoteType, SimfileNoteType } from './enums';

export class Note {
    type: NoteType;
    time: number;
    quantization: NoteQuantization;
    totalBeat: number;
    startedJudging: boolean = false;
    //Time when last time hold/roll turned active/inactive
    stateChangeTime: number = 0;
    judged: boolean = false;
    judgement: Judgement = Judgement.NONE;
    precision: number | null = null;
    //For hold/roll body/tail
    related?: Note;

    constructor(type: NoteType, time: number, quantization: NoteQuantization, totalBeat: number, related: Note | undefined) {
        this.type = type;
        this.time = time;
        this.quantization = quantization;
        this.totalBeat = totalBeat;
        this.related = related;
    }
}