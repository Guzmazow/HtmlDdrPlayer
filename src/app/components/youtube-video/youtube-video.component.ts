import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SimfileRegistryYoutubeInfo } from '@models/simfile-registry-youtube-info';
import { DisplayService } from '@services/display.service';
import { Log } from '@services/log.service';
import { MediaService } from '@services/media.service';
import { NgxY2PlayerComponent, NgxY2PlayerOptions } from 'ngx-y2-player';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-youtube-video',
  templateUrl: './youtube-video.component.html',
  styleUrls: ['./youtube-video.component.css']
})
export class YoutubeVideoComponent implements OnDestroy {

  destroyed$ = new Subject<void>();
  emptyVideoInfo: SimfileRegistryYoutubeInfo = {
    id: '',
    skips: [],
    offset: 0
  };
  private videoReady = false;
  private videoStarted = false;
  private syncing = false;
  private lastSyncOffset = 0.1;
  private skippedUntilNow = 0;
  private static readonly defaultSyncOffset = 0.1;
  youtubeVideoInfo: SimfileRegistryYoutubeInfo = this.emptyVideoInfo;
  @Input() playerOptions: NgxY2PlayerOptions = {
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
  @ViewChild('video') video?: NgxY2PlayerComponent;
  constructor(
    private mediaService: MediaService,
    private displayService: DisplayService
  ) {
    this.mediaService.onYTVideoLoaded.pipe(takeUntil(this.destroyed$)).subscribe((info) => {
      this.youtubeVideoInfo = info || this.emptyVideoInfo;
      this.youtubeVideoInfo.skips.forEach(x => { x.skipped = false });
    });
    this.displayService.onCurrentTimeSecondsChange.pipe(takeUntil(this.destroyed$)).subscribe(displaySeconds => {
      if (!this.video || !this.videoReady) return;
      //Math.round((this.currentPlayerTimeSeconds - this.skipedPlayTimeSecondsUntilNow /*+ (this.gameRequest.parsedSimfile.offset ?? 0) simfile parsing applies this*/ + (this.gameRequest.youtubeVideo.offset ?? 0)) * 1000) / 1000;
      var preYtSeconds = displaySeconds;
      preYtSeconds -= this.youtubeVideoInfo.offset ?? 0;
      preYtSeconds += this.skippedUntilNow;

      if (!this.videoStarted && preYtSeconds >= YoutubeVideoComponent.defaultSyncOffset /* default video load offset TODO:config */) {
        this.videoStarted = true;
        this.video.videoPlayer.playVideo();
      } else {
        var YtSeconds = Math.round(this.video.videoPlayer.getCurrentTime() * 1000) / 1000;

        // Skip logic
        for (let skip of this.youtubeVideoInfo.skips) {
          if (skip.skipped) continue;
          if (YtSeconds >= skip.from) {
            if (skip.to === null) {
              this.video.videoPlayer.stopVideo();
              skip.skipped = true;
              Log.debug(`ending video because of skip`);
              return;
            }
            this.syncing = true;
            this.video.videoPlayer.seekTo(skip.to + YoutubeVideoComponent.defaultSyncOffset, true);
            setTimeout(() => {
              this.syncing = false;
            }, 200);
            this.skippedUntilNow += (skip.to - skip.from);
            skip.skipped = true;
            Log.debug(`skipping: ${skip.from} to ${skip.to}`);
          }
        }

        //Sync
        var timeDiff = preYtSeconds - YtSeconds;
        if (Math.abs(timeDiff) > YoutubeVideoComponent.defaultSyncOffset /* Sync to decisecond TODO:config */ && !this.syncing && preYtSeconds > YoutubeVideoComponent.defaultSyncOffset /* default video load offset TODO:config */) {
          Log.debug("YoutubeVideoComponent", "Out of sync... syncing");
          this.syncing = true;
          //this.video.videoPlayer.stopVideo();
          this.video.videoPlayer.seekTo(preYtSeconds + this.lastSyncOffset, true);
          setTimeout(() => {
            if (!this.video) return;
            this.syncing = false;
            this.lastSyncOffset += YoutubeVideoComponent.defaultSyncOffset /* Sync search speed TODO:config */ * (timeDiff > 0 || this.video.videoPlayer.getPlayerState() != YT.PlayerState.PLAYING ? 1 : -1);
          }, 150 /* Time between sync attempts TODO:config */);
        }
      }

    });
  }

  onVideoReady(event: YT.PlayerEvent) {
    if (!this.video) return;
    this.videoReady = true;
    this.video.videoPlayer.playVideo();
    this.video.videoPlayer.pauseVideo();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
