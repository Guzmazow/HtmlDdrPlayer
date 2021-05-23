import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatListOption, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { ParsedSimfile } from '@models/parsed-simfile';
import { SimfileLoaderService } from '@services/simfile-loader.service';
import { NgxY2PlayerOptions } from 'ngx-y2-player';
import { ParsedSimfileMode } from '@models/parsed-simfile-mode';
import { Difficulty, GameMode, GameModeType, Key } from '@models/enums';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { GameRequest } from '@models/game-request';
import { KeyboardService } from '@services/keyboard.service';
import { LocalStorage } from '../../other/storage';
import { MatDrawerContainer } from '@angular/material/sidenav';
import { SimfileRegistryYoutubeInfo } from '@models/simfile-registry-youtube-info';
import { SimfileRegistryFolder } from '@models/simfile-registry-folder';
import { takeUntil } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-simfile-selector',
  templateUrl: './simfile-selector.component.html',
  styleUrls: ['./simfile-selector.component.scss']
})
export class SimfileSelectorComponent implements OnInit, OnDestroy {

  destroyed$ = new ReplaySubject<boolean>(1);

  GameMode = GameMode;
  GameModeType = GameModeType;
  Difficulty = Difficulty;

  simfileFolders: SimfileRegistryFolder[] = [];
  selectedSimfileFolder?: SimfileRegistryFolder;
  simfilesInSelectedFolder: ParsedSimfile[] = [];
  selectedSimfile?: ParsedSimfile;
  lastSelectedSimfileMode?: ParsedSimfileMode;
  selectedSimfileMode?: ParsedSimfileMode;
  selectedVideo?: SimfileRegistryYoutubeInfo;


  @ViewChild("simfileSelect") simfileSelect?: MatSelectionList;
  @ViewChild("simfileFolderSelect") simfileFolderSelect?: MatSelectionList;
  @ViewChild("simfileModeSelect") simfileModeSelect?: MatSelectionList;
  @ViewChild("folderDrawerContainer") folderDrawerContainer?: MatDrawerContainer;
  @ViewChild("simfileDrawerContainer") simfileDrawerContainer?: MatDrawerContainer;
  @LocalStorage('', Difficulty.NONE) lastSelectedSimfileDifficulty!: Difficulty;
  @LocalStorage('', '') lastSelectedSimfileLocation!: string;
  @LocalStorage('', '') lastSelectedSimfileFolderLocation!: string;

  playerOptions: NgxY2PlayerOptions = {
    height: 'auto',//screen.height, // you can set 'auto', it will use container width to set size
    width: 'auto',//screen.width,
    playerVars: {
      start: 0,
      end: undefined,
      autoplay: 0,
      disablekb: YT.KeyboardControls.Disable,
      iv_load_policy: YT.IvLoadPolicy.Show,
      //controls: YT.Controls.Hide,
      //showinfo: YT.ShowInfo.Hide
    },
    // aspectRatio: (3 / 4), // you can set ratio of aspect ratio to auto resize with
  };

  constructor(private simfileLoaderService: SimfileLoaderService, private keyboardService: KeyboardService, private changeDetectorRef: ChangeDetectorRef) {
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
    }, 200);
  }

  ngOnInit(): void {
    this.simfileLoaderService.parsedSimfilesLoaded.pipe(takeUntil(this.destroyed$)).subscribe(loaded => {
      if (!loaded) return;
      if (this.simfileLoaderService.simfileRegistryFolders) {
        this.simfileFolders = Array.from(this.simfileLoaderService.simfileRegistryFolders.values());
        this.loadScores();
        this.selectedSimfileFolder = this.simfileFolders.find(x => x.location == this.lastSelectedSimfileFolderLocation) ?? this.simfileFolders[0];
        this.simfilesInSelectedFolder = Array.from(this.selectedSimfileFolder?.parsedSimfiles?.values() ?? []);
        this.selectedSimfile = this.simfilesInSelectedFolder.find(x => x.smFileLocation == this.lastSelectedSimfileLocation);
        this.selectedSimfileMode = this.selectedSimfile?.modes.find(x => x.difficulty == this.lastSelectedSimfileDifficulty);
      }
      this.antiGlitch();
    });
    this.keyboardService.onPress.pipe(takeUntil(this.destroyed$)).subscribe((keyEv) => {
      console.log("still checking")
      if (keyEv.state) {
        switch (keyEv.key) {
          case Key.UP:
          case Key.DOWN:
            if (this.selectedSimfile && this.simfileModeSelect) {
              let toSelect: MatListOption = keyEv.key == Key.UP ? this.simfileModeSelect.options.last : this.simfileModeSelect.options.first;
              if (this.simfileModeSelect.selectedOptions.selected.length > 0) {
                let indexChange = keyEv.key == Key.UP ? -1 : 1;
                let selected = this.simfileModeSelect.selectedOptions.selected[0]
                let allOptions = this.simfileModeSelect.options.toArray();
                let selectedIndex = allOptions.indexOf(selected);
                toSelect = this.simfileModeSelect.options.get(selectedIndex + indexChange) ?? toSelect;
              }
              this.simfileModeSelect.selectedOptions.select(toSelect);
              toSelect.focus();
              this.selectSimfileMode(toSelect.value);
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
    let scores: { [folderName: string]: { [filename: string]: number[] } } = JSON.parse(localStorage.getItem('ScorePercentage') || '{}');
    for (let folder of this.simfileFolders) {
      let folderScores = scores[folder.location];
      if (!folderScores) continue;
      for (let simfile of folder.parsedSimfiles.values()) {
        let simfileScores = folderScores[simfile.filename];
        if (!simfileScores) continue;
        simfile.scores = simfileScores;
        if (simfile.scores) {
          simfile.displayScores = simfile.scores.map(x => new Number(35 - Math.round(x * 25 / 100)).toString(36).toUpperCase()).join("; ");
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  selectSimfileFolder(folder: SimfileRegistryFolder) {
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

  selectSimfile(parsedSimfile: ParsedSimfile) {
    this.selectedSimfile = parsedSimfile;
    this.lastSelectedSimfileLocation = this.selectedSimfile.smFileLocation;
  }

  onSimfileSelectionChange(ev: MatSelectionListChange) {
    if (ev.options.length > 0) {
      this.selectSimfile(ev.options[0].value);
    }
  }

  selectSimfileMode(parsedSimfileMode: ParsedSimfileMode) {
    this.lastSelectedSimfileDifficulty = parsedSimfileMode.difficulty;
    this.lastSelectedSimfileMode = this.selectedSimfileMode;
    this.selectedSimfileMode = parsedSimfileMode;
  }

  onSimfileModeSelectionChange(ev: MatSelectionListChange) {
    if (ev.options.length > 0) {
      this.selectSimfileMode(ev.options[0].value);
    }
  }

  onVideoSelected(ev: MatTabChangeEvent) {
    this.selectedVideo = this.selectedSimfile?.youtubeVideos[ev.index];
  }

  playSelectedMode() {
    if (!this.selectedSimfileFolder || !this.selectedSimfile || !this.selectedSimfileMode)
      return;
    if (!this.selectedVideo)
      this.selectedVideo = this.selectedSimfile.youtubeVideos[0];
    this.simfileLoaderService.requestGame(new GameRequest(this.selectedSimfileFolder, this.selectedSimfile, this.selectedSimfileMode, this.selectedVideo));
  }

  getCompareWith() {
    let context = this;
    return (lastSelectedSimfileMode: ParsedSimfileMode, mode: ParsedSimfileMode) => {
      context.changeDetectorRef.detectChanges();
      return (mode.difficulty == lastSelectedSimfileMode.difficulty && mode.gameModeType == lastSelectedSimfileMode.gameModeType && mode.gameMode == lastSelectedSimfileMode.gameMode);
    }
  }
}
