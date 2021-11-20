import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { StepCounterService } from '@services/step-counter.service';
import { Subject, takeUntil } from 'rxjs';
import { StepCounterHistoryDialogComponent } from './step-counter-history-dialog.component';

@Component({
  selector: 'app-step-counter',
  templateUrl: './step-counter.component.html',
  styleUrls: ['./step-counter.component.scss']
})
export class StepCounterComponent implements OnDestroy {

  destroyed$ = new Subject<void>();

  stepsToday: number = 0;
  stepsAllTime: number = 0;

  constructor(
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    stepCounterService: StepCounterService,
    private matDialog: MatDialog,
  ) {
    iconRegistry.addSvgIcon('footsteps-icon', sanitizer.bypassSecurityTrustResourceUrl('assets/Icons/footsteps.svg'));
    stepCounterService.onStepChange.pipe(takeUntil(this.destroyed$)).subscribe((steps) => {
      this.stepsToday = steps.today;
      this.stepsAllTime = steps.allTime;
    })
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  openHistory() {
    this.matDialog.open(StepCounterHistoryDialogComponent, {
      width: "250px"
    });
  }
}
