import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatListOption, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { ParsedSimfile } from '@models/parsed-simfile';
import { SimfileLoaderService } from '@services/simfile-loader.service';
import { NgxY2PlayerOptions } from 'ngx-y2-player';
import { MediaService } from '@services/media.service';
import { ParsedSimfileMode } from '@models/parsed-simfile-mode';
import { Difficulty, GameMode, GameModeType, Key } from '@models/enums';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { GameRequest } from '@models/game-request';
import { KeyboardService } from '@services/keyboard.service';
import { LocalStorage } from '../../other/storage';
import { MatDrawerContainer } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-simfile-selector',
  templateUrl: './simfile-selector.component.html',
  styleUrls: ['./simfile-selector.component.scss']
})
export class SimfileSelectorComponent implements OnInit, OnDestroy {

  GameMode = GameMode;
  GameModeType = GameModeType;
  Difficulty = Difficulty;

  parsedSimfiles: ParsedSimfile[] = [];
  selectedSimfile?: ParsedSimfile;
  lastSelectedSimfileMode?: ParsedSimfileMode;
  selectedSimfileMode?: ParsedSimfileMode;
  selectedVideoId?: string;

  keyPressSubscribe?: Subscription;

  @ViewChild("simfiles") simFileSelector?: MatSelectionList;
  @ViewChild("simfileModes") simFileModeSelector?: MatSelectionList;
  @ViewChild("mainDrawerContainer") mainDrawerContainer?: MatDrawerContainer;
  @LocalStorage('', '') lastSelectedSimfileLocation!: string;

  playerOptions: NgxY2PlayerOptions = {
    height: 'auto',//screen.height, // you can set 'auto', it will use container width to set size
    width: 'auto',//screen.width,
    playerVars: {
      autoplay: 0,
      disablekb: YT.KeyboardControls.Disable,
      iv_load_policy: YT.IvLoadPolicy.Show,
      //controls: YT.Controls.Hide,
      //showinfo: YT.ShowInfo.Hide
    },
    // aspectRatio: (3 / 4), // you can set ratio of aspect ratio to auto resize with
  };

  constructor(private simfileLoaderService: SimfileLoaderService, private keyboardService: KeyboardService, private changeDetectorRef: ChangeDetectorRef) {
    this.parsedSimfiles = Array.from(simfileLoaderService.parsedSimfiles.values());
    this.selectedSimfile = this.parsedSimfiles.find(x => x.smFileLocation == this.lastSelectedSimfileLocation);

  }


  ngOnInit(): void {
    setTimeout(() => {
      this.mainDrawerContainer?.updateContentMargins();
    }, 0);
    this.keyPressSubscribe = this.keyboardService.onPress.subscribe((keyEv) => {
      if (keyEv.state) {
        switch (keyEv.key) {
          case Key.UP:
          case Key.DOWN:
            if (this.selectedSimfile && this.simFileModeSelector) {
              let toSelect: MatListOption = keyEv.key == Key.UP ? this.simFileModeSelector.options.last : this.simFileModeSelector.options.first;
              if (this.simFileModeSelector.selectedOptions.selected.length > 0) {
                let indexChange = keyEv.key == Key.UP ? -1 : 1;
                let selected = this.simFileModeSelector.selectedOptions.selected[0]
                let allOptions = this.simFileModeSelector.options.toArray();
                let selectedIndex = allOptions.indexOf(selected);
                toSelect = this.simFileModeSelector.options.get(selectedIndex + indexChange) ?? toSelect;
              }
              this.simFileModeSelector.selectedOptions.select(toSelect);
              toSelect.focus();
              this.selectSimfileMode(toSelect.value);
            }
            break;
          case Key.LEFT:
          case Key.RIGHT:
            if (this.simFileSelector) {
              let toSelect: MatListOption = keyEv.key == Key.LEFT ? this.simFileSelector.options.last : this.simFileSelector.options.first;
              if (this.simFileSelector.selectedOptions.selected.length > 0) {
                let indexChange = keyEv.key == Key.LEFT ? -1 : 1;
                let selected = this.simFileSelector.selectedOptions.selected[0]
                let allOptions = this.simFileSelector.options.toArray();
                let selectedIndex = allOptions.indexOf(selected);
                toSelect = this.simFileSelector.options.get(selectedIndex + indexChange) ?? toSelect;
              }
              this.simFileSelector.selectedOptions.select(toSelect);
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

  ngOnDestroy(): void {
    this.keyPressSubscribe?.unsubscribe();
  }

  currentAnimationFrame?: number;
  player?: YT.Player;
  lastTime: number = 0;
  from: number = 0;
  to: number = 0;

  onVideoReady(event: YT.PlayerEvent) {
    // this.mediaService.setPlayer(event.target);
    this.player = event.target;
    if (this.currentAnimationFrame)
      cancelAnimationFrame(this.currentAnimationFrame);
    this.currentAnimationFrame = requestAnimationFrame(this.tick.bind(this));
  }

  tick() {
    // if (this.player && this.selectedSimfile) {
    //   let time = this.player.getCurrentTime();
    //   if(time > (this.to + 1)){
    //     this.player.seekTo(this.from - 1, true);
    //     this.player.playVideo();
    //   }

    //   if(time >= this.from && time < this.to){
    //     this.player.seekTo(this.to, true);
    //     this.player.playVideo();
    //   }
    // }

    if (this.player && this.selectedSimfile) {
      var newTime = +this.player.getCurrentTime().toFixed(4)
      if (this.lastTime != newTime) {
        this.lastTime = newTime;
      }
      for (let skip of this.selectedSimfile.skips) {
        if (this.lastTime >= skip.from) {
          if (!skip.to) {
            this.player.stopVideo();
            console.log("ending", skip.from);
            return;
          }
          if (this.lastTime < skip.to) {
            this.player.seekTo(skip.to, true);
            this.player.playVideo();
            console.log("skipping", skip.from, skip.to);
          }
        }
      }
    }
    this.currentAnimationFrame = requestAnimationFrame(this.tick.bind(this));
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
    this.lastSelectedSimfileMode = this.selectedSimfileMode;
    this.selectedSimfileMode = parsedSimfileMode;
  }

  onSimfileModeSelectionChange(ev: MatSelectionListChange) {
    if (ev.options.length > 0) {
      this.selectSimfileMode(ev.options[0].value);
    }
  }

  onVideoSelected(ev: MatTabChangeEvent) {
    this.selectedVideoId = this.selectedSimfile?.youtubeVideoIds[ev.index];
  }

  playSelectedMode() {
    if (!this.selectedSimfile || !this.selectedSimfileMode)
      return;
    if (!this.selectedVideoId)
      this.selectedVideoId = this.selectedSimfile.youtubeVideoIds[0];
    this.simfileLoaderService.requestGame(new GameRequest(this.selectedSimfile, this.selectedSimfileMode, this.selectedVideoId));
  }

  getCompareWith() {
    let context = this;
    return (lastSelectedSimfileMode: ParsedSimfileMode, mode: ParsedSimfileMode) => {
      context.changeDetectorRef.detectChanges();
      return (mode.difficulty == lastSelectedSimfileMode.difficulty && mode.gameModeType == lastSelectedSimfileMode.gameModeType && mode.gameMode == lastSelectedSimfileMode.gameMode);
    }
  }
}
