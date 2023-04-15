import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Pulse, loadPulse } from '@models/pulse';
import { ProcessCallback, checkPeaks, loadTempo, tempoDetect } from '@other/audio';
import { Log } from '@services/log.service';
import { WaveformViewComponent } from 'src/app/modules/peaks/waveform-view/waveform-view.component';
import { AudioClassifier, AudioClassifierResult, FilesetResolver } from '@mediapipe/tasks-audio';

import { YamNetTypes } from '@other/yamnet';
import { DatabaseService } from '@services/database.service';
import { PeaksInstance, Point, Segment } from 'peaks.js';
import { ClassResults } from '@models/class-results';
import { ResultForPeak } from '@models/result-for-peak';
import { loadClass } from '@models/classification-model';
@Component({
  selector: 'app-simfile-generator',
  templateUrl: './simfile-generator.component.html',
  styleUrls: ['./simfile-generator.component.scss']
})
export class SimfileGeneratorComponent {
  @ViewChild("audio") audioElement!: ElementRef<HTMLAudioElement>;
  @ViewChildren(WaveformViewComponent) Waves?: QueryList<WaveformViewComponent>;
  // @ViewChild('peak') peakComponent?: WaveformViewComponent;

  items: ResultForPeak[] = [];
  public checked: boolean = false
  public youtubeId: string = "fJ9rUzIMcZQ";
  public peakThreshhold: number = 0.90;
  constructor(private changeDetectorRef: ChangeDetectorRef, private databaseService: DatabaseService) { }

  async loadYT() {
    var byteBuffer = (await this.databaseService.getByteArray(this.youtubeId).catch(x => { /* this is fine */ }))?.buffer ?? new Uint8Array().buffer;
    if (byteBuffer.byteLength == 0) {
      const apiResult: { status: 'stream' | 'error', url?: string, text?: string } = await fetch("https://co.wukko.me/api/json", {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: encodeURIComponent(
            "https://music.youtube.com/watch?v=" + encodeURIComponent(this.youtubeId)
          ),
          aFormat: "mp3",
          //aFormat: 'best', usually gets OPUS and takes 10x more time
          dubLang: false,
          isAudioOnly: true,
          isNoTTWatermark: true,
        }),
        method: "POST",
      }).then(x => x.json());

      if (apiResult.status == 'error' || !apiResult.url) {
        console.error(apiResult.text ?? "Could not fetch url for audio!");
        return;
      }
      byteBuffer = await fetch(apiResult.url).then(x => x.arrayBuffer());
      this.databaseService.saveByteArray(this.youtubeId, new Uint8Array(byteBuffer));
    }

    let blob = new Blob([byteBuffer], { type: 'audio/mp3' });
    let url = URL.createObjectURL(blob);
    this.audioElement.nativeElement.src = url;

    var results: ResultForPeak[] = await Promise.all([
      loadPulse(this.cloneBuffer(byteBuffer)),
      // loadTempo(this.cloneBuffer(byteBuffer), this.peakThreshhold),
      // loadClass(this.cloneBuffer(byteBuffer))
    ]);
    this.items = [];
    for (const result of results.sort(x => x.index)) {
      result.element = this.audioElement.nativeElement;
      this.items.push(result);
    }

    //this.processResult(pulse, tempo, classResults);
  }

  cloneBuffer(buffer: ArrayBuffer) {
    var result = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(result).set(new Uint8Array(buffer));
    return result;
  }

  checkPeaks(e: Event) {
    this.loadYT();
  }

  readUrl(fileList: FileList | null, callback: (dataUrl: string) => void) {
    if (!fileList) throw 'must supply value';
    var file = fileList[0];
    var reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        callback(reader.result);
      } else {
        throw 'result must be string';
      }
    };
    reader.readAsDataURL(file);
  }

  readAudio(fileList: FileList | null, callback: (buffer: ArrayBuffer) => void) {
    if (!fileList) throw 'must supply value';
    var file = fileList[0];
    var reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        callback(reader.result);
      } else {
        throw 'result must be array buffer';
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

