import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Judgement, Direction, AllJudgements, Difficulty, SuccessfullStepJudgements } from '@models/enums';
import { DisplayService } from '@services/display.service';
import { JudgementService } from '@services/judgement.service';
import { MediaService } from '@services/media.service';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-judgement',
  templateUrl: './judgement.component.html',
  styleUrls: ['./judgement.component.scss']
})
export class JudgementComponent implements OnInit, OnDestroy {

  startTime: Date = new Date();

  get timeElapsed() {
    var dif = this.startTime.getTime() - new Date().getTime();
    var Seconds_from_T1_to_T2 = dif / 1000;
    return Math.abs(Seconds_from_T1_to_T2);
  }

  destroyed$ = new Subject<void>();

  Judgement = Judgement;

  lastJudgementImageDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  lastPrecision = 0;
  lastPrecisionNegative = false;

  judgementCounts = new Map<Judgement, number>();
  precisionSums = new Map<Judgement, number>();

  missLimitTime: number; //used in view
  mediaLoaded: boolean = false;


  constructor(
    private mediaService: MediaService,
    private judgementService: JudgementService,
    public displayService: DisplayService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.missLimitTime = judgementService.errorLimit;
  }

  ngOnInit(): void {
    this.displayService.onCurrentTimeSecondsChange.pipe(takeUntil(this.destroyed$)).subscribe(time => {
      this.changeDetectorRef.detectChanges();
    });

    this.displayService.onGamePlayStateChange.pipe(takeUntil(this.destroyed$)).subscribe(started => {
      if (started) {
        this.startTime = new Date();
      }
    });

    this.displayService.onGamePlayStateChange.pipe(takeUntil(this.destroyed$)).subscribe((state) => {
      if (!state && this.displayService.requestedGame) {
        let folder = this.displayService.requestedGame.simfileFolder;
        let file = this.displayService.requestedGame.parsedSimfile;
        let mode = this.displayService.requestedGame.parsedSimfileMode;
        let scores: { [folderName: string]: { [filename: string]: { [mode: string]: number[] } } } = JSON.parse(localStorage.getItem('ScorePercentage') || '{}');
        if (!scores[folder.location]) {
          scores[folder.location] = {};
        }
        let folderScores = scores[folder.location];
        if (!folderScores[file.filename]) {
          folderScores[file.filename] = {};
        }
        let fileScores = folderScores[file.filename];
        if (!fileScores[Difficulty[mode.difficulty]]) {
          fileScores[Difficulty[mode.difficulty]] = [];
        }
        let currentHistory = fileScores[Difficulty[mode.difficulty]];
        let total = (this.judgementCounts.get(Judgement.ALL) ?? 0);
        let actual = total
          - (this.judgementCounts.get(Judgement.GREAT) ?? 0) * 0.2 //20% loss
          - (this.judgementCounts.get(Judgement.GOOD) ?? 0) * 0.4 //40% loss
          - (this.judgementCounts.get(Judgement.BAD) ?? 0) * 0.8 //80% loss
          - (this.judgementCounts.get(Judgement.MISS) ?? 0) //100% loss
          - (this.judgementCounts.get(Judgement.HOLDFAILED) ?? 0) //100% loss
          - (this.judgementCounts.get(Judgement.ROLLFAILED) ?? 0) //100% loss
          - (this.judgementCounts.get(Judgement.MINEHIT) ?? 0); //100% loss

        currentHistory.unshift(Math.round(actual / total * 100))

        localStorage.setItem('ScorePercentage', JSON.stringify(scores));
      }
    });

    this.mediaService.onMediaLoaded.pipe(takeUntil(this.destroyed$)).subscribe(x => this.mediaLoaded = x);
    this.judgementService.onJudged.pipe(takeUntil(this.destroyed$)).subscribe(judgementContext => {

      let currentCount = this.judgementCounts.get(judgementContext.judgement) ?? 0;
      this.judgementCounts.set(judgementContext.judgement, currentCount + 1)
      let currentPrecision = this.precisionSums.get(judgementContext.judgement) ?? 0;
      this.precisionSums.set(judgementContext.judgement, currentPrecision + Math.abs(judgementContext.precision ?? 0))

      let currentNoneCount = this.judgementCounts.get(Judgement.ALL) ?? 0;
      this.judgementCounts.set(Judgement.ALL, currentNoneCount + 1)
      let currentNonePrecision = this.precisionSums.get(Judgement.ALL) ?? 0;
      this.precisionSums.set(Judgement.ALL, currentNonePrecision + Math.abs(judgementContext.precision ?? 0))

      if (this.mediaLoaded) {
        //judgement
        let visibleJudgement = judgementContext.judgement;
        if (AllJudgements.indexOf(judgementContext.judgement) == -1) {
          visibleJudgement = SuccessfullStepJudgements.indexOf(judgementContext.judgement) > -1 ? Judgement.MARVELOUS : Judgement.MISS;
        }
        this.lastJudgementImageDataUrl = this.mediaService.judgementImageCache.get(visibleJudgement) ?? "";
      }

      //judgement precision
      this.lastPrecision = Math.abs(judgementContext.precision ?? 0);
      this.lastPrecisionNegative = (judgementContext.precision ?? 0) < 0


    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }


}
