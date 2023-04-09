import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from '@components/home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { HttpClientModule } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';

import { DdrPlayerComponent } from '@components/ddr-player/ddr-player.component';
import { NoteLaneComponent } from '@components/note-lane/note-lane.component';
import { JudgementComponent } from '@components/judgement/judgement.component';
import { ReceptorComponent } from '@components/receptor/receptor.component';
import { NgxY2PlayerModule } from 'ngx-y2-player';
import { SimfileSelectorComponent } from '@components/simfile-selector/simfile-selector.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KeyboardService } from '@services/keyboard.service';
import { YoutubeVideoComponent } from '@components/youtube-video/youtube-video.component';
import { SynchronizerComponent } from '@components/synchronizer/synchronizer.component';
import { SerialComponent } from '@components/serial/serial.component';
import { StepCounterComponent } from '@components/step-counter/step-counter.component';
import { PreferencesComponent } from '@components/preferences/preferences.component';
import { PreferencesDialogComponent } from '@components/preferences/preferences-dialog.component';
import { SelectableModesPipe } from '@pipes/selectable-modes.pipe';
import { MediaService } from '@services/media.service';
import { StepCounterHistoryDialogComponent } from '@components/step-counter/step-counter-history-dialog.component';
import { SimfileGeneratorComponent } from './components/simfile-generator/simfile-generator.component';
import { DailymotionVideoComponent } from './components/dailymotion-video/dailymotion-video/dailymotion-video.component';
import { SafePipe } from '@pipes/safe.pipe.';
import { PeakModule } from './modules/peaks/peak.module';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DdrPlayerComponent,
    NoteLaneComponent,
    JudgementComponent,
    ReceptorComponent,
    SimfileSelectorComponent,
    YoutubeVideoComponent,
    SynchronizerComponent,
    SerialComponent,
    StepCounterComponent,
    PreferencesComponent,
    PreferencesDialogComponent,
    SelectableModesPipe,
    SafePipe,
    StepCounterHistoryDialogComponent,
    SimfileGeneratorComponent,
    DailymotionVideoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatCardModule,
    MatExpansionModule,
    MatTableModule,
    MatSortModule,
    MatRippleModule,
    MatDialogModule,
    NgxY2PlayerModule,
    MatListModule,
    MatTabsModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    MatBadgeModule,
    PeakModule,
  ],
  providers: [KeyboardService, MediaService],
  bootstrap: [AppComponent]
})
export class AppModule { }
