import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Note } from '@models/note';
import { NoteQuantization, NoteType } from '@models/enums';
import { DisplayService } from '@services/display.service';
import { MediaService } from '@services/media.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SimfileLoaderService } from '@services/simfile-loader.service';
import { GameRequest } from '@models/game-request';
import { Log } from '@services/log.service';

@Component({
  selector: 'app-note-lane',
  templateUrl: './note-lane.component.html',
  styleUrls: ['./note-lane.component.scss']
})
export class NoteLaneComponent implements OnInit, OnDestroy {

  destroyed$ = new Subject<void>();

  @ViewChild("noteLaneCanvas", { static: true }) canvasEl?: ElementRef;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;

  constructor(private displayService: DisplayService, private mediaService: MediaService) { }

  ngOnInit(): void {
    if (!this.displayService.onGamePlayStateChange.value) {
      Log.error("NoteLaneComponent", "Game not yet started!");
      window.location.href = "/";
    }

    if (!this.mediaService.onMediaLoaded.value) {
      Log.error("NoteLaneComponent", "Media not yet loaded!");
      return;
    }

    this.canvas = <HTMLCanvasElement>this.canvasEl?.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.canvas.height = screen.height;
    this.canvas.width = this.displayService.displayOptions.noteLaneWidth;
    // this.displayService.onSetup.subscribe(()=>{
    //   this.canvas.height = screen.height;
    //   this.canvas.width = this.displayService.displayOptions.noteLaneWidth;
    // });
    this.displayService.onCurrentTimeSecondsChange.pipe(takeUntil(this.destroyed$)).subscribe(this.draw.bind(this));
    // this.displayService.onStart.subscribe(this.init.bind(this));
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  // init() {
  // }



  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawAllNotes();
  }

  drawAllNotes() {
    if (!this.displayService.requestedGame) return;
    // let leastTime = this.displayService.onCurrentTimeSecondsChange.value;
    // let greatestTime = leastTime + this.canvas.height * this.displayService.displayOptions.secondsPerPixel;
    for (const track of this.displayService.requestedGame.parsedSimfileMode.tracks) {
      for (const note of track) {
        if (this.displayService.getNoteY(note.time) > screen.height)
          break;
        this.drawNote(note);
      }
    }
    // this.drawNotesInTrack(leastTime, greatestTime, this.displayService.requestedGame.parsedSimfileMode.tracks[i], i);
  }

  // drawNotesInTrack(leastTime: number, greatestTime: number, track: Note[], trackNumber: number) {
  //   let bounds = this.getFirstAndLastNotes(leastTime, greatestTime, track);
  //   for (let i = bounds.start; i <= bounds.stop; i++) {
  //     this.drawNote(track[i], trackNumber);
  //   }
  // }

  drawNote(note: Note) {
    if (note.judged)
      return;
    let x = this.displayService.getNoteX(note.trackIndex);
    let y = this.displayService.getNoteY(note.time);
    let y2 = note.related ? this.displayService.getNoteY(note.related.time) : 0;
    let direction = note.trackIndex % 4;
    //new NoteDisplay(x, y, note.type, trackNumber % 4).draw(this.displayService);

    this.ctx.save();
    this.ctx.fillStyle = "black";
    let noteSize = this.displayService.displayOptions.noteSize;
    let halfNoteSize = Math.round(noteSize * 0.5);
    let ninthNoteSize = Math.round(noteSize * 0.9);
    switch (note.type) {
      case NoteType.NORMAL:
        //this.ctx.fillStyle = "white";
        //this.ctx.fillRect(x, y, noteSize, noteSize);
        this.ctx.drawImage(this.mediaService.arrowImageCache.get(direction)?.get(note.quantization)!, x, y, noteSize, noteSize);
        break;
      case NoteType.HOLD_HEAD: // Hold head
        // this.ctx.fillRect(x, y, noteSize, noteSize);
        // this.ctx.font = `${noteSize}px Arial`;
        // this.ctx.textAlign = "center";
        // this.ctx.fillStyle = "white";
        // this.ctx.fillText("H", x + halfNoteSize, y + ninthNoteSize, noteSize);

        if (note.startedJudging && note.time < this.displayService.onCurrentTimeSecondsChange.value) {
          y = this.displayService.displayOptions.noteTopPadding;
        }

        if (y2 > y + halfNoteSize) {
          let isHoldActive = note.startedJudging && note.stateChangeTime == 0; //note.stateChangeTime + 0.01 < this.displayService.currentTime;
          this.ctx.beginPath();
          let holdPattern = this.ctx.createPattern(isHoldActive ? this.mediaService.holdBodyActiveImageCache! : this.mediaService.holdBodyInactiveImageCache!, 'repeat-y')!;
          this.ctx.fillStyle = holdPattern
          let holdBodySize = y2 - y - halfNoteSize + 2;
          this.ctx.rect(x, y2 + 2, noteSize, -holdBodySize);
          this.ctx.setTransform(1, 0, 0, 1, x, y2 + 2);
          this.ctx.fill();
          this.ctx.setTransform(1, 0, 0, 1, 1, 1);

          let holdCapImage = isHoldActive ? this.mediaService.holdCapActiveImageCache! : this.mediaService.holdCapInactiveImageCache!;
          this.ctx.drawImage(holdCapImage, x, y2, noteSize, holdCapImage.height);
        }
        this.ctx.drawImage(this.mediaService.arrowImageCache.get(direction)?.get(note.quantization)!, x, y, noteSize, noteSize);
        break;
      case NoteType.ROLL_HEAD:
        // this.ctx.fillRect(x, y, noteSize, noteSize);
        // this.ctx.font = `${noteSize}px Arial`;
        // this.ctx.textAlign = "center";
        // this.ctx.fillStyle = "white";
        // this.ctx.fillText("R", x + halfNoteSize, y + ninthNoteSize, noteSize);

        if (note.startedJudging && note.time < this.displayService.onCurrentTimeSecondsChange.value) {
          y = this.displayService.displayOptions.noteTopPadding;
        }

        if (y2 > y + halfNoteSize) {
          let isRollActive = note.stateChangeTime + 0.1 < this.displayService.onCurrentTimeSecondsChange.value;
          let rollPattern = this.ctx.createPattern(isRollActive ? this.mediaService.rollBodyActiveImageCache! : this.mediaService.rollBodyInactiveImageCache!, 'repeat-y')!;
          this.ctx.beginPath();
          this.ctx.fillStyle = rollPattern
          let holdBodySize = y2 - y - halfNoteSize + 2;
          this.ctx.rect(x, y2 + 2, noteSize, -holdBodySize);
          this.ctx.setTransform(1, 0, 0, 1, x, y2 + 2);
          this.ctx.fill();
          this.ctx.setTransform(1, 0, 0, 1, 1, 1);

          let rollCapImage = isRollActive ? this.mediaService.rollCapActiveImageCache! : this.mediaService.rollCapInactiveImageCache!;
          this.ctx.drawImage(rollCapImage, x, y2, noteSize, rollCapImage.height);
        }
        this.ctx.drawImage(this.mediaService.arrowImageCache.get(direction)?.get(note.quantization)!, x, y, noteSize, noteSize);
        break;
      case NoteType.MINE:
        // this.ctx.beginPath();
        // this.ctx.arc(x + halfNoteSize, y + halfNoteSize, halfNoteSize, 0, 2 * Math.PI);
        // this.ctx.fill();
        // // ctx.fillRect(x, y, 40, 40);
        // this.ctx.font = `${noteSize}px Arial`;
        // this.ctx.textAlign = "center";
        // this.ctx.fillStyle = "white";
        // this.ctx.fillText("M", x + halfNoteSize, y + ninthNoteSize, noteSize);
        let currentTime = new Date();
        currentTime.setMilliseconds(currentTime.getMilliseconds() + note.mineDisplayRotationOffset);
        this.ctx.drawImage(this.mediaService.mineImageCache?.get(Math.round(currentTime.getMilliseconds() / 2 * 359 / 1000))!, x, y, noteSize, noteSize);
        break;
      case NoteType.HOLD_TAIL:
      case NoteType.ROLL_TAIL:
        break;
      default:
        this.ctx.strokeRect(x, y, noteSize, noteSize);
        this.ctx.font = `${noteSize}px Arial`;
        this.ctx.textAlign = "center";
        this.ctx.fillText("?", x + halfNoteSize, y + ninthNoteSize, noteSize);
        Log.debug("NoteLaneComponent", `Missing renderer info for type ${note.type}`, note);
        break;
    }
    this.ctx.restore();
  }

  // getFirstAndLastNotes(leastTime: number, greatestTime: number, track: Note[]) {
  //   let i;
  //   for (i = 0; i < track.length; i++) {
  //     if (track[i].time > leastTime) {
  //       break;
  //     }
  //   }
  //   i = Math.max(0, i - 1);
  //   let j;
  //   for (j = i; j < track.length; j++) {
  //     if (track[j].time > greatestTime) {
  //       break;
  //     }
  //   }
  //   j = Math.max(0, j - 1);
  //   return { start: i, stop: j };
  // }
}
