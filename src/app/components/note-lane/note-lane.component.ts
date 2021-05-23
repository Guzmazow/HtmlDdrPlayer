import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Note } from '@models/note';
import { NoteQuantization, NoteType } from '@models/enums';
import { DisplayService } from '@services/display.service';
import { MediaService } from '@services/media.service';
import { takeUntil } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-note-lane',
  templateUrl: './note-lane.component.html',
  styleUrls: ['./note-lane.component.scss']
})
export class NoteLaneComponent implements OnInit, OnDestroy {

  destroyed$ = new ReplaySubject<boolean>(1);

  @ViewChild("noteLaneCanvas", { static: true }) canvasEl?: ElementRef;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  mediaLoaded: boolean = false;

  constructor(private displayService: DisplayService, private mediaService: MediaService) { }

  ngOnInit(): void {
    this.canvas = <HTMLCanvasElement>this.canvasEl?.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.canvas.height = screen.height;
    this.canvas.width = this.displayService.displayOptions.noteLaneWidth;
    // this.displayService.onSetup.subscribe(()=>{
    //   this.canvas.height = screen.height;
    //   this.canvas.width = this.displayService.displayOptions.noteLaneWidth;
    // });
    this.mediaService.onMediaLoaded.pipe(takeUntil(this.destroyed$)).subscribe(x => this.mediaLoaded = x);
    this.displayService.onRedraw.pipe(takeUntil(this.destroyed$)).subscribe(this.draw.bind(this));
    // this.displayService.onStart.subscribe(this.init.bind(this));
  }

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  // init() {
  // }

  draw() {
    if (!this.mediaLoaded) return;
    this.clear();
    this.drawNotesAndConnectors();
  }

  drawNotesAndConnectors() {
    let leastTime = this.displayService.currentTime;
    let greatestTime = leastTime + this.canvas.height * this.displayService.displayOptions.secondsPerPixel;
    this.drawAllConnectors(leastTime, greatestTime);
    this.drawAllNotes(leastTime, greatestTime);
  }

  drawAllNotes(leastTime: number, greatestTime: number) {
    for (let i = 0; i < this.displayService.gameRequest.playableSimfileMode.tracks.length; i++) {
      this.drawNotesInTrack(leastTime, greatestTime, this.displayService.gameRequest.playableSimfileMode.tracks[i], i,
        this.displayService.gameRequest.playableSimfileMode.tracks.length);
    }
  }

  drawNotesInTrack(leastTime: number, greatestTime: number, track: Note[], trackNumber: number,
    numTracks: number) {
    let bounds = this.getFirstAndLastNotes(leastTime, greatestTime, track);
    for (let i = bounds.start; i <= bounds.stop; i++) {
      this.drawNote(track[i], trackNumber);
    }
  }

  drawNote(note: Note, trackNumber: number) {
    if (note.judged)
      return;
    let x = this.displayService.getNoteX(trackNumber);
    let y = this.displayService.getNoteY(note.time);
    let direction = trackNumber % 4;
    //new NoteDisplay(x, y, note.type, trackNumber % 4).draw(this.displayService);

    this.ctx.save();
    this.ctx.fillStyle = "black";
    let halfNoteSize = Math.round(this.displayService.displayOptions.noteSize * 0.5);
    let ninthNoteSize = Math.round(this.displayService.displayOptions.noteSize * 0.9);
    switch (note.type) {
      case NoteType.NORMAL:
        //this.ctx.fillStyle = "white";
        //this.ctx.fillRect(x, y, this.displayService.displayOptions.noteSize, this.displayService.displayOptions.noteSize);
        this.ctx.drawImage(this.mediaService.arrowImageCache.get(direction)?.get(note.quantization)!, x, y, this.displayService.displayOptions.noteSize, this.displayService.displayOptions.noteSize);
        break;
      case NoteType.HOLD_HEAD: // Hold head
        this.ctx.fillRect(x, y, this.displayService.displayOptions.noteSize, this.displayService.displayOptions.noteSize);
        this.ctx.font = `${this.displayService.displayOptions.noteSize}px Arial`;
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "white";
        this.ctx.fillText("H", x + halfNoteSize, y + ninthNoteSize, this.displayService.displayOptions.noteSize);
        break;
      case NoteType.HOLD_ROLL_TAIL:
        this.ctx.strokeRect(x, y, this.displayService.displayOptions.noteSize, this.displayService.displayOptions.noteSize);
        break;
      case NoteType.ROLL_HEAD:
        this.ctx.fillRect(x, y, this.displayService.displayOptions.noteSize, this.displayService.displayOptions.noteSize);
        this.ctx.font = `${this.displayService.displayOptions.noteSize}px Arial`;
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "white";
        this.ctx.fillText("R", x + halfNoteSize, y + ninthNoteSize, this.displayService.displayOptions.noteSize);
        break;
      case NoteType.MINE:
        // this.ctx.beginPath();
        // this.ctx.arc(x + halfNoteSize, y + halfNoteSize, halfNoteSize, 0, 2 * Math.PI);
        // this.ctx.fill();
        // // ctx.fillRect(x, y, 40, 40);
        // this.ctx.font = `${this.displayService.displayOptions.noteSize}px Arial`;
        // this.ctx.textAlign = "center";
        // this.ctx.fillStyle = "white";
        // this.ctx.fillText("M", x + halfNoteSize, y + ninthNoteSize, this.displayService.displayOptions.noteSize);
        this.ctx.drawImage(this.mediaService.mineImageCache.get(direction)?.get(Math.round(new Date().getMilliseconds()/2 * 359 / 1000))!, x, y, this.displayService.displayOptions.noteSize, this.displayService.displayOptions.noteSize);
        break;
      default:
        this.ctx.strokeRect(x, y, this.displayService.displayOptions.noteSize, this.displayService.displayOptions.noteSize);
        this.ctx.font = `${this.displayService.displayOptions.noteSize}px Arial`;
        this.ctx.textAlign = "center";
        this.ctx.fillText("?", x + halfNoteSize, y + ninthNoteSize, this.displayService.displayOptions.noteSize);
        break;
    }
    this.ctx.restore();
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawAllConnectors(leastTime: number, greatestTime: number) {
    for (let i = 0; i < this.displayService.gameRequest.playableSimfileMode.tracks.length; i++) {
      this.drawConnectorsInTrack(leastTime, greatestTime, this.displayService.gameRequest.playableSimfileMode.tracks[i], i,
        this.displayService.gameRequest.playableSimfileMode.tracks.length);
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
        } else if (currentNote.type === NoteType.HOLD_ROLL_TAIL) {
          noteStack.pop();
        }
      } else if (currentNote.time < greatestTime) {
        if (currentNote.type === NoteType.HOLD_HEAD || currentNote.type === NoteType.ROLL_HEAD) {
          noteStack.push(currentNote);
        } else if (currentNote.type === NoteType.HOLD_ROLL_TAIL) {
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
        } else if (currentNote.type === NoteType.HOLD_ROLL_TAIL) {
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
    let x = this.displayService.getNoteX(trackNumber);
    let startY = this.displayService.getNoteY(startNote.time);
    let endY = this.displayService.getNoteY(endNote.time);
    //new HoldConnector(x, startY, endY, startNote).draw(this.displayService);
    this.ctx.save();
    switch (startNote.type) {
      case NoteType.HOLD_HEAD:
        this.ctx.fillStyle = "orange";
        break;
      case NoteType.ROLL_HEAD:
        this.ctx.fillStyle = "green";
        break;
      default:
        this.ctx.fillStyle = "black";
        break;
    }
    this.ctx.fillRect(x + this.displayService.displayOptions.noteSize * 0.25, startY, this.displayService.displayOptions.noteSize * 0.5, endY - startY);
    this.ctx.restore();

  }


}
