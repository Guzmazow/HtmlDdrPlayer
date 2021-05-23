import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DisplayService } from '@services/display.service';
import { MediaService } from '@services/media.service';
import { NgxY2PlayerComponent, NgxY2PlayerOptions } from 'ngx-y2-player';
import { SimfileLoaderService } from '@services/simfile-loader.service';
import { takeUntil } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-ddr-player',
  templateUrl: './ddr-player.component.html',
  styleUrls: ['./ddr-player.component.scss']
})
export class DdrPlayerComponent implements OnInit, OnDestroy {

  destroyed$ = new ReplaySubject<boolean>(1);

  screenWidth: number = screen.width;
  screenHeight: number = screen.height;
  startedPlaying: boolean = false;

  videoId: string = "";

  @ViewChild('video') video?: NgxY2PlayerComponent;

  playerOptions: NgxY2PlayerOptions = {
    height: screen.height, // you can set 'auto', it will use container width to set size
    width: screen.width,
    playerVars: {
      autoplay: 0,
      disablekb: YT.KeyboardControls.Disable,
      iv_load_policy: YT.IvLoadPolicy.Show,
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
    if(!this.video) return;
    this.mediaService.setPlayer(event.target);
    this.displayService.play();
    this.video.videoPlayer.playVideo();
    this.startedPlaying = true;
  }

  constructor(
    private displayService: DisplayService,
    private mediaService: MediaService,
    private simfileLoaderService: SimfileLoaderService
  ) {
    this.simfileLoaderService.gameRequested.pipe(takeUntil(this.destroyed$)).subscribe(r=>{
      this.videoId = r?.youtubeVideo.id ?? "";
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  ngOnInit(): void {

    //this.parsingService.loadSim('Sneakman.sm','/assets/Songs/Sneakman/Sneakman.sm');
  }

  // showParseInTextbox(parse: Note[][]) {
  //   document.getElementById("result-box-section").innerHTML =
  //     '<br><!--suppress HtmlUnknownAttribute --><input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value=' +
  //     JSON.stringify(parse) + '>';
  // }


}
