import { Direction, Judgement, NoteQuantization, NoteType } from './enums';

export class Note {
    type: NoteType;
    time: number;
    quantization: NoteQuantization;
    totalBeat: number;
    direction: Direction;

    /**
     * @description Time when last time hold/roll turned active/inactive
     * @values Null - Hold is held, Roll not stepped a single time
     */
    stateChangeTime: number | null = null;
    
    startedJudging: boolean = false;
    judged: boolean = false;
    judgement: Judgement = Judgement.NONE;
    precision: number | null = null;
    //For hold/roll body/tail
    related?: Note;
    mineDisplayRotationOffset = Math.round(Math.random()*1000);
    trackIndex: number;

    constructor(direction: Direction, type: NoteType, time: number, quantization: NoteQuantization, totalBeat: number, related: Note | undefined, trackIndex: number) {
        this.direction = direction;
        this.type = type;
        this.time = time;
        this.quantization = quantization;
        this.totalBeat = totalBeat;
        this.related = related;
        this.trackIndex = trackIndex;
    }

    reset(){
        this.startedJudging = false;
        this.stateChangeTime = null;
        this.judged = false;
        this.judgement = Judgement.NONE;
        this.precision = null;
    }
}