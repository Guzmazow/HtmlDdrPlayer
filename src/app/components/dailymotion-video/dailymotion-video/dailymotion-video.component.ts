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
  syncStep: number = 0;

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
      if (!this.videoInfo.id || !this.player) return;

      var preDmSeconds = displaySeconds;
      if ((this.videoInfo.offset ?? 0) > 0) {
        preDmSeconds -= Math.abs(this.videoInfo.offset ?? 0);
      }
      // Log.debug('DailymotionVideoComponent', 'TimeTracking', preDmSeconds, this.currentTime, this.currentTime - preDmSeconds);
      if (!this.playing && (preDmSeconds - 1) > this.currentTime) {
        this.player.play();
        this.player?.on(window.dailymotion.events.VIDEO_PLAYING, (state: DailymotionPlayerState) => {
          setTimeout(() => {
            this.playing = true;
            Log.debug('DailymotionVideoComponent', "Started to play");
          }, 50);
        });
      }
      if (this.playing && !this.syncing) {
        console.log(this.currentTime - preDmSeconds);
        if ((this.currentTime - preDmSeconds) > (0.1 + this.syncStep)) {
          Log.debug('DailymotionVideoComponent', "Slowing down", this.currentTime - preDmSeconds);
          this.syncing = true
          this.player.pause();
          setTimeout(() => {
            this.player?.on(window.dailymotion.events.VIDEO_PLAYING, (state: DailymotionPlayerState) => {
              setTimeout(() => {
                this.currentTime = state.videoTime;
                Log.debug('DailymotionVideoComponent', "Slowing down", this.currentTime - preDmSeconds, 'Completed', state.videoTime);
              }, 50);
            }, { once: true });
            this.player?.play();
            this.syncing = false;
          }, 50);
        }

        if ((this.currentTime - preDmSeconds) < (-0.1 - this.syncStep)) {
          Log.debug('DailymotionVideoComponent', "Speeding up (WIP)", this.currentTime - preDmSeconds, 'Seeking  to', this.currentTime + 5);
          this.syncing = true;
          this.player.on(window.dailymotion.events.VIDEO_SEEKEND, (state: DailymotionPlayerState) => {
            setTimeout(() => {
              this.currentTime = state.videoTime;
              Log.debug('DailymotionVideoComponent', "Speeding up (WIP)", this.currentTime - preDmSeconds, 'Completed', state.videoTime, 'Syncstep', this.syncStep);
              if ((this.currentTime - preDmSeconds) > (-0.1 - this.syncStep))
                this.syncStep += 0.1;
              this.syncing = false;
            }, 50);
          }, { once: true });
          this.player.seek(preDmSeconds + this.syncStep);

        }

      }

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
        if ((this.videoInfo.offset ?? 0) < 0) {
          player.on(window.dailymotion.events.VIDEO_SEEKEND, (state: DailymotionPlayerState) => {
            this.currentTime = state.videoTime;
            Log.debug('DailymotionVideoComponent', 'Video stoped after initial seek');
            player.pause();
            this.playing = false;
          }, { once: true });
          player.seek(-(this.videoInfo.offset ?? 0));

        }
        this.player.setSubtitles('en')
      })
      .catch((e) => console.error(e));
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
