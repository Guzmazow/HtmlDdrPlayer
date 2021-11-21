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
        this.onJudged.next({
          judgement: missNote.judgement,
          precision: missNote.precision,
          key: trackIndex
        });
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
          mineNote.precision = this.errorLimit;
          this.onJudged.next({
            judgement: Judgement.MINEHIT,
            precision: mineNote.time - this.displayService.onCurrentTimeSecondsChange.value,
            key: trackIndex
          });
        }
      }


      let rollState = this.rollState.get(trackIndex)
      // Moved to rearmRoll
      // if (rollState && rollState.note.related && rollState.note.related.time < this.displayService.onCurrentTimeSecondsChange.value) {
      //   if (rollState.timer)
      //     clearTimeout(rollState.timer);
      //   rollState.note.judged = true;
      //   this.onJudged.next({
      //     judgement: rollState?.note.judgement ?? Judgement.ROLLFINISHED,
      //     precision: 0,
      //     key: trackIndex
      //   });
      //   this.rollState.set(trackIndex, undefined);
      //   Log.debug("JudgementService", "roll finished " + trackIndex)
      // }

      //Rogue/Stuck roll (if notes are too close)
      for (const note of track.filter(x =>
        !x.judged &&
        x.startedJudging &&
        !rollState &&
        x.type == NoteType.ROLL_HEAD &&
        x.related &&
        x.related.time < this.displayService.onCurrentTimeSecondsChange.value
      )) {
        note.judged = true;
        this.onJudged.next({
          judgement: note.judgement /* Judgement.ROLLFINISHED */,
          precision: 0,
          key: trackIndex
        });
        Log.debug("JudgementService", "rogue roll ", note)
      }

      let holdState = this.holdState.get(trackIndex)
      if (holdState && holdState.note.related && (holdState.note.related.time - (holdState.timer ? 0 : this.TimingWindowSecondsHold)) < this.displayService.onCurrentTimeSecondsChange.value) {
        if (holdState.timer)
          clearTimeout(holdState.timer);
        holdState.note.judged = true;
        this.onJudged.next({
          judgement: holdState.note.judgement /* Judgement.HOLDFINISHED */,
          precision: 0,
          key: trackIndex
        });
        this.holdState.set(trackIndex, undefined);
        Log.debug("JudgementService", "hold finished " + trackIndex)
      }

      //Rogue/Stuck hold (if notes are too close)
      for (const note of track.filter(x =>
        !x.judged &&
        x.startedJudging &&
        !holdState &&
        x.type == NoteType.HOLD_HEAD &&
        x.related &&
        x.related.time < this.displayService.onCurrentTimeSecondsChange.value
      )) {
        note.judged = true;
        this.onJudged.next({
          judgement: note.judgement /* Judgement.HOLDFINISHED */,
          precision: 0,
          key: trackIndex
        });
        Log.debug("JudgementService", "rogue hold ", note)
      }
    }
  }

  judgePress(key: Key, keyPressed: boolean) {
    if (!this.gameInProgress || !this.displayService.requestedGame) return;
    if (keyPressed) {
      this.rearmRoll(+key);
      this.unarmHold(+key);


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
      state.note.stateChangeTime = this.displayService.onCurrentTimeSecondsChange.value;
      Log.debug("JudgementService", "clearing timer " + state.timer)
      if (state.timer) {
        Log.debug("JudgementService", "clear timer " + state.timer)
        clearTimeout(state.timer);
        state.timer = undefined;
      }

      //was last roll
      if (state.note.related && (state.note.related.time - this.TimingWindowSecondsRoll) < this.displayService.onCurrentTimeSecondsChange.value) {
        state.note.judged = true;
        this.onJudged.next({
          judgement: state.note.judgement /* Judgement.ROLLFINISHED */,
          precision: 0,
          key: +direction
        });
        this.rollState.set(direction, undefined);
        Log.debug("JudgementService", "roll finished " + direction);
      } else {
        state.timer = setTimeout(() => {
          if (state)
            state.note.judged = true;
          this.rollState.set(direction, undefined);
          this.onJudged.next({
            judgement: Judgement.MISS /* Judgement.ROLLFAILED */,
            precision: this.TimingWindowSecondsRoll,
            key: +direction
          });
          Log.debug("JudgementService", "roll failed " + direction);
        }, this.TimingWindowSecondsRoll * 1000);
        //.log("set timer " + state.timer)
      }
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
        if (state)
          state.note.judged = true;
        this.holdState.set(direction, undefined);
        this.onJudged.next({
          judgement: Judgement.MISS /* Judgement.HOLDFAILED */,
          precision: this.TimingWindowSecondsHold,
          key: +direction
        });
        Log.debug("JudgementService", "hold failed " + direction)
      }, this.TimingWindowSecondsHold * 1000);
    }
  }

}
