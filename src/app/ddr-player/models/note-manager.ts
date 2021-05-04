import { Note } from './note';
import { DisplayContext } from './display-context';
import { NoteType } from './note-enums';
import { NoteDisplay } from './note-display';
import { HoldConnector } from './hold-connector';

export class NoteManager {
    displayContext: DisplayContext;

    secondsPerPixel: number;
    currentTime: number;

    constructor(displayContext: DisplayContext) {
        this.displayContext = displayContext;        
        this.currentTime = displayContext.fullParse.offset + 10;
        this.secondsPerPixel = 0.0010;

        requestAnimationFrame(this.tick.bind(this));
    }

    tick() {
        //let timeChange = e.deltaY * this.secondsPerPixel;
        this.currentTime += 0.01;//timeChange;
        this.draw();
        requestAnimationFrame(this.tick.bind(this));
    }

    draw() {
        this.clear();
        this.drawNotesAndConnectors();
    }

    drawNotesAndConnectors() {
        let leastTime = this.getLeastTime(this.currentTime);
        let greatestTime = this.getGreatestTime(leastTime);
        this.drawAllConnectors(leastTime, greatestTime);
        this.drawAllNotes(leastTime, greatestTime);
    }

    drawAllNotes(leastTime: number, greatestTime: number) {
        for (let i = 0; i < this.displayContext.fullParse.tracks.length; i++) {
            this.drawNotesInTrack(leastTime, greatestTime, this.displayContext.fullParse.tracks[i], i,
                this.displayContext.fullParse.tracks.length, this.currentTime);
        }
    }

    drawNotesInTrack(leastTime: number, greatestTime: number, track: Note[], trackNumber: number,
        numTracks: number, currentTime: number) {
        let bounds = this.getFirstAndLastNotes(leastTime, greatestTime, track);
        for (let i = bounds.start; i <= bounds.stop; i++) {
            this.drawNote(track[i], trackNumber, numTracks, currentTime);
        }
    }

    drawNote(note: Note, trackNumber: number, numTracks: number, currentTime: number) {
        let x = this.getNoteX(trackNumber);
        let y = this.getNoteY(note.time, currentTime);
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

    getLeastTime(currentTime: number) {
        return currentTime;
    }

    getGreatestTime(leastTime: number) {
        return leastTime + this.displayContext.noteLaneCanvas.height * this.secondsPerPixel;
    }

    getNoteX(trackNumber: number) {
        return  this.displayContext.displayOptions.noteSpacingSize + trackNumber * this.displayContext.displayOptions.trackSize;
    }

    getNoteY(noteTime: number, currentTime: number) {
        let timeDistance = noteTime - currentTime;
        return timeDistance / this.secondsPerPixel;
    }

    drawAllConnectors(leastTime: number, greatestTime: number) {
        for (let i = 0; i < this.displayContext.fullParse.tracks.length; i++) {
            this.drawConnectorsInTrack(leastTime, greatestTime, this.displayContext.fullParse.tracks[i], i,
                this.displayContext.fullParse.tracks.length, this.currentTime);
        }
    }

    drawConnectorsInTrack(leastTime: number, greatestTime: number, track: Note[], trackNumber: number,
        numTracks: number, currentTime: number) {
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
                        this.drawConnector(startNote, endNote, trackNumber, numTracks, currentTime);
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
                        this.drawConnector(startNote, endNote, trackNumber, numTracks, currentTime);
                    }
                }
            }
        }
    }

    drawConnector(startNote: Note, endNote: Note, trackNumber: number, numTracks: number, currentTime: number) {
        let x = this.getNoteX(trackNumber);
        let startY = this.getNoteY(startNote.time, currentTime);
        let endY = this.getNoteY(endNote.time, currentTime);
        new HoldConnector(x, startY, endY).draw(this.displayContext);
    }
}