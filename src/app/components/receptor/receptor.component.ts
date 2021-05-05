import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AllDirections, Direction } from '@models/enums';
import { DisplayService } from '@services/display.service';
import { JudgementService } from '@services/judgement.service';
import { KeyboardService } from '@services/keyboard.service';
import { MediaService } from '@services/media.service';

@Component({
  selector: 'app-receptor',
  templateUrl: './receptor.component.html',
  styleUrls: ['./receptor.component.css']
})
export class ReceptorComponent implements OnInit {

  @ViewChild("receptorCanvas", { static: true }) canvasEl?: ElementRef;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;

  constructor(private keyboardService: KeyboardService, private mediaService: MediaService, private displayService: DisplayService) { }

  initCanvas() {
    this.canvas = <HTMLCanvasElement>this.canvasEl?.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.drawReceptors();
  }

  drawReceptors() {
    let dCtx = this.displayService.displayContext;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let direction of AllDirections) {
      let x = this.displayService.displayContext.getNoteX(direction);
      this.ctx.drawImage(dCtx.media.receptorImageCache.get(direction)!, x, 0, dCtx.displayOptions.noteSize, dCtx.displayOptions.noteSize);
    }
  }

  ngOnInit(): void {
    this.displayService.onStart.subscribe(() => {
      this.initCanvas();
      this.keyboardService.onPress.subscribe(keyPress => {
        let dCtx = this.displayService.displayContext;
        this.drawReceptors();
        for (let direction of AllDirections) {
          if (this.keyboardService.keyState.get(direction)) {
            this.ctx.drawImage(dCtx.media.receptorFlashImageCache.get(direction)!, dCtx.getNoteX(direction), 0, dCtx.displayOptions.noteSize, dCtx.displayOptions.noteSize);
          }
        }
      });
    });

  }

}
