enum NoteType {
    NONE = "0",
    NORMAL = "1",
    HOLD_HEAD = "2",
    TAIL = "3",
    ROLL_HEAD = "4",
    MINE = "M",
}

enum Direction {
    LEFT = 0,
    DOWN = 1,
    UP = 2,
    RIGHT = 3
}

export class Note {
    type!: string;
    time!: number;
}

let canvas: HTMLCanvasElement;

export function prepareDisplay(tracks: Note[][]) {
    canvas = <HTMLCanvasElement>document.getElementById("canvas");
    canvas.height = 700;
    canvas.width = 800;
    let noteManager: NoteManager = new NoteManager(tracks, 6);
    noteManager.draw();
    //canvas.addEventListener("wheel", e => noteManager.canvasScrolled(e));
}

class NoteDisplay {
    x: number;
    y: number;
    noteType: string;
    direction: Direction;

    constructor(x: number, y: number, noteType: string, direction: Direction) {
        this.x = x;
        this.y = y;
        this.noteType = noteType;
        this.direction = direction;
    }

    getClippedRegion(image: HTMLImageElement, x: number, y: number, width: number, height: number, direction: Direction) {

        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');
        
        if(ctx == null)
            throw 'ctx must not be null';

        canvas.width = width;
        canvas.height = height;

        var halfWidth = canvas.width / 2;
        var halfHeight = canvas.height / 2;
        var angleInRadians = 0;
        switch (direction) {
            case Direction.LEFT: angleInRadians = 90 * Math.PI / 180; break;
            case Direction.DOWN: angleInRadians = 0; break;
            case Direction.RIGHT: angleInRadians = -90 * Math.PI / 180; break;
            case Direction.UP: angleInRadians = 180 * Math.PI / 180; break;
        }

        ctx.translate(halfWidth, halfHeight);
        ctx.rotate(angleInRadians);
        //                   source region         dest. region
        ctx.drawImage(image, x, y, width, height, -halfWidth, -halfHeight, width, height);
        ctx.rotate(-angleInRadians);
        ctx.translate(-halfWidth, -halfHeight);

        return canvas;
    }

    draw() {
        let ctx = canvas.getContext("2d");
        if(ctx == null)
            throw 'ctx must not be null';

        var clip = this.getClippedRegion(<HTMLImageElement>document.getElementById("noteskin"), 0, 0, 128, 128, this.direction);
        ctx.save();
        switch (this.noteType) {
            case NoteType.NORMAL:
                //ctx.fillRect(this.x, this.y, 40, 40);
                ctx.drawImage(clip, this.x, this.y, 40, 40);
                break;
            case NoteType.HOLD_HEAD: // Hold head
                ctx.fillRect(this.x, this.y, 40, 40);
                ctx.font = "40px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                ctx.fillText("v", this.x + 20, this.y + 36, 40);
                break;
            case NoteType.TAIL:
                ctx.strokeRect(this.x, this.y, 40, 40);
                break;
            case NoteType.ROLL_HEAD:
                ctx.fillRect(this.x, this.y, 40, 40);
                ctx.font = "40px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                ctx.fillText("x", this.x + 20, this.y + 36, 40);
                break;
            case NoteType.MINE:
                ctx.beginPath();
                ctx.arc(this.x + 20, this.y + 20, 20, 0, 2 * Math.PI);
                ctx.fill();
                // ctx.fillRect(this.x, this.y, 40, 40);
                ctx.font = "40px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                ctx.fillText("X", this.x + 20, this.y + 36, 40);
                break;
            default:
                ctx.strokeRect(this.x, this.y, 40, 40);
                ctx.font = "40px Arial";
                ctx.textAlign = "center";
                ctx.fillText("?", this.x + 20, this.y + 36, 40);
                break;
        }
        ctx.restore();
    }
}

class HoldConnector {
    x: number;
    startY: number;
    endY: number;

    constructor(x: number, startY: number, endY: number) {
        this.x = x;
        this.startY = startY;
        this.endY = endY;
    }

    draw() {
        let ctx = canvas.getContext("2d");
        if(ctx == null)
            throw 'ctx must not be null';
        ctx.save();
        ctx.fillRect(this.x + 10, this.startY, 20, this.endY - this.startY);
        ctx.restore();
    }
}

class NoteManager {
    tracks: Note[][];
    secondsPerPixel: number;
    currentTime: number;

    constructor(tracks_: Note[][], initialTime: number) {
        this.tracks = tracks_;
        this.secondsPerPixel = 0.0010;
        this.currentTime = initialTime;

        setInterval(this.canvasScrolled.bind(this), 10);
    }

    canvasScrolled(e: WheelEvent) {
        //let timeChange = e.deltaY * this.secondsPerPixel;
        this.currentTime += 0.01;//timeChange;
        this.draw();
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
        for (let i = 0; i < this.tracks.length; i++) {
            this.drawNotesInTrack(leastTime, greatestTime, this.tracks[i], i,
                this.tracks.length, this.currentTime);
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
        let x = this.getNoteX(trackNumber, numTracks);
        let y = this.getNoteY(note.time, currentTime);
        new NoteDisplay(x, y, note.type, trackNumber % 4).draw();
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
        let ctx = canvas.getContext("2d");
        if(ctx == null)
            throw 'ctx must not be null';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    getLeastTime(currentTime: number) {
        return currentTime;
    }

    getGreatestTime(leastTime: number) {
        return leastTime + canvas.height * this.secondsPerPixel;
    }

    getNoteX(trackNumber: number, numTracks: number) {
        let noteTrackSize = canvas.width / (numTracks + (numTracks + 1) / 2);
        return (0.10 + trackNumber * 1.10) * noteTrackSize;
    }

    getNoteY(noteTime: number, currentTime: number) {
        let timeDistance = noteTime - currentTime;
        return timeDistance / this.secondsPerPixel;
    }

    drawAllConnectors(leastTime: number, greatestTime: number) {
        for (let i = 0; i < this.tracks.length; i++) {
            this.drawConnectorsInTrack(leastTime, greatestTime, this.tracks[i], i,
                this.tracks.length, this.currentTime);
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
        let x = this.getNoteX(trackNumber, numTracks);
        let startY = this.getNoteY(startNote.time, currentTime);
        let endY = this.getNoteY(endNote.time, currentTime);
        new HoldConnector(x, startY, endY).draw();
    }
}
