import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Direction, Judgement, Key, NoteType } from '@models/enums';
import { Subject } from 'rxjs';
import { DisplayService } from './display.service';
import { KeyboardService } from './keyboard.service';

@Injectable({
  providedIn: 'root'
})
export class JudgementService {
  gameInProgress = false;

  onJudged = new Subject<{ judgement: Judgement, precision: number, key: Key }>();

  errorLimit: number = 0.180000;

  judgePrecision = new Map<number, Judgement>([
    [0, Judgement.MARVELOUS],
    [0.022500, Judgement.PERFECT],
    [0.045000, Judgement.GREAT],
    [0.090000, Judgement.GOOD],
    [0.135000, Judgement.BAD],
    [0.180000, Judgement.MISS],
  ]);

  TimingWindowSecondsHold = 0.250000
  TimingWindowSecondsMine = 0.075000
  TimingWindowSecondsRoll = 0.500000

  constructor(private displayService: DisplayService, private keyboardService: KeyboardService, private router: Router) {
    const judgeScale = 2;
    let judgePrecision = new Map<number, Judgement>();
    for (let precision of this.judgePrecision) {
      judgePrecision.set(precision[0] * judgeScale, precision[1])
      if (precision[1] == Judgement.MISS) {
        this.errorLimit = precision[0] * judgeScale;
      }
    }
    this.judgePrecision = judgePrecision;
    this.keyboardService.onPress.subscribe(x => this.judgePress(x.key, x.state))
    this.displayService.onGamePlayStateChange.subscribe(playing => { this.gameInProgress = playing; })
    this.keyboardService.onLongPress.subscribe(key => this.longPress(key))
    this.displayService.onRedraw.subscribe(() => this.judgeMissesAndMines())

  }

  longPress(key: Key): void {
    console.log('long pressed', key);
  }

  judgeMissesAndMines() {
    if (!this.gameInProgress) return;
    for (let trackIndex = 0; trackIndex < this.displayService.gameRequest.playableSimfileMode.tracks.length; trackIndex++) {
      let track = this.displayService.gameRequest.playableSimfileMode.tracks[trackIndex];
      let unhittable = track.filter(x => x.type == NoteType.NORMAL && !x.judged && x.time < (this.displayService.currentTime - this.errorLimit))
      for (let missNote of unhittable) {
        missNote.judged = true;
        missNote.judgement = Judgement.MISS;
        missNote.precision = -this.errorLimit;
        this.onJudged.next({
          judgement: missNote.judgement,
          precision: missNote.precision,
          key: trackIndex
        });
      }

      let hittableMines = track.filter(x => x.type == NoteType.MINE && !x.judged && x.time > (this.displayService.currentTime - this.TimingWindowSecondsMine) && x.time < (this.displayService.currentTime + this.TimingWindowSecondsMine))
      for (let mineNote of hittableMines) {
        if (this.keyboardService.keyState.get(trackIndex)) {
          mineNote.judged = true;
          mineNote.judgement = Judgement.MINEHIT;
          mineNote.precision = this.errorLimit;
          this.onJudged.next({
            judgement: Judgement.MINEHIT,
            precision: mineNote.time - this.displayService.currentTime,
            key: trackIndex
          });
        }
      }
    }
  }

  judgePress(key: Key, keyPressed: boolean) {
    if (!this.gameInProgress) return;
    if (keyPressed) {
      let track = this.displayService.gameRequest.playableSimfileMode.tracks[key];
      if (track) {
        let hittable = track.filter(x =>
          x.type == NoteType.NORMAL &&
          !x.judged &&
          (this.displayService.currentTime + this.errorLimit) > x.time && x.time > (this.displayService.currentTime - this.errorLimit)
        )
        if (hittable.length) {
          hittable.sort(x => x.time);
          let hit = hittable[0];
          let timeDifference = hit.time - this.displayService.currentTime;
          let precisionKey = Array.from(this.judgePrecision.keys()).reduce((a, b) => Math.abs(a - timeDifference) < Math.abs(b - timeDifference) ? a : b)
          let judgement = this.judgePrecision.get(precisionKey) ?? Judgement.NONE;
          hit.judged = true;
          hit.precision = timeDifference;
          hit.judgement = judgement;
          this.onJudged.next({ judgement: judgement, precision: timeDifference, key: key });
        }
      }
    }
  }

}
