import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Judgement, Direction } from '@models/enums';
import { DisplayService } from '@services/display.service';
import { JudgementService } from '@services/judgement.service';
import { MediaService } from '@services/media.service';
import { SimfileLoaderService } from '@services/simfile-loader.service';
import { LocalStorage } from '@other/storage';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-judgement',
  templateUrl: './judgement.component.html',
  styleUrls: ['./judgement.component.scss']
})
export class JudgementComponent implements OnInit, OnDestroy {

  Judgement = Judgement;

  lastJudgementImageDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  lastPrecision = 0;
  lastPrecisionNegative = false;

  judgementCounts = new Map<Judgement, number>();
  precisionSums = new Map<Judgement, number>();

  missLimitTime: number; //used in view
  mediaLoaded: boolean = false;

  onGamePlayStateChangeSub?: Subscription;
  onMediaLoadedSub?: Subscription;
  onJudgedSub?: Subscription;

  constructor(private mediaService: MediaService, private judgementService: JudgementService, public displayService: DisplayService) {
    this.missLimitTime = judgementService.errorLimit;
  }


  ngOnInit(): void {
    this.onGamePlayStateChangeSub = this.displayService.onGamePlayStateChange.subscribe(playing => {
      if (!playing && this.displayService.gameRequest) {
        let scores: { [folderName: string]: { [filename: string]: number } } = JSON.parse(localStorage.getItem('ScorePercentage') || '{}');
        if(!scores[this.displayService.gameRequest.simfileFolder.location]){
          scores[this.displayService.gameRequest.simfileFolder.location] = {};
        }
        let total = Array.from(this.judgementCounts.values()).reduce((total, num) => total + num, 0);
        let actual = total - (this.judgementCounts.get(Judgement.BAD) ?? 0) - (this.judgementCounts.get(Judgement.MISS) ?? 0)

        scores[this.displayService.gameRequest.simfileFolder.location][this.displayService.gameRequest.parsedSimfile.filename] = Math.round(actual / total * 100);
        localStorage.setItem('ScorePercentage', JSON.stringify(scores));
      }
    });

    this.onMediaLoadedSub = this.mediaService.onMediaLoaded.subscribe(x => this.mediaLoaded = x);
    this.onJudgedSub = this.judgementService.onJudged.subscribe(judgementContext => {

      let currentCount = this.judgementCounts.get(judgementContext.judgement) ?? 0;
      this.judgementCounts.set(judgementContext.judgement, currentCount + 1)
      let currentPrecision = this.precisionSums.get(judgementContext.judgement) ?? 0;
      this.precisionSums.set(judgementContext.judgement, currentPrecision + Math.abs(judgementContext.precision))

      let currentNoneCount = this.judgementCounts.get(Judgement.ALL) ?? 0;
      this.judgementCounts.set(Judgement.ALL, currentNoneCount + 1)
      let currentNonePrecision = this.precisionSums.get(Judgement.ALL) ?? 0;
      this.precisionSums.set(Judgement.ALL, currentNonePrecision + Math.abs(judgementContext.precision))

      if (this.mediaLoaded) {
        //judgement
        this.lastJudgementImageDataUrl = this.mediaService.judgementImageCache.get(judgementContext.judgement) ?? "";
      }

      //judgement precision
      this.lastPrecision = Math.abs(judgementContext.precision);
      this.lastPrecisionNegative = judgementContext.precision < 0


    });
  }

  ngOnDestroy(): void {
    this.onGamePlayStateChangeSub?.unsubscribe();
    this.onMediaLoadedSub?.unsubscribe();
    this.onJudgedSub?.unsubscribe();
  }


}
