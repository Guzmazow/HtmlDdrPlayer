import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AllDirections, Direction, Judgement, Key, NoteType } from '@models/enums';
import { Note } from '@models/note';
import { Subject } from 'rxjs';
import { DisplayService } from './display.service';
import { KeyboardService } from './keyboard.service';
import { Log } from './log.service';

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

  rollState = new Map<Direction, { note: Note, timer?: ReturnType<typeof setTimeout> } | undefined>();
  holdState = new Map<Direction, { note: Note, timer?: ReturnType<typeof setTimeout> } | undefined>();

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
    this.displayService.onRedraw.subscribe(() => this.passiveJudge())

  }

  passiveJudge() {
    if (!this.gameInProgress) return;
    for (let trackIndex = 0; trackIndex < this.displayService.gameRequest.playableSimfileMode.tracks.length; trackIndex++) {
      let track = this.displayService.gameRequest.playableSimfileMode.tracks[trackIndex];
      let unhittable = track.filter(x =>
        (x.type == NoteType.NORMAL || x.type == NoteType.ROLL_HEAD || x.type == NoteType.HOLD_HEAD) &&
        !x.judged && !x.startedJudging &&
        x.time < (this.displayService.currentTime - this.errorLimit))
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

      let unhittableMines = track.filter(x =>
        (x.type == NoteType.MINE) &&
        !x.judged &&
        x.time < (this.displayService.currentTime - this.errorLimit))
      for (let missMine of unhittableMines) {
        missMine.judged = true;
        missMine.judgement = Judgement.MINEMISS;
      }

      let hittableMines = track.filter(x =>
        x.type == NoteType.MINE &&
        !x.judged &&
        (this.displayService.currentTime + this.TimingWindowSecondsMine) > x.time && x.time > (this.displayService.currentTime - this.TimingWindowSecondsMine)
      )
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


      let rollState = this.rollState.get(trackIndex)
      if (rollState && rollState.note.related && rollState.note.related.time < this.displayService.currentTime) {
        if (rollState.timer)
          clearTimeout(rollState.timer);
        rollState.note.judged = true;
        this.onJudged.next({
          judgement: Judgement.ROLLFINISHED,
          precision: 0,
          key: trackIndex
        });
        this.rollState.set(trackIndex, undefined);
        Log.debug("roll finished " + trackIndex)
      }
      let holdState = this.holdState.get(trackIndex)
      if (holdState && holdState.note.related && holdState.note.related.time < this.displayService.currentTime) {
        if (holdState.timer)
          clearTimeout(holdState.timer);
        holdState.note.judged = true;
        this.onJudged.next({
          judgement: Judgement.HOLDFINISHED,
          precision: 0,
          key: trackIndex
        });
        this.holdState.set(trackIndex, undefined);
        Log.debug("hold finished " + trackIndex)
      }

    }
  }

  judgePress(key: Key, keyPressed: boolean) {
    if (!this.gameInProgress) return;
    if (keyPressed) {
      this.rearmRoll(+key);
      this.unarmHold(+key);


      let track = this.displayService.gameRequest.playableSimfileMode.tracks[key];
      if (track) {
        let hittable = track.filter(x =>
          (x.type == NoteType.NORMAL || x.type == NoteType.ROLL_HEAD || x.type == NoteType.HOLD_HEAD) &&
          !x.judged && !x.startedJudging &&
          (this.displayService.currentTime + this.errorLimit) > x.time && x.time > (this.displayService.currentTime - this.errorLimit)
        )
        if (hittable.length) {
          hittable.sort(x => x.time);
          let hit = hittable[0];
          let timeDifference = hit.time - this.displayService.currentTime;
          let timeModule = Math.abs(timeDifference);
          let judgePrecisionKeys = Array.from(this.judgePrecision.keys());
          let precisionKey = judgePrecisionKeys[judgePrecisionKeys.slice(1).findIndex(x => x > timeModule)]
          let judgement = this.judgePrecision.get(precisionKey) ?? Judgement.NONE;
          
          // console.log("hit",{
          //   noteTime: hit.time,
          //   currentTime: this.displayService.currentTime,
          //   timeDifference: timeDifference,
          //   timeModule: timeModule,
          //   precisionKey: precisionKey
          // })
          
          if (hit.type == NoteType.ROLL_HEAD || hit.type == NoteType.HOLD_HEAD) {
            hit.startedJudging = true;
          } else {
            hit.judged = true;
          }
          hit.precision = timeDifference;
          hit.judgement = judgement;
          if (hit.type == NoteType.ROLL_HEAD) {
            this.rollState.set(+key, { note: hit, timer: undefined });
            this.rearmRoll(+key);
          }
          if (hit.type == NoteType.HOLD_HEAD) {
            this.holdState.set(+key, { note: hit, timer: undefined });
          }
          this.onJudged.next({ judgement: judgement, precision: timeDifference, key: key });
        }
      }
    } else {
      let holdState = this.holdState.get(+key);
      if (holdState) {
        this.armHold(+key);
      }
    }
  }

  rearmRoll(direction: Direction) {
    let state = this.rollState.get(direction);
    if (state) {
      state.note.stateChangeTime = this.displayService.currentTime;
      Log.debug("clearing timer " + state.timer)
      if (state.timer) {
        Log.debug("clear timer " + state.timer)
        clearTimeout(state.timer);
      }
      state.timer = setTimeout(() => {
        if (state)
          state.note.judged = true;
        this.rollState.set(direction, undefined);
        this.onJudged.next({
          judgement: Judgement.ROLLFAILED,
          precision: this.TimingWindowSecondsRoll,
          key: +direction
        });
        Log.debug("roll failed " + direction)
      }, this.TimingWindowSecondsRoll * 1000);
      //.log("set timer " + state.timer)
    }
  }

  unarmHold(direction: Direction) {
    let state = this.holdState.get(direction);
    if (state && state.timer) {
      state.note.stateChangeTime = 0;
      clearTimeout(state.timer);
    }
  }

  armHold(direction: Direction) {
    let state = this.holdState.get(direction);
    if (state) {
      state.note.stateChangeTime = this.displayService.currentTime;
      state.timer = setTimeout(() => {
        if (state)
          state.note.judged = true;
        this.holdState.set(direction, undefined);
        this.onJudged.next({
          judgement: Judgement.HOLDFAILED,
          precision: this.TimingWindowSecondsHold,
          key: +direction
        });
        Log.debug("hold failed " + direction)
      }, this.TimingWindowSecondsHold * 1000);
    }
  }

}
