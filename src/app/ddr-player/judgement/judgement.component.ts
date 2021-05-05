import { Component, HostListener, OnInit } from '@angular/core';
import { DisplayService } from '../display.service';
import { Judgement, Direction } from '../models/note-enums';

@Component({
  selector: 'app-judgement',
  templateUrl: './judgement.component.html',
  styleUrls: ['./judgement.component.css']
})
export class JudgementComponent implements OnInit {

  readonly keyMap = new Map<string, Direction>([
    ["ArrowLeft", Direction.LEFT],
    ["ArrowDown", Direction.DOWN],
    ["ArrowUp", Direction.UP],
    ["ArrowRight", Direction.RIGHT]
  ]);

  readonly keyState = new Map<Direction, boolean>([
    [Direction.LEFT, false],
    [Direction.DOWN, false],
    [Direction.UP, false],
    [Direction.RIGHT, false]
  ]);

  judgePrecision = new Map<number, Judgement>([
    [0, Judgement.MARVELOUS],
    [0.022500, Judgement.PERFECT],
    [0.045000, Judgement.GREAT],
    [0.090000, Judgement.GOOD],
    [0.135000, Judgement.BAD],
    [0.180000, Judgement.MISS],
  ]);

  errorLimit: number = 0.180000;

  // TimingWindowSecondsHold=0.250000
  // TimingWindowSecondsMine=0.075000
  // TimingWindowSecondsRoll=0.500000

  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    let keyDirection = this.keyMap.get(event.key);
    if (keyDirection === undefined) return;
    let keyState = this.keyState.get(keyDirection);
    if (!keyState) {
      this.keyState.set(keyDirection, true);
      this.judge(keyDirection);
    }
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUpHandler(event: KeyboardEvent) {
    let keyDirection = this.keyMap.get(event.key);
    if (keyDirection === undefined) return;
    let keyState = this.keyState.get(keyDirection);
    if (keyState) {
      this.keyState.set(keyDirection, false);
      this.judge(keyDirection);
    }
  }


  constructor(private displayService: DisplayService) {
    const judgeScale = 3;
    let judgePrecision = new Map<number, Judgement>();
    for (let precision of this.judgePrecision) {
      judgePrecision.set(precision[0] * judgeScale, precision[1])
      if(precision[1] == Judgement.MISS)
      {
        this.errorLimit = precision[0] * judgeScale;
      }
    }
    this.judgePrecision = judgePrecision;
  }


  ngOnInit(): void {

    this.displayService.startTriggered.subscribe(() => {
      //
      //
      // for (let judgement of judgements) {
      //   let judgementImage = dCtx.media.judgementImageCache.get(judgement)!;
      //   dCtx.judgementCanvasCtx.drawImage(judgementImage, 0, judgement * judgementImage.height, judgementImage.width, judgementImage.height);
      // }
      // dCtx.judgementCanvasCtx.fillStyle = "red";
      // dCtx.judgementCanvasCtx.fillRect(0,0, dCtx.judgementCanvas.width, dCtx.judgementCanvas.height)
    });



  }

  judge(direction: Direction) {
    let dCtx = this.displayService.displayContext;
    if (this.displayService.displayContext) {
      //let judgement = Judgement.NONE;
      let keyPressed = this.keyState.get(direction) || false;
      if (keyPressed) {
        let track = dCtx.fullParse.tracks[direction];
        let currentTime = dCtx.currentTime;
        let hittable = track.filter(x => !x.pressed && (currentTime + this.errorLimit) > x.time && x.time > (currentTime - this.errorLimit))
        let judgement = Judgement.NONE;
        if (hittable.length) {
          hittable.sort(x => x.time);
          let hit = hittable[0];
          let timeDifference = hit.time - currentTime;
          var precisionKey = Array.from(this.judgePrecision.keys()).reduce((a, b) => Math.abs(a - timeDifference) < Math.abs(b - timeDifference) ? a : b)
          judgement = this.judgePrecision.get(precisionKey) ?? Judgement.NONE;
          hit.pressed = true;
          hit.precision = timeDifference;
        }
        dCtx.judgementCanvasCtx.clearRect(0, 0, dCtx.judgementCanvas.width, dCtx.judgementCanvas.height);
        if (judgement != Judgement.NONE) {
          let judgementImage = dCtx.media.judgementImageCache.get(judgement);
          if (judgementImage) {
            dCtx.judgementCanvasCtx.drawImage(judgementImage, 0, judgementImage.height, judgementImage.width, judgementImage.height);
          }
        }
      }

    }
  }


}
