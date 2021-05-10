import { Component, OnInit } from '@angular/core';
import { MatSelectionListChange } from '@angular/material/list';
import { ParsedSimfile } from '@models/parsed-simfile';
import { ParsingService } from '@services/parsing.service';
import { SimfileLoaderService } from '@services/simfile-loader.service';
import { NgxY2PlayerOptions } from 'ngx-y2-player';
import { MediaService } from '@services/media.service';
import { ParsedSimfileMode } from '@models/parsed-simfile-mode';
import { Difficulty, GameMode, GameModeType } from '@models/enums';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Subject } from 'rxjs';
import { GameRequest } from '@models/game-request';

@Component({
  selector: 'app-simfile-selector',
  templateUrl: './simfile-selector.component.html',
  styleUrls: ['./simfile-selector.component.scss']
})
export class SimfileSelectorComponent implements OnInit {

  GameMode = GameMode;
  GameModeType = GameModeType;
  Difficulty = Difficulty;

  parsedSimfiles: ParsedSimfile[] = [];
  selectedSimfile?: ParsedSimfile;
  selectedSimfileMode?: ParsedSimfileMode;
  selectedVideoId?: string;

  gameRequested = new Subject<GameRequest>();

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

  constructor(private simfileLoaderService: SimfileLoaderService,private mediaService: MediaService) {
    this.simfileLoaderService.parsedSimfilesLoaded.subscribe(() => {
      this.parsedSimfiles = Array.from(simfileLoaderService.parsedSimfiles.values());
    });


  }

  ngOnInit(): void {

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

  onSimfileSelectionChange(ev: MatSelectionListChange) {
    if (ev.options.length > 0) {
      this.selectedSimfile = ev.options[0].value;
    }
  }

  onSimfileModeSelectionChange(ev: MatSelectionListChange) {
    if (ev.options.length > 0) {
      this.selectedSimfileMode = ev.options[0].value;
    }
  }

  onVideoSelected(ev: MatTabChangeEvent){
    this.selectedVideoId = this.selectedSimfile?.youtubeVideoIds[ev.index];
  }

  playSelectedMode() {
    if(!this.selectedSimfile || !this.selectedSimfileMode)
      return;
    if(!this.selectedVideoId)
      this.selectedVideoId = this.selectedSimfile.youtubeVideoIds[0];
    this.gameRequested.next(new GameRequest(this.selectedSimfile, this.selectedSimfileMode, this.selectedVideoId));
  }


}
