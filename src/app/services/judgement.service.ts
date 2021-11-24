import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AllDirections, Direction, Judgement, Key, NoteType } from '@models/enums';
import { GameRequest } from '@models/game-request';
import { Note } from '@models/note';
import { Subject } from 'rxjs';
import { DisplayService } from './display.service';
import { KeyboardService } from './keyboard.service';
import { Log } from './log.service';
import { SimfileLoaderService } from './simfile-loader.service';

@Injectable({
  providedIn: 'root'
})
export class JudgementService {
  gameInProgress = false;

  onJudged = new Subject<Note>();

  errorLimit: number = 0.180000;

  judgePrecision = new Map<number, Judgement>([
    [0, Judgement.MARVELOUS],
    [0.022500, Judgement.PERFECT],
    [0.045000, Judgement.GREAT],
    [0.090000, Judgement.GOOD],
    [0.135000, Judgement.BAD],
    [0.180000, Judgement.MISS],
  ]);

  TimingWindowSecondsHold = 0.250;
  TimingWindowSecondsMine = 0.075;
  TimingWindowSecondsRoll = 0.500;

  rollState = new Map<Direction, { note: Note, timer?: ReturnType<typeof setTimeout> } | undefined>();
  holdState = new Map<Direction, { note: Note, timer?: ReturnType<typeof setTimeout> } | undefined>();

  constructor(private displayService: DisplayService, private keyboardService: KeyboardService) {
    const judgeScale = 2;
    let judgePrecision = new Map<number, Judgement>();
    for (let precision of this.judgePrecision) {
      judgePrecision.set(precision[0] * judgeScale, precision[1]);
      if (precision[1] == Judgement.MISS) {
        this.errorLimit = precision[0] * judgeScale;
      }
    }
    this.judgePrecision = judgePrecision;
    this.keyboardService.onPress.subscribe(x => this.judgePress(x.key, x.state));
    this.displayService.onGamePlayStateChange.subscribe(playing => { this.gameInProgress = playing; });
    this.displayService.onCurrentTimeSecondsChange.subscribe(() => this.passiveJudge());

  }

  passiveJudge() {
    if (!this.gameInProgress || !this.displayService.requestedGame) return;
    for (let trackIndex = 0; trackIndex < this.displayService.requestedGame.parsedSimfileMode.tracks.length; trackIndex++) {
      let track = this.displayService.requestedGame.parsedSimfileMode.tracks[trackIndex];
      let unhittable = track.filter(x =>
        (x.type == NoteType.NORMAL || x.type == NoteType.ROLL_HEAD || x.type == NoteType.HOLD_HEAD) &&
        !x.judged && !x.startedJudging &&
        x.time < (this.displayService.onCurrentTimeSecondsChange.value - this.errorLimit))
      for (let missNote of unhittable) {
        missNote.judged = true;
        missNote.judgement = Judgement.MISS;
        missNote.precision = -this.errorLimit;
        this.onJudged.next(missNote);
      }

      let unhittableMines = track.filter(x =>
        (x.type == NoteType.MINE) &&
        !x.judged &&
        x.time < (this.displayService.onCurrentTimeSecondsChange.value - this.errorLimit))
      for (let missMine of unhittableMines) {
        missMine.judged = true;
        missMine.judgement = Judgement.MINEMISS;
      }

      let hittableMines = track.filter(x =>
        x.type == NoteType.MINE &&
        !x.judged &&
        (this.displayService.onCurrentTimeSecondsChange.value + this.TimingWindowSecondsMine) > x.time && x.time > (this.displayService.onCurrentTimeSecondsChange.value - this.TimingWindowSecondsMine)
      )
      for (let mineNote of hittableMines) {
        if (this.keyboardService.keyState.get(trackIndex)) {
          mineNote.judged = true;
          mineNote.judgement = Judgement.MINEHIT;
          mineNote.precision = mineNote.time - this.displayService.onCurrentTimeSecondsChange.value;
          this.onJudged.next(mineNote);
        }
      }


      const rollState = this.rollState.get(trackIndex)
      if (rollState && rollState.note.related && rollState.note.related.time < this.displayService.onCurrentTimeSecondsChange.value) {
        const rollNote = rollState.note;
        if (rollState.timer)
          clearTimeout(rollState.timer);
        rollNote.judged = true;
        rollNote.judgement = Judgement.ROLLFINISHED;
        this.onJudged.next(rollNote);
        this.rollState.set(trackIndex, undefined);
        Log.debug("JudgementService", "roll finished " + trackIndex)
      }

      // //Rogue/Stuck roll (if notes are too close)
      // for (const note of track.filter(x =>
      //   !x.judged &&
      //   x.startedJudging &&
      //   !rollState &&
      //   x.type == NoteType.ROLL_HEAD &&
      //   x.related &&
      //   x.related.time < this.displayService.onCurrentTimeSecondsChange.value
      // )) {
      //   note.judged = true;
      //   this.onJudged.next({
      //     judgement: note.judgement /* Judgement.ROLLFINISHED */,
      //     precision: 0,
      //     key: trackIndex
      //   });
      //   Log.debug("JudgementService", "rogue roll ", note)
      // }

      const holdState = this.holdState.get(trackIndex)
      if (holdState && holdState.note.related && (holdState.note.related.time /*- (holdState.timer ? 0 : this.TimingWindowSecondsHold)*/) < this.displayService.onCurrentTimeSecondsChange.value) {
        const holdNote = holdState.note;
        if (holdState.timer)
          clearTimeout(holdState.timer);
        holdNote.judged = true;
        holdNote.judgement = Judgement.HOLDFINISHED,
          this.onJudged.next(holdNote);
        this.holdState.set(trackIndex, undefined);
        Log.debug("JudgementService", "hold finished " + trackIndex)
      }

      // //Rogue/Stuck hold (if notes are too close)
      // for (const note of track.filter(x =>
      //   !x.judged &&
      //   x.startedJudging &&
      //   !holdState &&
      //   x.type == NoteType.HOLD_HEAD &&
      //   x.related &&
      //   x.related.time < this.displayService.onCurrentTimeSecondsChange.value
      // )) {
      //   note.judged = true;
      //   this.onJudged.next({
      //     judgement: note.judgement /* Judgement.HOLDFINISHED */,
      //     precision: 0,
      //     key: trackIndex
      //   });
      //   Log.debug("JudgementService", "rogue hold ", note)
      // }
    }
  }

  judgePress(key: Key, keyPressed: boolean) {
    if (!this.gameInProgress || !this.displayService.requestedGame) return;
    let currentHoldState = this.holdState.get(+key);
    let currentRollState = this.rollState.get(+key);
    if (keyPressed) {
      if (currentRollState) {
        this.rearmRoll(+key);
        return; //if roll active do not allow to activate other arrows in lane
      }
      if (currentHoldState) {

        this.unarmHold(+key);
        return; //if hold active do not allow to activate other arrows in lane
      }


      let track = this.displayService.requestedGame.parsedSimfileMode.tracks[key];
      if (track) {
        let hittable = track.filter(x =>
          (x.type == NoteType.NORMAL || x.type == NoteType.ROLL_HEAD || x.type == NoteType.HOLD_HEAD) &&
          !x.judged && !x.startedJudging &&
          (this.displayService.onCurrentTimeSecondsChange.value + this.errorLimit) > x.time && x.time > (this.displayService.onCurrentTimeSecondsChange.value - this.errorLimit)
        )
        if (hittable.length) {
          hittable.sort(x => x.time);
          let hit = hittable[0];
          let timeDifference = hit.time - this.displayService.onCurrentTimeSecondsChange.value;
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
          this.onJudged.next(hit);
        }
      }
    } else {
      if (currentHoldState) {
        this.armHold(+key);
        return;
      }
    }
  }

  rearmRoll(direction: Direction) {
    let state = this.rollState.get(direction);
    if (state) {
      state.note.stateChangeTime = this.displayService.onCurrentTimeSecondsChange.value;
      Log.debug("JudgementService", "clearing timer " + state.timer)
      if (state.timer) {
        Log.debug("JudgementService", "clear timer " + state.timer)
        clearTimeout(state.timer);
        state.timer = undefined;
      }

      // //done by passive judge
      // if (state.note.related && state.note.related.time < this.displayService.onCurrentTimeSecondsChange.value) {
      //   state.note.judged = true;
      //   this.onJudged.next({
      //     judgement: state.note.judgement /* Judgement.ROLLFINISHED */,
      //     precision: 0,
      //     key: +direction
      //   });
      //   this.rollState.set(direction, undefined);
      //   Log.debug("JudgementService", "roll finished " + direction);
      // } else {
      state.timer = setTimeout(() => {
        // if (state?.note.judged)
        //   return;
        if (state) {
          state.note.judgement = Judgement.ROLLFAILED;
          state.note.precision = -this.TimingWindowSecondsRoll;
          state.note.judged = true;
          this.onJudged.next(state.note);
        }
        this.rollState.set(direction, undefined);
        Log.debug("JudgementService", "roll failed " + direction);
      }, this.TimingWindowSecondsRoll * 1000);
      //.log("set timer " + state.timer)
      //}
    }
  }

  unarmHold(direction: Direction) {
    let state = this.holdState.get(direction);
    if (state && state.timer) {
      state.note.stateChangeTime = null;
      clearTimeout(state.timer);
      state.timer = undefined;
    }
  }

  armHold(direction: Direction) {
    let state = this.holdState.get(direction);
    if (state) {
      state.note.stateChangeTime = this.displayService.onCurrentTimeSecondsChange.value;
      state.timer = setTimeout(() => {
        // if (state?.note.judged)
        //   return;
        if (state) {
          state.note.judgement = Judgement.HOLDFAILED;
          state.note.judged = true;
          state.note.precision = -this.TimingWindowSecondsHold;
          this.onJudged.next(state.note);
        }
        this.holdState.set(direction, undefined);
        Log.debug("JudgementService", "hold failed " + direction)
      }, this.TimingWindowSecondsHold * 1000);
    }
  }

}
