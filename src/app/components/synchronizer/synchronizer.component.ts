import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { ParsedSimfile } from '@models/parsed-simfile';
import { SimfileRegistryYoutubeInfo } from '@models/simfile-registry-video-info';
import { Log } from '@services/log.service';
import { SimfileLoaderService } from '@services/simfile-loader.service';
import { NgxY2PlayerComponent, NgxY2PlayerOptions } from 'ngx-y2-player';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-synchronizer',
  templateUrl: './synchronizer.component.html',
  styleUrls: ['./synchronizer.component.scss']
})
export class SynchronizerComponent implements OnInit, OnDestroy {

  destroyed$ = new Subject<void>();

  youtubeVideoForm?: FormGroup;
  get youtubeVideoFormSkips(): FormArray {
    return this.youtubeVideoForm?.get('skips') as FormArray;
  }
  addSkip(from: number = 0, to: number | null = null) {
    if (confirm('You sure about that?')) {
      this.youtubeVideoFormSkips.push(new FormGroup({
        'from': new FormControl(from),
        'to': new FormControl(to),
        'skipped': new FormControl(false),
      }));
    }
  }

  removeSkip() {
    if (confirm('You sure about that?')) {
      this.youtubeVideoFormSkips.removeAt(this.youtubeVideoFormSkips.length - 1)
    }
  }

  lastFrame: number = 0;

  audioLocation: number = 0;
  videoLocation: number = 0;

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
      //start: 20,
      autoplay: 0,
      disablekb: YT.KeyboardControls.Disable,
      iv_load_policy: YT.IvLoadPolicy.Show,
      //controls: YT.Controls.Hide,
      //showinfo: YT.ShowInfo.Hide
    },
    // aspectRatio: (3 / 4), // you can set ratio of aspect ratio to auto resize with
  };

  constructor(private route: ActivatedRoute, private s1imfileLoaderService: SimfileLoaderService) {

  }

  matchLocation() {
    this.audioLocation = this.audioPlayer?.currentTime ?? 0;
    if (this.video?.videoPlayer?.getCurrentTime)
      this.videoLocation = this.video?.videoPlayer.getCurrentTime() ?? 0;
    this.lastFrame = requestAnimationFrame(this.matchLocation.bind(this));
  }

  ngOnInit() {
    this.s1imfileLoaderService.parsedSimfilesLoaded.pipe(takeUntil(this.destroyed$)).subscribe((loaded) => {
      if (!loaded) return;
      this.selectedSimfile = this.s1imfileLoaderService.parsedSimfileFolders?.get(this.route.snapshot.paramMap.get('foldername') || '')?.parsedSimfiles?.get(this.route.snapshot.paramMap.get('filename') || '');
      if (this.selectedSimfile && this.selectedSimfile.youtubeVideos.length > 0)
        this.selectVideo(this.selectedSimfile?.youtubeVideos[0]);
    });
    requestAnimationFrame(this.matchLocation.bind(this));
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    cancelAnimationFrame(this.lastFrame);
  }

  initYoutubeVideoForm(youtubeVideo: SimfileRegistryYoutubeInfo) {
    this.youtubeVideoForm = new FormGroup({
      'id': new FormControl(null),
      'offset': new FormControl(null),
      'skips': new FormArray(youtubeVideo.skips?.map(x => new FormGroup({
        'from': new FormControl(null),
        'to': new FormControl(null),
        'skipped': new FormControl(null),
      })) ?? [])
    });

    this.youtubeVideoForm?.patchValue(youtubeVideo);

    this.youtubeVideoForm?.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(newValue => {
      Object.assign(this.selectedVideo, newValue);
    });
  }

  selectVideo(youtubeVideo: SimfileRegistryYoutubeInfo) {
    this.selectedVideo = youtubeVideo;
    this.initYoutubeVideoForm(youtubeVideo);
  }

  onVideoReady(event: YT.PlayerEvent) {
    // this.mediaService.setPlayer(event.target);
    // this.player = event.target;
    // if (this.currentAnimationFrame)
    //   cancelAnimationFrame(this.currentAnimationFrame);
    // this.currentAnimationFrame = requestAnimationFrame(this.tick.bind(this));
  }

  onVideoSelected(ev: MatTabChangeEvent) {
    if (this.selectedSimfile)
      this.selectVideo(this.selectedSimfile?.youtubeVideos[ev.index]);
  }

  audioSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length == 1) {
      Log.debug("SynchronizerComponent", "FileUpload -> files");

      if (this.audioPlayer) {
        this.audioPlayer.src = URL.createObjectURL(fileList[0]);
        this.audioPlayer.load();

        // this.audioPlayer.play();
      }
    }
  }

  reset() {
    if (this.audioPlayer && this.audioPlayer.duration && this.video && this.selectedVideo) {
      let originalSkip = 0;
      for (let index = 0; index < this.selectedVideo.skips.length - 1 /*Last skip not yet applied*/; index++) {
        originalSkip -= (this.selectedVideo.skips[index]?.to ?? 0) - (this.selectedVideo.skips[index].from ?? 0);
      }

      let lastSkip = this.selectedVideo.skips[this.selectedVideo.skips.length - 1];
      this.audioPlayer.currentTime = (lastSkip?.from ?? 0) + originalSkip + (this.selectedVideo?.offset ?? 0);
      this.audioPlayer.pause();
      this.video.videoPlayer.seekTo(lastSkip?.to ?? 0, true);
      this.video.videoPlayer.pauseVideo();
    }

  }

  pauseVideo() {
    this.video?.videoPlayer.pauseVideo();
  }

  playVideo() {
      this.video?.videoPlayer.playVideo();
    
  }

  pauseAudio() {
    this.audioPlayer?.pause();
  }

  playAudio() {
    if (this.audioPlayer && this.audioPlayer.duration) {
      this.audioPlayer.play();
    }
  }

  pause() {
    this.pauseVideo();
    this.pauseAudio();
  }

  play() {
    this.playVideo();
    this.playAudio();
  }

  unplay10msAudio() {
    if (this.audioPlayer) {
      this.audioPlayer.currentTime = this.audioPlayer.currentTime - 0.01;
    }
  }

  unplay10msVideo() {
    if (this.video) {
      this.video.videoPlayer.seekTo(this.video.videoPlayer.getCurrentTime() - 0.01, true);
    }
  }

  // pause10msAudio() {
  //   this.audioPlayer?.pause();
  //   setTimeout(() => {
  //     this.audioPlayer?.play();
  //   }, 10);
  // }

  // pause10msVideo() {
  //   this.video?.videoPlayer.pauseVideo();
  //   setTimeout(() => {
  //     this.video?.videoPlayer.playVideo();
  //   }, 10);
  // }

  play10msAudio() {
    this.audioPlayer?.play();
    setTimeout(() => {
      this.audioPlayer?.pause();
    }, 10);
  }

  play10msVideo() {
    this.video?.videoPlayer.playVideo();
    setTimeout(() => {
      this.video?.videoPlayer.pauseVideo();
    }, 10);
  }


}
