import { Injectable } from '@angular/core';
import { Judgement, SuccessfullStepJudgements } from '@models/enums';
import { LocalStorage } from '@other/storage';
import { BehaviorSubject } from 'rxjs';
import { JudgementService } from './judgement.service';

@Injectable({
  providedIn: 'root'
})
export class StepCounterService {

  /**
   * Local storage of step counter settings
   * @description keeps array of all per day steps in localstorage by timestamp
   * @details sum of all steps is at position 0; resets at 3 AM
   */
  @LocalStorage('', {}) private stepHistory!: { [date: number]: number };

  onStepChange = new BehaviorSubject<{ allTime: number, today: number }>({ allTime: 0, today: 0 });

  private get todayTimestamp() {
    let now = new Date();
    now.setHours(now.getHours() - 3); //resets at 3 AM
    return now.setHours(0, 0, 0, 0);
  }

  constructor(judgementService: JudgementService) {
    this.reportSteps();
    judgementService.onJudged.subscribe(judgement => {
      if (SuccessfullStepJudgements.indexOf(judgement.judgement) > -1) {
        this.incrementSteps();
        this.reportSteps();
      }
    });
  }

  private reportSteps() {
    this.onStepChange.next({
      allTime: this.stepHistory[0] ?? 0,
      today: this.stepHistory[this.todayTimestamp] ?? 0
    });
  }

  private incrementSteps() {
    let today = this.todayTimestamp;
    let history = this.stepHistory;
    history[0] = (history[0] ?? 0) + 1;
    history[today] = (history[today] ?? 0) + 1;
    this.stepHistory = history;
  }


}
