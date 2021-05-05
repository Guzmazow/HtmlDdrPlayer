import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Judgement, Direction } from '@models/enums';
import { JudgementService } from '@services/judgement.service';
import { MediaService } from '@services/media.service';

@Component({
  selector: 'app-judgement',
  templateUrl: './judgement.component.html',
  styleUrls: ['./judgement.component.css']
})
export class JudgementComponent implements OnInit {

  @ViewChild("judgementCanvas", { static: true }) canvasEl?: ElementRef;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;

  constructor(private mediaService: MediaService, private judgementService: JudgementService) {

  }

  initCanvas() {
    this.canvas = <HTMLCanvasElement>this.canvasEl?.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
  }

  ngOnInit(): void {
    this.initCanvas();

    this.judgementService.onJudged.subscribe(judgementContext => {
      let judgementImage = this.mediaService.media.judgementImageCache.get(judgementContext.judgement);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (judgementContext.judgement != Judgement.NONE) {
        if (judgementImage) {
          this.ctx.drawImage(judgementImage, 0, 0, judgementImage.width, judgementImage.height);
        }
      }
      let yStart = (68 /*judgementImage height*/) + 10;
      let xCenter = (512 /*judgementImage width*/) / 2;
      this.ctx.fillStyle = "darkred";
      this.ctx.fillRect(xCenter + 2, yStart + 10, (xCenter * 0.9) * judgementContext.precision / this.judgementService.errorLimit, 40)
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(xCenter, yStart, 3, 60)


    });
  }


}
