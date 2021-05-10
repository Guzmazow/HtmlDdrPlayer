import { Injectable } from '@angular/core';
import { Direction, Judgement, NoteType } from '@models/enums';
import { Subject } from 'rxjs';
import { DisplayService } from './display.service';
import { KeyboardService } from './keyboard.service';

@Injectable({
  providedIn: 'root'
})
export class JudgementService {

  onJudged = new Subject<{ judgement: Judgement, precision: number, direction: Direction }>();

  errorLimit: number = 0.180000;

  judgePrecision = new Map<number, Judgement>([
    [0, Judgement.MARVELOUS],
    [0.022500, Judgement.PERFECT],
    [0.045000, Judgement.GREAT],
    [0.090000, Judgement.GOOD],
    [0.135000, Judgement.BAD],
    [0.180000, Judgement.MISS],
  ]);

  // TimingWindowSecondsHold=0.250000
  // TimingWindowSecondsMine=0.075000
  // TimingWindowSecondsRoll=0.500000

  constructor(private displayService: DisplayService, private keyboardService: KeyboardService) {
    const judgeScale = 3;
    let judgePrecision = new Map<number, Judgement>();
    for (let precision of this.judgePrecision) {
      judgePrecision.set(precision[0] * judgeScale, precision[1])
      if (precision[1] == Judgement.MISS) {
        this.errorLimit = precision[0] * judgeScale;
      }
    }
    this.judgePrecision = judgePrecision;
    this.keyboardService.onPress.subscribe(x => this.judgePress(x.direction, x.state))
    this.displayService.onRedraw.subscribe(() => this.judgeMisses())

  }

  judgeMisses() {
      for (let track of this.displayService.gameRequest.playableSimfileMode.tracks) {
        let unhittable = track.filter(x => x.type == NoteType.NORMAL && !x.judged && x.time < (this.displayService.currentTime - this.errorLimit))
        if (unhittable.length) {
          unhittable.forEach(x => x.judged = true)
          this.onJudged.next({ judgement: Judgement.MISS, precision: -this.errorLimit, direction: Direction.NONE });
        }
      }
    
  }

  judgePress(direction: Direction, keyPressed: boolean) {
    if (keyPressed) {
        let track = this.displayService.gameRequest.playableSimfileMode.tracks[direction];
        let hittable = track.filter(x => x.type == NoteType.NORMAL && !x.judged && (this.displayService.currentTime + this.errorLimit) > x.time && x.time > (this.displayService.currentTime - this.errorLimit))
        if (hittable.length) {
          hittable.sort(x => x.time);
          let hit = hittable[0];
          let timeDifference = hit.time - this.displayService.currentTime;
          let precisionKey = Array.from(this.judgePrecision.keys()).reduce((a, b) => Math.abs(a - timeDifference) < Math.abs(b - timeDifference) ? a : b)
          let judgement = this.judgePrecision.get(precisionKey) ?? Judgement.NONE;
          hit.judged = true;
          hit.precision = timeDifference;
          this.onJudged.next({ judgement: judgement, precision: timeDifference, direction: direction });
        }      
    }
  }

}
