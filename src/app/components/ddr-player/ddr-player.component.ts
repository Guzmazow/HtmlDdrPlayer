import { Component, OnInit, ViewChild } from '@angular/core';
import { DisplayService } from '@services/display.service';
import { ParsingService } from '@services/parsing.service';
import { MediaService } from '@services/media.service';
import { NgxY2PlayerComponent, NgxY2PlayerOptions } from 'ngx-y2-player';

@Component({
  selector: 'app-ddr-player',
  templateUrl: './ddr-player.component.html',
  styleUrls: ['./ddr-player.component.css']
})
export class DdrPlayerComponent implements OnInit {

  screenWidth: number = screen.width;
  screenHeight: number = screen.height;
  startedPlaying: boolean = false;

  @ViewChild('video') video!: NgxY2PlayerComponent;
  videoId = 'SL_jZSRZ_Bo';//'z8WdQsPknf0'; // string or string array;

  playerOptions: NgxY2PlayerOptions = {
    height: screen.height, // you can set 'auto', it will use container width to set size
    width: screen.width,
    playerVars: {
      autoplay: 0,
      disablekb: YT.KeyboardControls.Disable,
      iv_load_policy: YT.IvLoadPolicy.Hide,
      controls: YT.Controls.Hide,
      showinfo: YT.ShowInfo.Hide
    },
    // aspectRatio: (3 / 4), // you can set ratio of aspect ratio to auto resize with
  };

  // pause() {
  //   this.video.videoPlayer.pauseVideo();
  // }

  // play() {
  //   this.video.videoPlayer.playVideo();
  // }

  // stop() {
  //   this.video.videoPlayer.stopVideo();
  // }

  // go(second: string) {
  //   this.video.videoPlayer.seekTo(+second, true);
  // }

  onVideoReady(event: YT.PlayerEvent) {
    this.mediaService.setPlayer(event.target);
    console.log('player ready');
  }

  constructor(
    private displayService: DisplayService,
    private parsingService: ParsingService,
    private mediaService: MediaService,
  ) { }

  ngOnInit(): void {
    this.parsingService.onSimLoaded.subscribe(()=>{
      this.mediaService.prepareMedia();
    })
    this.parsingService.loadSim('/assets/Songs/Sneakman/Sneakman.sm');
  }

  // showParseInTextbox(parse: Note[][]) {
  //   document.getElementById("result-box-section").innerHTML =
  //     '<br><!--suppress HtmlUnknownAttribute --><input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value=' +
  //     JSON.stringify(parse) + '>';
  // }

  play(){
    this.displayService.setup();
    this.video.videoPlayer.playVideo();
    //this.mediaService.media.audio.play();
    this.displayService.load();
    this.startedPlaying = true;
  }

}
