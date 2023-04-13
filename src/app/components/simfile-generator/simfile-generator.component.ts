import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Pulse } from '@models/pulse';
import { ProcessCallback, checkPeaks, tempoDetect } from '@other/audio';
import { Log } from '@services/log.service';
import { WaveformViewComponent } from 'src/app/modules/peaks/waveform-view/waveform-view.component';
import { AudioClassifier, AudioClassifierResult, FilesetResolver } from '@mediapipe/tasks-audio';
import * as tf from '@tensorflow/tfjs'
import { YamNetTypes } from '@other/yamnet';
import { DatabaseService } from '@services/database.service';
import { PeaksInstance } from 'peaks.js';
import { ClassResults } from '@models/class-results';
@Component({
  selector: 'app-simfile-generator',
  templateUrl: './simfile-generator.component.html',
  styleUrls: ['./simfile-generator.component.scss']
})
export class SimfileGeneratorComponent implements AfterViewInit {
  @ViewChild("audio") audioElement!: ElementRef<HTMLAudioElement>;
  @ViewChild('peak') peakComponent?: WaveformViewComponent;

  public afterViewInit: boolean = false;
  public checked: boolean = false
  public youtubeId: string = "fJ9rUzIMcZQ";

  constructor(private changeDetectorRef: ChangeDetectorRef, private databaseService: DatabaseService) { }

  async loadYT() {
    const audioCtx = new AudioContext();
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

    var [peaks, pulse, tempo, classResults] =  await Promise.all([
      this.loadPeakJs(this.cloneBuffer(byteBuffer)).then(x => { Log.info('async', 'peaks'); return x; }), 
      this.loadPulse(this.cloneBuffer(byteBuffer)).then(x => { Log.info('async', 'pulse'); return x; }), 
      this.loadTempo(this.cloneBuffer(byteBuffer)).then(x => { Log.info('async', 'tempo'); return x; }), 
      this.loadClass(this.cloneBuffer(byteBuffer)).then(x => { Log.info('async', 'class'); return x; })
    ]);
    this.processResult(peaks, pulse, tempo, classResults);
  }

  cloneBuffer(buffer: ArrayBuffer) {
    var result = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(result).set(new Uint8Array(buffer));
    return result;
  }

  loadPeakJs(byteBuffer: ArrayBuffer): Promise<PeaksInstance> {
    let blob = new Blob([byteBuffer], { type: 'audio/mp3' });
    let url = URL.createObjectURL(blob);
    this.audioElement.nativeElement.src = url;
    return new Promise((resolve, reject) => {
      this.peakComponent?.load({
        audioElem: this.audioElement.nativeElement,
        url: url,
        loaded: () => {
          if (this.peakComponent?.peaks)
            resolve(this.peakComponent.peaks);
          else
            reject();
        }
      });
    });
  }

  loadPulse(byteBuffer: ArrayBuffer): Promise<Pulse> {
    return new Promise((resolve, reject) => {
      const pulse = new Pulse({
        onComplete: () => {
          Log.info("SimfileGenerator", 'Pulse done');
          resolve(pulse);
        },
        audioData: byteBuffer
      });
    });
  }

  loadTempo(byteBuffer: ArrayBuffer): Promise<ProcessCallback> {
    return new Promise((resolve, reject) => {
      tempoDetect(byteBuffer, (result) => {
        //   this.dataCache = result.data;
        //   this.audioTempo = result.audioTempo;
        //   this.audioTempoCount = result.audioTempoCount;
        //   this.audioTempoInterval = result.audioTempoInterval;
        //   this.audioPeakCount = result.audioPeaks.length,
        //   this.audioPeaks = result.audioPeaks;
        //   this.audioSampleRate = result.audioSampleRate;
        resolve(result);
      });
    });
  }  

  loadClass(byteBuffer: ArrayBuffer): Promise<ClassResults> {
    // var classResults: AudioClassifierResult[] = [];
    return new Promise((resolve) => {
      // let audioClassifier: AudioClassifier;
      // async function createAudioClassifier() {
      //   const audio = await FilesetResolver.forAudioTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@latest/wasm");
      //   audioClassifier = await AudioClassifier.createFromOptions(audio, {
      //     baseOptions: {
      //       modelAssetPath: "https://tfhub.dev/google/lite-model/yamnet/classification/tflite/1?lite-format=tflite"
      //     }
      //   });
      // }
      // createAudioClassifier().then(() => {

      //   if (!audioClassifier) {
      //     alert("Audio Classifier still loading. Please try again");
      //     return;
      //   }
      //   audioClassifier.setOptions({
      //     scoreThreshold: 0.01
      //   })
      //   const audioCtx = new AudioContext();
      //   audioCtx.decodeAudioData(buffer).then((audioBuffer) => {
      //     var data = audioBuffer.getChannelData(0);
      //     const chunkSize = audioBuffer.sampleRate / 10;
      //     for (let i = 0; i < data.length; i += chunkSize) {
      //       const chunk = data.slice(i, i + chunkSize);
      //       const results = audioClassifier.classify(
      //         chunk,
      //         audioBuffer.sampleRate
      //       );
      //       results[0].timestampMs = (i) * 1000 / audioBuffer.sampleRate
      //       classResults.push(results[0]);
      //     }
      //     resolve();
      //   });
      // });


      const audioCtx = new AudioContext();
      audioCtx.decodeAudioData(byteBuffer).then((audioBuffer) => {
        var data = audioBuffer.getChannelData(0);
        const chunkSize = this.amount;//audioBuffer.sampleRate;

        // const modelUrl = 'https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1';
        tf.loadGraphModel("/assets/ML/yamnet/model.json", {}/*, { fromTFHub: true }*/).then((model) => {
          var classResults: ClassResults = [];
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);

            //const waveform = zeros([16000 * 3]);
            const waveform = tf.tensor(chunk, [chunk.length]);
            const [scores, embeddings, spectrogram] = model.predict(waveform) as tf.Tensor<tf.Rank>[];
            // scores.print(true);  // shape [N, 521]
            // embeddings.print(true);  // shape [N, 1024]
            // spectrogram.print(true);  // shape [M, 64]
            // // Find class with the top score when mean-aggregated across frames.    
            // scores.mean(0).argMax().print(true);
            var values: number[] = scores.mean(0).arraySync() as number[];


            // const mask = tf.greaterEqual(scoresMean, 0.1);
            // const filtered = tf.booleanMaskAsync(scoresMean, mask);
            // filtered.print(); // prints [0.5, 0.8, 0.9, 0.7, 0.6]
            // var values: scores
            // Should print 494 corresponding to 'Silence' in YAMNet Class Map.    
            // results[0].timestampMs = (i) * 1000 / audioBuffer.sampleRate
            classResults.push({
              classifications: [{
                categories: values.map((x, i) => ({
                  categoryName: `${YamNetTypes[i] ?? "Unknown"}(${x.toFixed(2)})`,
                  score: x
                })).sort((a, b) => b.score - a.score).filter(x => x.score > 0.01)
              }],
              timestampMs: (i) * 1000 / audioBuffer.sampleRate
            });
          }
          resolve(classResults);
        });
      });

    });
  }

  processResult(peaks: PeaksInstance, pulse: Pulse, tempo: ProcessCallback, classResults: ClassResults){
    if (pulse) {
      for (const point of pulse.significantPeaks) {
        peaks.points?.add({
          time: point / 1000,
          color: 'yellow'
        });
      }

      for (const point of pulse.extrapolatedPeaks) {
        peaks.points?.add({
          time: point / 1000,
          color: 'purple'
        });
      }
    }

    for (const point of tempo.audioPeaks) {
      peaks.points?.add({
        time: point / tempo.audioSampleRate,
        color: 'green'
      });
    }

    let bit = false;
    for (let index = 0; index < classResults.length; index++) {
      const result = classResults[index];
      const resultNext = classResults[index + 1]

      var label = "";
      for (let index = 0; index < result.classifications[0].categories.length; index++) {
        const element = result.classifications[0].categories[index];
        // if (element.score == 0)
        //   break;
        label += "; " + element.categoryName;
      }

      result.classifications[0].categories.filter(x => x.score)
      peaks.segments?.add({
        startTime: (result.timestampMs ?? 0) / 1000,
        endTime: (resultNext?.timestampMs ?? ((result.timestampMs ?? 0) + 1000)) / 1000,
        labelText: label.substring(1),
        color: bit ? 'green' : "yellow"
      });
      bit = !bit;
    }

    this.changeDetectorRef.detectChanges();
  }

  ngAfterViewInit(): void {
    this.afterViewInit = true;
    this.changeDetectorRef.detectChanges();
  }

  amount: number = 44100;

  checkPeaks(e: Event) {
    this.loadYT();
  }

  checkFeatures(e: Event) {
    this.amount = +(<HTMLInputElement>e.target).value;
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

