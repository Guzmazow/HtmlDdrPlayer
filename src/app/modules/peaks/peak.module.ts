import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { WaveformViewComponent } from './waveform-view/waveform-view.component';
import { SegmentsListComponent } from './segments-list/segments-list.component';
import { PointsListComponent } from './points-list/points-list.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    WaveformViewComponent,
    SegmentsListComponent,
    PointsListComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    WaveformViewComponent
  ]
})

export class PeakModule { };
