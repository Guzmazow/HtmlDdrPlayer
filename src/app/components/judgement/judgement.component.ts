import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Judgement, Direction } from '@models/enums';
import { JudgementService } from '@services/judgement.service';
import { MediaService } from '@services/media.service';

@Component({
  selector: 'app-judgement',
  templateUrl: './judgement.component.html',
  styleUrls: ['./judgement.component.scss']
})
export class JudgementComponent implements OnInit {

  @ViewChild("judgementCanvas", { static: true }) canvasEl?: ElementRef;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;

  constructor(private mediaService: MediaService, private judgementService: JudgementService) {

  }

  ngOnInit(): void {
    this.canvas = <HTMLCanvasElement>this.canvasEl?.nativeElement;
    this.canvas.height = screen.height;
    this.canvas.width = screen.width;
    this.ctx = this.canvas.getContext('2d')!;

    this.judgementService.onJudged.subscribe(judgementContext => {
      //clear
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "rgba(20,20,20,0.5)";
      this.ctx.fillRect(0, 0, 512 /*judgementImage width*/, 300);
      //judgement
      let judgementImage = this.mediaService.media.judgementImageCache.get(judgementContext.judgement);
      if (judgementContext.judgement != Judgement.NONE) {
        if (judgementImage) {
          this.ctx.drawImage(judgementImage, 0, 50, judgementImage.width, judgementImage.height);
        }
      }
      //judgement precision
      let yStart = (68 /*judgementImage height*/) + 10 + 50;
      let xCenter = (512 /*judgementImage width*/) / 2;
      this.ctx.fillStyle = "darkred";
      this.ctx.fillRect(xCenter + 2, yStart + 10, (xCenter * 0.9) * judgementContext.precision / this.judgementService.errorLimit, 40)
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(xCenter, yStart, 3, 60)


    });
  }


}
