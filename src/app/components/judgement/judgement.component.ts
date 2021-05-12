import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Judgement, Direction } from '@models/enums';
import { JudgementStats } from '@models/judgement-stats';
import { JudgementService } from '@services/judgement.service';
import { MediaService } from '@services/media.service';

@Component({
  selector: 'app-judgement',
  templateUrl: './judgement.component.html',
  styleUrls: ['./judgement.component.scss']
})
export class JudgementComponent implements OnInit {

  Judgement = Judgement;

  lastJudgementImageDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  lastPrecision = 0;
  lastPrecisionNegative = false;
  judgementStats = new JudgementStats();
  missLimitTime: number;

  constructor(private mediaService: MediaService, private judgementService: JudgementService) {
    this.missLimitTime = judgementService.errorLimit;
  }

  ngOnInit(): void {

    this.judgementService.onJudged.subscribe(judgementContext => {
      let currentCount = this.judgementStats.judgementCounts.get(judgementContext.judgement) ?? 0;
      this.judgementStats.judgementCounts.set(judgementContext.judgement, currentCount + 1)
      let currentPrecision = this.judgementStats.precisionSums.get(judgementContext.judgement) ?? 0;
      this.judgementStats.precisionSums.set(judgementContext.judgement, currentPrecision + Math.abs(judgementContext.precision))

      let currentNoneCount = this.judgementStats.judgementCounts.get(Judgement.ALL) ?? 0;
      this.judgementStats.judgementCounts.set(Judgement.ALL, currentNoneCount + 1)
      let currentNonePrecision = this.judgementStats.precisionSums.get(Judgement.ALL) ?? 0;
      this.judgementStats.precisionSums.set(Judgement.ALL, currentNonePrecision + Math.abs(judgementContext.precision))

      //judgement
      this.lastJudgementImageDataUrl = this.mediaService.media.judgementImageCache.get(judgementContext.judgement) ?? "";
      //judgement precision
      this.lastPrecision = Math.abs(judgementContext.precision);
      this.lastPrecisionNegative = judgementContext.precision < 0


    });
  }


}
