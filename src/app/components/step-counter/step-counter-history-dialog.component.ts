import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { StepCounterService } from '@services/step-counter.service';

@Component({
  selector: 'app-step-counter-history-dialog',
  templateUrl: './step-counter-history-dialog.component.html',
  styleUrls: ['./step-counter-history-dialog.component.scss']
})
export class StepCounterHistoryDialogComponent {

  readonly total: number = 0;
  readonly history: MatTableDataSource<{ date: number, count: number; }>;

  @ViewChild(MatSort) sort: MatSort | null = null;

  constructor(stepCounterService: StepCounterService) {
    const historyUnparsed = stepCounterService.getHistory();
    let history: { date: number, count: number; }[] = [];
    for (const key in historyUnparsed) {
      const date = +key;
      if (date == 0)
        continue;
      const count = historyUnparsed[date];
      if (count > 0) {
        history.push({ date: date, count: count });
        this.total += count;
      }
    }
    this.history = new MatTableDataSource(history);

  }

  ngAfterViewInit() {
    this.history.sort = this.sort;
  }
}
