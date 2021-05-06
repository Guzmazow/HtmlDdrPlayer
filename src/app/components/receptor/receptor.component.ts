import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DisplayContext } from '@models/display-context';
import { AllDirections, Direction, Judgement } from '@models/enums';
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

  get dCtx() {
    return this.displayService.displayContext;
  }

  get media() {
    return this.mediaService.media;
  }

  receptorGlowVisibilityFramesLeft = new Map<Direction, { judgemnet: Judgement, framesLeft: number }>([
    [Direction.LEFT, { judgemnet: Judgement.NONE, framesLeft: 0 }],
    [Direction.DOWN, { judgemnet: Judgement.NONE, framesLeft: 0 }],
    [Direction.UP, { judgemnet: Judgement.NONE, framesLeft: 0 }],
    [Direction.RIGHT, { judgemnet: Judgement.NONE, framesLeft: 0 }]
  ]);

  receptorFlashVisibilityState = new Map<Direction, boolean>();

  constructor(
    private keyboardService: KeyboardService,
    private mediaService: MediaService,
    private displayService: DisplayService,
    private judgementService: JudgementService,
  ) { }

  initCanvas() {
    this.canvas = <HTMLCanvasElement>this.canvasEl?.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.drawReceptors();
  }

  drawReceptors() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let direction of AllDirections) {
      let x = this.displayService.displayContext.getNoteX(direction);
      this.ctx.drawImage(this.media.receptorImageCache.get(direction)!, x, 0, this.dCtx.displayOptions.noteSize, this.dCtx.displayOptions.noteSize);

      if (this.receptorFlashVisibilityState.get(direction)) {
        this.ctx.drawImage(this.media.receptorFlashImageCache.get(direction)!, this.dCtx.getNoteX(direction), 0, this.dCtx.displayOptions.noteSize, this.dCtx.displayOptions.noteSize);
      }

      let glowFramesLeft = this.receptorGlowVisibilityFramesLeft.get(direction);
      if (glowFramesLeft && glowFramesLeft.framesLeft > 0 && glowFramesLeft.judgemnet != Judgement.NONE) {
        this.ctx.save();     
        this.ctx.globalAlpha = 0.8 * glowFramesLeft.framesLeft / 20;
        this.ctx.drawImage(this.media.receptorGlowImageCache.get(direction)?.get(glowFramesLeft.judgemnet)!, this.dCtx.getNoteX(direction), 0, this.dCtx.displayOptions.noteSize, this.dCtx.displayOptions.noteSize);
        this.ctx.restore();
        glowFramesLeft.framesLeft--;
      }
    }
  }

  ngOnInit(): void {
    this.displayService.onStart.subscribe(() => {
      this.initCanvas();

      this.displayService.onRedraw.subscribe(this.drawReceptors.bind(this));

      this.keyboardService.onPress.subscribe(press => {
        this.receptorFlashVisibilityState.set(press.direction, press.state);
      });

      this.judgementService.onJudged.subscribe(judged => {
        this.receptorGlowVisibilityFramesLeft.set(judged.direction, { judgemnet: judged.judgement, framesLeft: 20 })
      });
    });

  }

}
