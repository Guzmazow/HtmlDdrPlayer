import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { SimfileRegistryDailyMotionInfo } from '@models/simfile-registry-video-info';
import { DisplayService } from '@services/display.service';
import { Log } from '@services/log.service';
import { MediaService } from '@services/media.service';
import { Subject, takeUntil } from 'rxjs';
import { DailymotionPlayer, DailymotionPlayerSettings, DailymotionPlayerState } from 'src/types/dailymotion';

@Component({
  selector: 'app-dailymotion-video',
  templateUrl: './dailymotion-video.component.html',
  styleUrls: ['./dailymotion-video.component.scss']
})
export class DailymotionVideoComponent implements OnInit, AfterViewInit, OnDestroy {

  destroyed$ = new Subject<void>();

  syncing: boolean = false;
  playing = false;
  loaded = false;
  player?: DailymotionPlayer;
  videoInfo!: SimfileRegistryDailyMotionInfo;
  currentTime: number = 0;

  emptyVideoInfo: SimfileRegistryDailyMotionInfo = {
    id: ''
  };

  constructor(
    private mediaService: MediaService,
    private displayService: DisplayService
  ) {
    this.mediaService.onDMVideoLoaded.pipe(takeUntil(this.destroyed$)).subscribe((info) => {
      Log.debug('DailymotionVideoComponent', 'Loading', info);
      this.videoInfo = info || this.emptyVideoInfo;
    });

    this.displayService.onCurrentTimeSecondsChange.pipe(takeUntil(this.destroyed$)).subscribe(displaySeconds => {
      if(!this.videoInfo.id || !this.player) return;

      var preDmSeconds = displaySeconds;
      preDmSeconds -= this.videoInfo.offset ?? 0;
      // Log.debug('DailymotionVideoComponent', 'TimeTracking', preDmSeconds, this.currentTime, this.currentTime - preDmSeconds);
      if (!this.playing && preDmSeconds + 1 > 0) {
        this.player.play();
        this.playing = true;
      }
      if (this.playing && !this.syncing) {
        if (this.currentTime - preDmSeconds > 0.04) {
          Log.debug("Slowing down", this.currentTime - preDmSeconds);
          this.syncing =true
          this.player.pause();
          setTimeout(() => {
            this.player?.play();
            this.syncing = false;
          }, 50);          
        }

        if (this.currentTime - preDmSeconds < -0.1) {
          Log.debug("Speeding up (WIP)", this.currentTime - preDmSeconds);
          //this.player.seek(preDmSeconds + 1);
        }

      }


      // if (!(this.currentVideo?.videoId || false)) return;
      // if (this.videosReady != this.youtubeVideoInfo.skips.length || this.syncing) return;
      // //Math.round((this.currentPlayerTimeSeconds - this.skipedPlayTimeSecondsUntilNow /*+ (this.gameRequest.parsedSimfile.offset ?? 0) simfile parsing applies this*/ + (this.gameRequest.youtubeVideo.offset ?? 0)) * 1000) / 1000;
      // var preYtSeconds = displaySeconds;
      // preYtSeconds -= this.youtubeVideoInfo.offset ?? 0;
      // preYtSeconds += this.youtubeVideoInfo.skips.reduce((prev, elem) => { return prev + (!elem.skipped ? 0 : Math.abs((elem.to ?? 0) - elem.from)) }, 0);
      // if (preYtSeconds >= 0) {
      //   if (!this.currentVideo) {
      //     this.currentVideo = this.videos.first;
      //   }
      //   let state = this.currentVideo.videoPlayer.getPlayerState();
      //   if (state === YT.PlayerState.ENDED) return;
      //   if (Date.now() > this.lastSyncTimestamp + 500 && (state === YT.PlayerState.PAUSED || state === YT.PlayerState.UNSTARTED)){
      //     Log.debug('YoutubeVideoComponent', `Resuming pause state`, state);
      //     this.playCurrentVideoWithSyncDebounce();
      //   }

      //   var YtSeconds = Math.round(this.currentVideo.videoPlayer.getCurrentTime() * 1000) / 1000;


      //   // Skip/Start logic
      //   for (let i = 0; i < this.youtubeVideoInfo.skips.length; i++) {
      //     let skip = this.youtubeVideoInfo.skips[i];
      //     if (skip.skipped) continue;
      //     if (YtSeconds >= skip.from) {
      //       if(skip.from == 0){
      //         skip.skipped = true;
      //         Log.debug('YoutubeVideoComponent', `skipping start skip: ${skip.from} to ${skip.to}`);
      //         return; //first skip is the loaded one
      //       }
      //       this.currentVideo.videoPlayer.stopVideo();
      //       this.lastSyncOffset = YoutubeVideoComponent.defaultSyncOffset;
      //       this.currentVideoIndex = i;
      //       let nextVideo = this.videos.find((element, index) => index === this.currentVideoIndex);
      //       if (!nextVideo)
      //         throw "video not found"
      //       else
      //         this.currentVideo = nextVideo;

      //       this.playCurrentVideoWithSyncDebounce();
      //       skip.skipped = true;
      //       Log.debug('YoutubeVideoComponent', `skipping: ${skip.from} to ${skip.to}`);
      //       return; //help for syncing
      //     }
      //     break; //allow loop skips
      //   }

      //   //Sync
      //   var timeDiff = preYtSeconds - YtSeconds;
      //   if (YtSeconds > YoutubeVideoComponent.defaultSyncOffset &&
      //     Math.abs(timeDiff) > YoutubeVideoComponent.defaultSyncOffset /* Sync to decisecond TODO:config */ &&
      //     !this.syncing && preYtSeconds > YoutubeVideoComponent.defaultSyncOffset /* default video load offset TODO:config */) {
      //     Log.warn("YoutubeVideoComponent", `Out of sync... syncing; Diff: ${timeDiff}; SimsS: ${displaySeconds}; PreYtS: ${preYtSeconds}; YtS: ${YtSeconds}`);
      //     this.syncing = true;
      //     this.lastSyncTimestamp = Date.now();
      //     //this.video.videoPlayer.stopVideo();
      //     if (timeDiff > 0) {
      //       this.currentVideo.videoPlayer.seekTo(preYtSeconds + this.lastSyncOffset, true);
      //       this.lastSyncOffset += YoutubeVideoComponent.defaultSyncOffset; /* Sync search speed TODO:config */
      //       let int = setInterval(() => {
      //         if (!this.currentVideo || this.currentVideo.videoPlayer.getPlayerState() != YT.PlayerState.PLAYING) return;
      //         clearInterval(int);
      //         this.syncing = false;
      //       }, 50);
      //       this.syncing = false;
      //     }else{
      //       this.currentVideo.videoPlayer.pauseVideo();
      //       setTimeout(() => {
      //         if (this.currentVideo)
      //           this.currentVideo.videoPlayer.playVideo();
      //       }, Math.max(15, Math.abs(timeDiff) * 1000 - 100));
      //       let int = setInterval(() => {
      //         if (!this.currentVideo || this.currentVideo.videoPlayer.getPlayerState() != YT.PlayerState.PLAYING) return;
      //         clearInterval(int);
      //         this.syncing = false;
      //       }, 15);
      //     }
      //   }
      // }

    });
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    if (!this.videoInfo.id) {
      Log.debug('DailymotionVideoComponent', 'Video not selected');
      return;
    }
    window.dailymotion
      .createPlayer("my-dailymotion-player", {
        video: this.videoInfo.id,
        startTime: 30
      })
      .then((player) => {
        this.player = player;
        player.on(window.dailymotion.events.VIDEO_TIMECHANGE, (state: DailymotionPlayerState) => {
          this.currentTime = state.videoTime;
        });
        this.player.setSubtitles('en')
      })
      .catch((e) => console.error(e));
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
