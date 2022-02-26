import { Component, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { SimfileRegistryYoutubeInfo } from '@models/simfile-registry-video-info';
import { DisplayService } from '@services/display.service';
import { Log } from '@services/log.service';
import { MediaService } from '@services/media.service';
import { NgxY2PlayerComponent, NgxY2PlayerOptions } from 'ngx-y2-player';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-youtube-video',
  templateUrl: './youtube-video.component.html',
  styleUrls: ['./youtube-video.component.scss']
})
export class YoutubeVideoComponent implements OnDestroy {

  destroyed$ = new Subject<void>();
  emptyVideoInfo: SimfileRegistryYoutubeInfo = {
    id: '',
    skips: [],
    offset: 0
  };
  private videosReady = 0;
  private lastSyncTimestamp = 0;
  private syncing = false;

  currentVideoIndex: number = 0;
  private currentVideo?: NgxY2PlayerComponent;

  private lastSyncOffset = 0.1;
  private static readonly defaultSyncOffset = 0.1;


  youtubeVideoInfo: SimfileRegistryYoutubeInfo = this.emptyVideoInfo;
  @Input() playerOptions: NgxY2PlayerOptions = {
    height: screen.height, // you can set 'auto', it will use container width to set size
    width: screen.width,
    playerVars: {
      autoplay: 1,
      disablekb: YT.KeyboardControls.Disable,
      iv_load_policy: YT.IvLoadPolicy.Hide,
      controls: YT.Controls.Hide,
      showinfo: YT.ShowInfo.Hide
    },
    // aspectRatio: (3 / 4), // you can set ratio of aspect ratio to auto resize with
  };
  @ViewChildren(NgxY2PlayerComponent) videos!: QueryList<NgxY2PlayerComponent>;
  constructor(
    private mediaService: MediaService,
    private displayService: DisplayService
  ) {
    this.mediaService.onYTVideoLoaded.pipe(takeUntil(this.destroyed$)).subscribe((info) => {
      this.youtubeVideoInfo = info || this.emptyVideoInfo;
      this.videosReady = 0;
      this.youtubeVideoInfo.skips.forEach(x => { x.skipped = false });
    });

    this.displayService.onCurrentTimeSecondsChange.pipe(takeUntil(this.destroyed$)).subscribe(displaySeconds => {
      if (!this.youtubeVideoInfo?.id) return;
      if (this.videosReady != this.youtubeVideoInfo.skips.length || this.syncing) return;
      //Math.round((this.currentPlayerTimeSeconds - this.skipedPlayTimeSecondsUntilNow /*+ (this.gameRequest.parsedSimfile.offset ?? 0) simfile parsing applies this*/ + (this.gameRequest.youtubeVideo.offset ?? 0)) * 1000) / 1000;
      var preYtSeconds = displaySeconds;
      preYtSeconds -= this.youtubeVideoInfo.offset ?? 0;
      preYtSeconds += this.youtubeVideoInfo.skips.reduce((prev, elem) => { return prev + (!elem.skipped ? 0 : Math.abs((elem.to ?? 0) - elem.from)) }, 0);
      if (preYtSeconds >= 0) {
        if (!this.currentVideo) {
          this.currentVideo = this.videos.first;
        }
        let state = this.currentVideo.videoPlayer.getPlayerState();
        if (state === YT.PlayerState.ENDED) return;
        if (Date.now() > this.lastSyncTimestamp + 500 && (state === YT.PlayerState.PAUSED || state === YT.PlayerState.UNSTARTED)){
          Log.debug('YoutubeVideoComponent', `Resuming pause state`, state);
          this.playCurrentVideoWithSyncDebounce();
        }

        var YtSeconds = Math.round(this.currentVideo.videoPlayer.getCurrentTime() * 1000) / 1000;


        // Skip/Start logic
        for (let i = 0; i < this.youtubeVideoInfo.skips.length; i++) {
          let skip = this.youtubeVideoInfo.skips[i];
          if (skip.skipped) continue;
          if (YtSeconds >= skip.from) {
            if(skip.from == 0){
              skip.skipped = true;
              Log.debug('YoutubeVideoComponent', `skipping start skip: ${skip.from} to ${skip.to}`);
              return; //first skip is the loaded one
            }
            this.currentVideo.videoPlayer.stopVideo();
            this.lastSyncOffset = YoutubeVideoComponent.defaultSyncOffset;
            this.currentVideoIndex = i;
            let nextVideo = this.videos.find((element, index) => index === this.currentVideoIndex);
            if (!nextVideo)
              throw "video not found"
            else
              this.currentVideo = nextVideo;
              
            this.playCurrentVideoWithSyncDebounce();
            skip.skipped = true;
            Log.debug('YoutubeVideoComponent', `skipping: ${skip.from} to ${skip.to}`);
            return; //help for syncing
          }
          break; //allow loop skips
        }

        //Sync
        var timeDiff = preYtSeconds - YtSeconds;
        if (YtSeconds > YoutubeVideoComponent.defaultSyncOffset &&
          Math.abs(timeDiff) > YoutubeVideoComponent.defaultSyncOffset /* Sync to decisecond TODO:config */ &&
          !this.syncing && preYtSeconds > YoutubeVideoComponent.defaultSyncOffset /* default video load offset TODO:config */) {
          Log.warn("YoutubeVideoComponent", `Out of sync... syncing; Diff: ${timeDiff}; SimsS: ${displaySeconds}; PreYtS: ${preYtSeconds}; YtS: ${YtSeconds}`);
          this.syncing = true;
          this.lastSyncTimestamp = Date.now();
          //this.video.videoPlayer.stopVideo();
          if (timeDiff > 0) {
            this.currentVideo.videoPlayer.seekTo(preYtSeconds + this.lastSyncOffset, true);
            this.lastSyncOffset += YoutubeVideoComponent.defaultSyncOffset; /* Sync search speed TODO:config */
            let int = setInterval(() => {
              if (!this.currentVideo || this.currentVideo.videoPlayer.getPlayerState() != YT.PlayerState.PLAYING) return;
              clearInterval(int);
              this.syncing = false;
            }, 50);
            this.syncing = false;
          }else{
            this.currentVideo.videoPlayer.pauseVideo();
            setTimeout(() => {
              if (this.currentVideo)
                this.currentVideo.videoPlayer.playVideo();
            }, Math.max(15, Math.abs(timeDiff) * 1000 - 100));
            let int = setInterval(() => {
              if (!this.currentVideo || this.currentVideo.videoPlayer.getPlayerState() != YT.PlayerState.PLAYING) return;
              clearInterval(int);
              this.syncing = false;
            }, 15);
          }
        }
      }

    });
  }

  private playCurrentVideoWithSyncDebounce(){
    this.syncing = true;
    Log.debug('YoutubeVideoComponent', `playing current video at ${this.currentVideo?.videoPlayer.getCurrentTime()}s`)
    this.currentVideo?.videoPlayer.playVideo();
    setTimeout(() => {
      this.syncing = false;
    }, YoutubeVideoComponent.defaultSyncOffset * 1000 + 50);
  }

  onVideoReady(event: YT.PlayerEvent, index: number) {
    let to = this.youtubeVideoInfo.skips[index].to;
    event.target.seekTo(to + YoutubeVideoComponent.defaultSyncOffset * 2, true);
    event.target.playVideo();
    let interval = setInterval(() => {
      Log.debug('YoutubeVideoComponent', 'wait for video to load', to, event.target.getCurrentTime())
      if (event.target.getCurrentTime() > 0) {
        this.videosReady++;
        event.target.pauseVideo();
        clearInterval(interval);
      }
    }, 50);

  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
