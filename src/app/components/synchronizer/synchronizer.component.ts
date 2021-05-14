import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { ParsedSimfile } from '@models/parsed-simfile';
import { SimfileRegistryYoutubeInfo } from '@models/simfile-registry-youtube-info';
import { SimfileLoaderService } from '@services/simfile-loader.service';
import { NgxY2PlayerComponent, NgxY2PlayerOptions } from 'ngx-y2-player';

@Component({
  selector: 'app-synchronizer',
  templateUrl: './synchronizer.component.html',
  styleUrls: ['./synchronizer.component.css']
})
export class SynchronizerComponent implements OnInit {

  offset: number = 0;
  from: number = 0;
  to: number = 0;

  selectedVideo?: SimfileRegistryYoutubeInfo;
  selectedSimfile?: ParsedSimfile;
  @ViewChild('video') video?: NgxY2PlayerComponent;
  @ViewChild("audioPlayer") audioPlayerRef?: ElementRef<HTMLAudioElement>
  get audioPlayer(): HTMLAudioElement | undefined {
    return this.audioPlayerRef?.nativeElement;
  }

  playerOptions: NgxY2PlayerOptions = {
    height: 'auto',//screen.height, // you can set 'auto', it will use container width to set size
    width: 'auto',//screen.width,
    playerVars: {
      start: 20,
      autoplay: 0,
      disablekb: YT.KeyboardControls.Disable,
      iv_load_policy: YT.IvLoadPolicy.Show,
      //controls: YT.Controls.Hide,
      //showinfo: YT.ShowInfo.Hide
    },
    // aspectRatio: (3 / 4), // you can set ratio of aspect ratio to auto resize with
  };

  constructor(private route: ActivatedRoute, private s1imfileLoaderService: SimfileLoaderService) { }

  ngOnInit() {
    this.s1imfileLoaderService.parsedSimfilesLoaded.subscribe((loaded) => {
      if (!loaded) return;
      this.selectedSimfile = this.s1imfileLoaderService.parsedSimfiles?.get(this.route.snapshot.paramMap.get('filename') || '');
    });
  }

  onVideoReady(event: YT.PlayerEvent) {
    // this.mediaService.setPlayer(event.target);
    // this.player = event.target;
    // if (this.currentAnimationFrame)
    //   cancelAnimationFrame(this.currentAnimationFrame);
    // this.currentAnimationFrame = requestAnimationFrame(this.tick.bind(this));
  }

  onVideoSelected(ev: MatTabChangeEvent) {
    this.selectedVideo = this.selectedSimfile?.youtubeVideos[ev.index];
  }

  audioSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length == 1) {
      console.log("FileUpload -> files", fileList);

      if (this.audioPlayer) {
        this.audioPlayer.src = URL.createObjectURL(fileList[0]);
        this.audioPlayer.load();

        // this.audioPlayer.play();
      }
    }
  }

  reset() {
    if (this.audioPlayer && this.audioPlayer.duration && this.video) {
      this.audioPlayer.currentTime = this.from + this.offset /1000;
      this.audioPlayer.pause();
      this.video.videoPlayer.seekTo(this.to, true);
      this.video.videoPlayer.pauseVideo();

    }

  }

  play() {
    if (this.audioPlayer && this.audioPlayer.duration && this.video) {
      // if (this.offset != 0) {
      //   setTimeout(() => {
      //     this.video?.videoPlayer.playVideo();
      //   }, this.offset);
      // } else {
        this.video?.videoPlayer.playVideo();
      //}
      this.audioPlayer.play();
    }

  }

  changeOffset(ev: Event) {
    this.offset = +(<HTMLInputElement>ev.target).value;
    this.reset();
    this.play();
  }

  changeFrom(ev: Event) {
    this.from = +(<HTMLInputElement>ev.target).value;
    this.reset();
    this.play();
  }

  changeTo(ev: Event) {
    this.to = +(<HTMLInputElement>ev.target).value;
    this.reset();
    this.play();
  }
}
