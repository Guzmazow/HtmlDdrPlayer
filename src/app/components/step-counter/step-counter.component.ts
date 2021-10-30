import { Component, OnDestroy } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Log } from '@services/log.service';
import { StepCounterService } from '@services/step-counter.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-step-counter',
  templateUrl: './step-counter.component.html',
  styleUrls: ['./step-counter.component.scss']
})
export class StepCounterComponent implements OnDestroy {

  destroyed$ = new Subject<void>();

  stepsToday: number = 0;
  stepsAllTime: number = 0;

  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer, stepCounterService: StepCounterService) {
    iconRegistry.addSvgIcon(
      'footsteps-icon',
      sanitizer.bypassSecurityTrustResourceUrl('assets/Icons/footsteps.svg'));
    stepCounterService.onStepChange.pipe(takeUntil(this.destroyed$)).subscribe((steps) => {
      this.stepsToday = steps.today;
      this.stepsAllTime = steps.allTime;
    })
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
