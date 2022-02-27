import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatListOption, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { ParsedSimfile } from '@models/parsed-simfile';
import { SimfileLoaderService } from '@services/simfile-loader.service';
import { NgxY2PlayerOptions } from 'ngx-y2-player';
import { ParsedSimfileMode } from '@models/parsed-simfile-mode';
import { Difficulty, DifficultyShort, GameMode, GameModeType, Key } from '@models/enums';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { GameRequest } from '@models/game-request';
import { KeyboardService } from '@services/keyboard.service';
import { LocalStorage } from '../../other/storage';
import { MatDrawerContainer } from '@angular/material/sidenav';
import { SimfileRegistryDailyMotionInfo, SimfileRegistryYoutubeInfo } from '@models/simfile-registry-video-info';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Log } from '@services/log.service';
import { MatDialog } from '@angular/material/dialog';
import { ParsedSimfileFolder } from '@models/parsed-folder';
import { SelectableModesPipe } from 'src/app/pipes/selectable-modes.pipe';
import { PreferenceService } from '@services/preference.service';

@Component({
  selector: 'app-simfile-selector',
  templateUrl: './simfile-selector.component.html',
  styleUrls: ['./simfile-selector.component.scss']
})
export class SimfileSelectorComponent implements OnInit, OnDestroy {

  destroyed$ = new Subject<void>();

  GameMode = GameMode;
  GameModeType = GameModeType;
  DifficultyShort = DifficultyShort;

  firstVideoStopped = false;
  simfileFolders: ParsedSimfileFolder[] = [];
  selectedSimfileFolder?: ParsedSimfileFolder;
  simfilesInSelectedFolder: ParsedSimfile[] = [];
  selectedSimfile?: ParsedSimfile;
  selectedSimfileMode?: ParsedSimfileMode;
  selectedYTVideo?: SimfileRegistryYoutubeInfo;
  selectedDMVideo?: SimfileRegistryDailyMotionInfo;


  @ViewChild("simfileSelect") simfileSelect?: MatSelectionList;
  @ViewChild("simfileFolderSelect") simfileFolderSelect?: MatSelectionList;
  @ViewChild("folderDrawerContainer") folderDrawerContainer?: MatDrawerContainer;
  @ViewChild("simfileDrawerContainer") simfileDrawerContainer?: MatDrawerContainer;
  @LocalStorage('', Difficulty.NONE) lastSelectedSimfileDifficulty!: Difficulty;
  @LocalStorage('', 0) lastSelectedSimfileDifficultyIndex!: number;
  @LocalStorage('', '') lastSelectedSimfileLocation!: string;
  @LocalStorage('', '') lastSelectedSimfileFolderLocation!: string;

  constructor(
    private simfileLoaderService: SimfileLoaderService,
    private keyboardService: KeyboardService,
    private changeDetectorRef: ChangeDetectorRef,
    public dialog: MatDialog,
    private preferenceService: PreferenceService
  ) {
  }

  blurFix() {
    if (document.activeElement)
      (document.activeElement as HTMLElement).blur();
  }

  antiGlitch() {
    setTimeout(() => {
      //slow ui fixes
      this.folderDrawerContainer?.updateContentMargins();
      this.simfileDrawerContainer?.updateContentMargins();
      if (this.simfileFolderSelect && this.simfileFolderSelect.selectedOptions.selected.length > 0)
        this.simfileFolderSelect.selectedOptions.selected[0].focus();
      if (this.simfileSelect && this.simfileSelect.selectedOptions.selected.length > 0)
        this.simfileSelect.selectedOptions.selected[0].focus();

      this.blurFix();
    }, 200);
  }

  ngOnInit(): void {
    this.simfileLoaderService.parsedSimfilesLoaded.pipe(takeUntil(this.destroyed$)).subscribe(loaded => {
      if (!loaded) return;
      if (this.simfileLoaderService.parsedSimfileFolders) {
        this.simfileFolders = Array.from(this.simfileLoaderService.parsedSimfileFolders.values());
        this.loadScores();
        this.selectedSimfileFolder = this.simfileFolders.find(x => x.location == this.lastSelectedSimfileFolderLocation) ?? this.simfileFolders[0];
        this.simfilesInSelectedFolder = Array.from(this.selectedSimfileFolder?.parsedSimfiles?.values() ?? []);
        this.selectedSimfile = this.simfilesInSelectedFolder.find(x => x.smFileLocation == this.lastSelectedSimfileLocation);
        this.selectedSimfileMode = this.selectableModes().find(x => x.difficulty == this.lastSelectedSimfileDifficulty);
      }
      this.antiGlitch();
    });
    this.keyboardService.onPress.pipe(takeUntil(this.destroyed$)).subscribe((keyEv) => {
      if (keyEv.state) {
        switch (keyEv.key) {
          case Key.UP:
          case Key.DOWN:
            if (this.selectedSimfile) {
              let modes = this.selectableModes();
              let toSelect: ParsedSimfileMode = keyEv.key == Key.UP ? modes[modes.length - 1] : modes[0];
              if (this.selectedSimfileMode) {
                let indexChange = keyEv.key == Key.UP ? -1 : 1;
                let selectedIndex = modes.indexOf(this.selectedSimfileMode);
                toSelect = modes[selectedIndex + indexChange] ?? toSelect;
              }
              this.selectSimfileMode(toSelect);
            }
            break;
          case Key.LEFT:
          case Key.RIGHT:
            if (this.simfileSelect) {
              let toSelect: MatListOption = keyEv.key == Key.LEFT ? this.simfileSelect.options.last : this.simfileSelect.options.first;
              if (this.simfileSelect.selectedOptions.selected.length > 0) {
                let indexChange = keyEv.key == Key.LEFT ? -1 : 1;
                let selected = this.simfileSelect.selectedOptions.selected[0]
                let allOptions = this.simfileSelect.options.toArray();
                let selectedIndex = allOptions.indexOf(selected);
                toSelect = this.simfileSelect.options.get(selectedIndex + indexChange) ?? toSelect;
              }
              this.simfileSelect.selectedOptions.select(toSelect);
              toSelect.focus();
              this.blurFix();
              this.selectSimfile(toSelect.value);
            }
            break;
          case Key.SELECT:
          case Key.START:
            this.playSelectedMode();
            break;
        }
      }
    });
  }

  loadScores() {
    let scores: { [folderName: string]: { [filename: string]: { [mode: string]: number[] } } } = JSON.parse(localStorage.getItem('ScorePercentage') || '{}');
    for (let folder of this.simfileFolders) {
      let folderScores = scores[folder.location];
      if (!folderScores) continue;
      for (let simfile of (folder.parsedSimfiles ?? []).values()) {
        let simfileScores = folderScores[simfile.filename];
        if (!simfileScores) continue;
        for (let simfileMode of simfile.modes) {
          simfileMode.scores = simfileScores[Difficulty[simfileMode.difficulty]];
          if (simfileMode.scores) {
            simfileMode.displayScores = simfileMode.scores.map(x => this.numberScoreToLetterScore(x)).join("; ");
            simfileMode.bestScore = this.numberScoreToLetterScore(Math.max(...simfileMode.scores));
          }
        }
      }
    }
  }

  numberScoreToLetterScore(score: number) {
    return new Number(35 - Math.round(score * 25 / 100)).toString(36).toUpperCase();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  selectSimfileFolder(folder: ParsedSimfileFolder) {
    this.selectedSimfileFolder = folder;
    this.lastSelectedSimfileFolderLocation = folder.location;
    this.simfilesInSelectedFolder = Array.from(this.selectedSimfileFolder?.parsedSimfiles?.values() ?? []);
    this.selectSimfile(this.simfilesInSelectedFolder[0]);
    this.antiGlitch();
  }

  onSimfileFolderSelectionChange(ev: MatSelectionListChange) {
    if (ev.options.length > 0) {
      this.selectSimfileFolder(ev.options[0].value);
    }
  }

  selectableModes() {
    const pipe = new SelectableModesPipe(this.preferenceService);
    return pipe.transform(this.selectedSimfile?.modes ?? []);
  }

  selectSimfile(parsedSimfile: ParsedSimfile) {
    this.firstVideoStopped = true;;
    this.selectedSimfile = parsedSimfile;
    this.lastSelectedSimfileLocation = this.selectedSimfile.smFileLocation;


    this.selectedYTVideo = undefined;
    this.selectedDMVideo = undefined;
    //select last selected difficulty orelse closest orelse last
    const modes = this.selectableModes();
    this.selectSimfileMode(modes.find(x => x.difficulty == this.lastSelectedSimfileDifficulty) ?? modes[this.lastSelectedSimfileDifficultyIndex - 1] ?? modes[modes.length - 1], false);
  }

  onSimfileSelectionChange(ev: MatSelectionListChange) {
    if (ev.options.length > 0) {
      this.selectSimfile(ev.options[0].value);
    }    
  }

  selectSimfileMode(parsedSimfileMode: ParsedSimfileMode, changeLastValues = true) {
    this.selectedSimfileMode = parsedSimfileMode;
    if (changeLastValues) {
      this.lastSelectedSimfileDifficulty = parsedSimfileMode.difficulty;
      this.lastSelectedSimfileDifficultyIndex = this.selectableModes().indexOf(parsedSimfileMode) ?? 0;
    }
  }

  onYTVideoSelected(ev: MatTabChangeEvent) {
    this.selectedYTVideo = this.selectedSimfile?.youtubeVideos[ev.index];
  }

  onDMVideoSelected(ev: MatTabChangeEvent) {
    this.selectedDMVideo = this.selectedSimfile?.dailyMotionVideos[ev.index];
  }

  onVideoReady(ev: YT.PlayerEvent) {
    ev.target.setVolume(25);
    if (!this.firstVideoStopped) {
      ev.target.stopVideo();
    }
  };

  playSelectedMode() {
    if (!this.selectedSimfileFolder || !this.selectedSimfile || !this.selectedSimfileMode)
      return;
    if (!this.selectedYTVideo)
      this.selectedYTVideo = this.selectedSimfile.youtubeVideos[0];
    if (!this.selectedDMVideo)
      this.selectedDMVideo = this.selectedSimfile.dailyMotionVideos[0];
    this.simfileLoaderService.requestGame(new GameRequest(this.selectedSimfileFolder, this.selectedSimfile, this.selectedSimfileMode, this.selectedYTVideo, this.selectedDMVideo));
  }

  getCompareWith() {
    let context = this;
    return (lastSelectedSimfileMode: ParsedSimfileMode, mode: ParsedSimfileMode) => {
      context.changeDetectorRef.detectChanges();
      return (mode.difficulty == lastSelectedSimfileMode.difficulty && mode.gameModeType == lastSelectedSimfileMode.gameModeType && mode.gameMode == lastSelectedSimfileMode.gameMode);
    }
  }
}
