import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AllDirections, Direction, Judgement, Key } from '@models/enums';
import { DisplayService } from '@services/display.service';
import { JudgementService } from '@services/judgement.service';
import { KeyboardService } from '@services/keyboard.service';
import { MediaService } from '@services/media.service';

@Component({
  selector: 'app-receptor',
  templateUrl: './receptor.component.html',
  styleUrls: ['./receptor.component.scss']
})
export class ReceptorComponent implements OnInit {

  @ViewChild("receptorCanvas", { static: true }) canvasEl?: ElementRef;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;

  get media() {
    return this.mediaService;
  }

  receptorGlowVisibilityFramesLeft = new Map<Key, { judgemnet: Judgement, framesLeft: number }>([
    [Key.LEFT, { judgemnet: Judgement.NONE, framesLeft: 0 }],
    [Key.DOWN, { judgemnet: Judgement.NONE, framesLeft: 0 }],
    [Key.UP, { judgemnet: Judgement.NONE, framesLeft: 0 }],
    [Key.RIGHT, { judgemnet: Judgement.NONE, framesLeft: 0 }],
    [Key.SECONDLEFT, { judgemnet: Judgement.NONE, framesLeft: 0 }],
    [Key.SECONDDOWN, { judgemnet: Judgement.NONE, framesLeft: 0 }],
    [Key.SECONDUP, { judgemnet: Judgement.NONE, framesLeft: 0 }],
    [Key.SECONDRIGHT, { judgemnet: Judgement.NONE, framesLeft: 0 }]
  ]);

  receptorFlashVisibilityState = new Map<Key, boolean>();

  constructor(
    private keyboardService: KeyboardService,
    private mediaService: MediaService,
    private displayService: DisplayService,
    private judgementService: JudgementService,
  ) { }


  ngOnInit(): void {
    this.canvas = <HTMLCanvasElement>this.canvasEl?.nativeElement;    
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.canvas.height = screen.height;
    this.canvas.width = this.displayService.displayOptions.noteLaneWidth;

    // this.displayService.onSetup.subscribe(()=>{
    //   this.canvas.height = screen.height;
    //   this.canvas.width = this.displayService.displayOptions.noteLaneWidth;
    // });

    this.displayService.onStart.subscribe(() => {

      this.displayService.onRedraw.subscribe(this.drawReceptors.bind(this));

      this.keyboardService.onPress.subscribe(press => {
        this.receptorFlashVisibilityState.set(press.key, press.state);
      });

      this.judgementService.onJudged.subscribe(judged => {
        this.receptorGlowVisibilityFramesLeft.set(judged.key, { judgemnet: judged.judgement, framesLeft: 20 })
      });
    });

  }

  drawReceptors() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.fillStyle = "rgba(20,20,20,0.8)";
    this.ctx.fillRect(this.displayService.getTrackX(0), 0, this.displayService.displayOptions.noteLaneWidth, this.canvas.height)
    this.ctx.restore();
    for (let direction of AllDirections) {
      let x = this.displayService.getNoteX(direction);
      this.ctx.drawImage(this.media.receptorImageCache.get(direction)!, x, this.displayService.displayOptions.noteTopPadding, this.displayService.displayOptions.noteSize, this.displayService.displayOptions.noteSize);

      if (this.receptorFlashVisibilityState.get(+direction)) {
        this.ctx.drawImage(this.media.receptorFlashImageCache.get(direction)!, this.displayService.getNoteX(direction), this.displayService.displayOptions.noteTopPadding, this.displayService.displayOptions.noteSize, this.displayService.displayOptions.noteSize);
      }

      let glowFramesLeft = this.receptorGlowVisibilityFramesLeft.get(+direction);
      if (glowFramesLeft && glowFramesLeft.framesLeft > 0 && glowFramesLeft.judgemnet != Judgement.NONE) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.8 * glowFramesLeft.framesLeft / 20;
        this.ctx.drawImage(this.media.receptorGlowImageCache.get(direction)?.get(glowFramesLeft.judgemnet)!, this.displayService.getNoteX(direction), this.displayService.displayOptions.noteTopPadding, this.displayService.displayOptions.noteSize, this.displayService.displayOptions.noteSize);
        this.ctx.restore();
        glowFramesLeft.framesLeft--;
      }
    }
  }


}
