import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

import Peaks, {
  PeaksInstance,
  PeaksOptions,
  Point,
  SetSourceOptions,
  Segment
} from 'peaks.js';

import { createPointMarker, createSegmentMarker } from './marker-factories';
import { createSegmentLabel } from './segment-label-factory';
import MyAudioContext from '../my-audio-context';
import { Log } from '@services/log.service';

@Component({
  selector: 'waveform-view',
  templateUrl: './waveform-view.component.html',
  styleUrls: ['./waveform-view.component.scss']
})
export class WaveformViewComponent implements AfterViewInit {
  @Input() selectedAudioContext?: MyAudioContext;
  @Output() segmentsEmitter = new EventEmitter<Segment[]>();
  @Output() pointsEmitter = new EventEmitter<Point[]>();

  @ViewChild("zoomviewContainer") zoomview!: ElementRef;
  @ViewChild("overviewContainer") overview!: ElementRef;

  peaks?: PeaksInstance;
  init: boolean = false;

  ngAfterViewInit(): void {
    if (this.selectedAudioContext)
      this.initPeaks();
  }

  initPeaks() {
    if (this.init)
      return;

    if (this.selectedAudioContext) {
      this.init = true;


      // let audioEl = this.audioElement.nativeElement as HTMLMediaElement;
      // var source = this.selectedAudioContext.createMediaElementSource(audioEl);
      // source.connect(this.selectedAudioContext.destination)
      // const audioContext = new AudioContext();
      const options: PeaksOptions = {
        zoomview: {
          container: this.zoomview.nativeElement
        },
        overview: {
          container: this.overview.nativeElement
        },
        mediaElement: this.selectedAudioContext?.audioElem,
        keyboard: true,
        createSegmentMarker: createSegmentMarker,
        createSegmentLabel: createSegmentLabel,
        createPointMarker: createPointMarker,
        zoomLevels: [32, 64, 128, 256, 512, 1024, 2048, 4096],
        webAudio: {
          audioContext: new AudioContext()
        }
      };

      Peaks.init(options, (err, peaks) => {
        if (err) {
          console.error(err);
          return;
        }

        this.peaks = peaks;
        this.peaks?.zoom?.setZoom(3);
        if(this.selectedAudioContext?.loaded) this.selectedAudioContext.loaded();
        this.onPeaksReady();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.peaks) {
      this.peaks.destroy();
      this.peaks = undefined;
    }
  }

  onPeaksReady(): void {
    // Do something when the Peaks instance is ready for use
    console.log("Peaks.js is ready");
  }

  zoomIn(): void {
    if (this.peaks) {
      this.peaks.zoom.zoomIn();
    }
  }

  zoomOut(): void {
    if (this.peaks) {
      this.peaks.zoom.zoomOut();
    }
  }

  addSegment(): void {
    if (this.peaks) {
      const time = this.peaks.player.getCurrentTime();

      this.peaks.segments.add({
        startTime: time,
        endTime: time + 10,
        labelText: 'Test Segment',
        editable: true
      });
    }
  }

  addPoint(): void {
    if (this.peaks) {
      const time = this.peaks.player.getCurrentTime();

      this.peaks.points.add({
        time: time,
        labelText: 'Test Point',
        editable: true
      });
    }
  }

  logMarkers(): void {
    if (this.peaks) {
      this.segmentsEmitter.emit(this.peaks.segments.getSegments());
      this.pointsEmitter.emit(this.peaks.points.getPoints());
    }
  }

  load(context: MyAudioContext) {
    this.selectedAudioContext = context;
    if (!this.init) {
      this.initPeaks();
    } else {
      this.init = false;
      this.initPeaks();
    }
  }
}
