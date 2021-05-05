import { Note } from './note';
import { DisplayContext } from './display-context';
import { NoteType } from './note-enums';
import { NoteDisplay } from './note-display';
import { HoldConnector } from './hold-connector';

export class NoteManager {
    displayContext: DisplayContext;

    constructor(displayContext: DisplayContext) {
        this.displayContext = displayContext;
    }

    draw() {
        this.clear();
        this.drawNotesAndConnectors();
    }

    drawNotesAndConnectors() {
        let leastTime = this.displayContext.currentTime;
        let greatestTime = leastTime + this.displayContext.noteLaneCanvas.height * this.displayContext.displayOptions.secondsPerPixel;
        this.drawAllConnectors(leastTime, greatestTime);
        this.drawAllNotes(leastTime, greatestTime);
    }

    drawAllNotes(leastTime: number, greatestTime: number) {
        for (let i = 0; i < this.displayContext.fullParse.tracks.length; i++) {
            this.drawNotesInTrack(leastTime, greatestTime, this.displayContext.fullParse.tracks[i], i,
                this.displayContext.fullParse.tracks.length);
        }
    }

    drawNotesInTrack(leastTime: number, greatestTime: number, track: Note[], trackNumber: number,
        numTracks: number) {
        let bounds = this.getFirstAndLastNotes(leastTime, greatestTime, track);
        for (let i = bounds.start; i <= bounds.stop; i++) {
            this.drawNote(track[i], trackNumber, numTracks);
        }
    }

    drawNote(note: Note, trackNumber: number, numTracks: number) {
        let x = this.getNoteX(trackNumber);
        let y = this.getNoteY(note.time);
        new NoteDisplay(x, y, note.type, trackNumber % 4).draw(this.displayContext);
    }

    //TODO: properly indicate when there are NO notes to draw
    getFirstAndLastNotes(leastTime: number, greatestTime: number, track: Note[]) {
        let i;
        for (i = 0; i < track.length; i++) {
            if (track[i].time > leastTime) {
                break;
            }
        }
        i = Math.max(0, i - 1);
        let j;
        for (j = i; j < track.length; j++) {
            if (track[j].time > greatestTime) {
                break;
            }
        }
        j = Math.max(0, j - 1);
        return { start: i, stop: j };
    }

    clear() {
        this.displayContext.noteLaneCanvasCtx.clearRect(0, 0, this.displayContext.noteLaneCanvas.width, this.displayContext.noteLaneCanvas.height);
    }

    getNoteX(trackNumber: number) {
        return  this.displayContext.displayOptions.noteSpacingSize + trackNumber * this.displayContext.displayOptions.trackSize;
    }

    getNoteY(noteTime: number) {
        let timeDistance = noteTime - this.displayContext.currentTime;
        return timeDistance / this.displayContext.displayOptions.secondsPerPixel;
    }

    drawAllConnectors(leastTime: number, greatestTime: number) {
        for (let i = 0; i < this.displayContext.fullParse.tracks.length; i++) {
            this.drawConnectorsInTrack(leastTime, greatestTime, this.displayContext.fullParse.tracks[i], i,
                this.displayContext.fullParse.tracks.length);
        }
    }

    drawConnectorsInTrack(leastTime: number, greatestTime: number, track: Note[], trackNumber: number,
        numTracks: number) {
        let noteStack: Note[] = [];
        for (let i = 0; i < track.length; i++) {
            let currentNote: Note = track[i];
            if (currentNote.time < leastTime) {
                if (currentNote.type === NoteType.HOLD_HEAD || currentNote.type === NoteType.ROLL_HEAD) {
                    noteStack.push(currentNote);
                } else if (currentNote.type === NoteType.TAIL) {
                    noteStack.pop();
                }
            } else if (currentNote.time < greatestTime) {
                if (currentNote.type === NoteType.HOLD_HEAD || currentNote.type === NoteType.ROLL_HEAD) {
                    noteStack.push(currentNote);
                } else if (currentNote.type === NoteType.TAIL) {
                    let startNote = noteStack.pop();
                    let endNote = currentNote;
                    if (startNote != undefined && endNote != undefined) {
                        this.drawConnector(startNote, endNote, trackNumber, numTracks);
                    }
                }
            } else {
                if (noteStack.length == 0) {
                    break;
                }
                if (currentNote.type === NoteType.HOLD_HEAD || currentNote.type === NoteType.ROLL_HEAD) {
                    noteStack.push(currentNote);
                } else if (currentNote.type === NoteType.TAIL) {
                    let startNote = noteStack.pop();
                    let endNote = currentNote;
                    if (startNote != undefined && endNote != undefined) {
                        this.drawConnector(startNote, endNote, trackNumber, numTracks);
                    }
                }
            }
        }
    }

    drawConnector(startNote: Note, endNote: Note, trackNumber: number, numTracks: number) {
        let x = this.getNoteX(trackNumber);
        let startY = this.getNoteY(startNote.time);
        let endY = this.getNoteY(endNote.time);
        new HoldConnector(x, startY, endY, startNote).draw(this.displayContext);
    }
}