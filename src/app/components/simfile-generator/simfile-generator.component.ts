import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Pulse } from '@models/pulse';
import { checkPeaks, tempoDetect } from '@other/audio';
import { Log } from '@services/log.service';
import { WaveformViewComponent } from 'src/app/modules/peaks/waveform-view/waveform-view.component';
import { AudioClassifier, AudioClassifierResult, FilesetResolver } from '@mediapipe/tasks-audio';
import * as tf from '@tensorflow/tfjs'
import { YamNetTypes } from '@other/yamnet';

@Component({
  selector: 'app-simfile-generator',
  templateUrl: './simfile-generator.component.html',
  styleUrls: ['./simfile-generator.component.scss']
})
export class SimfileGeneratorComponent implements AfterViewInit {
  @ViewChild("audio") audioElement!: ElementRef<HTMLAudioElement>;
  @ViewChild('peak') peakComponent?: WaveformViewComponent;

  public audioTempo: string | number = "Unknown";
  public audioTempoCount: any[] = [];
  public audioTempoInterval: any[] = [];
  public audioPeakCount: number = 0;
  public audioPeaks: number[] = [];
  public audioSampleRate: number = 1;
  public pulse?: Pulse;
  private dataCache!: Float32Array;
  public afterViewInit: boolean = false;

  constructor(private changeDetectorRef: ChangeDetectorRef) {
    const context = this;

  }

  ngAfterViewInit(): void {
    this.afterViewInit = true;
    this.changeDetectorRef.detectChanges();
  }


  audioSelected(event: Event) {

    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length == 1) {
      Log.debug("SimfileGenerator", "FileUpload -> files");

      var tempoPromise = new Promise<void>((resolve) => {
        this.readAudio(fileList, (buffer) => {
          tempoDetect(buffer, (result) => {
            this.dataCache = result.data;
            this.audioTempo = result.audioTempo;
            this.audioTempoCount = result.audioTempoCount;
            this.audioTempoInterval = result.audioTempoInterval;
            this.audioPeakCount = result.audioPeaks.length,
              this.audioPeaks = result.audioPeaks;
            this.audioSampleRate = result.audioSampleRate;
            resolve();
          });
        });
      });

      var pulsePromise = new Promise<void>((resolve) => {
        this.readAudio(fileList, (buffer) => {
          this.pulse = new Pulse({
            onComplete: () => {
              Log.info("SimfileGenerator", 'Pulse done');


              resolve();
            },
            audioData: buffer
          });
        });

      });

      var peaksPromise = new Promise<void>((resolve) => {
        this.readUrl(fileList, (url) => {
          this.audioElement.nativeElement.src = url;
          this.peakComponent?.load({
            audioElem: this.audioElement.nativeElement,
            url: url,
            loaded: () => {
              resolve();
            }
          });
        });
      });

      // var classResults: AudioClassifierResult[] = [];
      var classResults: {
        timestampMs: number,
        classifications: {
          categories: {
            score: number,
            categoryName: string
          }[];
        }[]
      }[] = [];
      var classPromise = new Promise<void>((resolve) => {
        this.readAudio(fileList, (buffer) => {
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
          audioCtx.decodeAudioData(buffer).then((audioBuffer) => {
            var data = audioBuffer.getChannelData(0);
            const chunkSize = audioBuffer.sampleRate;

            // const modelUrl = 'https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1';
            tf.loadGraphModel("/assets/ML/yamnet/model.json", {}/*, { fromTFHub: true }*/).then((model) => {

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
                    })).sort((a, b) => b.score - a.score).filter(x=>x.score > 0.01)
                  }],
                  timestampMs: (i) * 1000 / audioBuffer.sampleRate
                });
              }
              resolve();
            });
          });

        });
      });

      Promise.all([peaksPromise, pulsePromise, tempoPromise, classPromise]).then(() => {
        if (this.pulse) {
          for (const point of this.pulse.significantPeaks) {
            this.peakComponent?.peaks?.points?.add({
              time: point / 1000,
              color: 'yellow'
            });
          }

          for (const point of this.pulse.extrapolatedPeaks) {
            this.peakComponent?.peaks?.points?.add({
              time: point / 1000,
              color: 'purple'
            });
          }
        }

        for (const point of this.audioPeaks) {
          this.peakComponent?.peaks?.points?.add({
            time: point / this.audioSampleRate,
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
          this.peakComponent?.peaks?.segments?.add({
            startTime: (result.timestampMs ?? 0) / 1000,
            endTime: (resultNext?.timestampMs ?? ((result.timestampMs ?? 0) + 1000)) / 1000,
            labelText: label.substring(1),
            color: bit ? 'green' : "yellow"
          });
          bit = !bit;
        }

        this.changeDetectorRef.detectChanges();

      });







    }



  }

  checkPeaks(e: Event) {
    this.audioPeaks = checkPeaks(+(<HTMLInputElement>e.target).value, this.dataCache);
    this.audioPeakCount = this.audioPeaks.length;
    this.peakComponent?.peaks?.points.removeAll();
    for (const point of this.audioPeaks) {
      this.peakComponent?.peaks?.points?.add({
        time: point / this.audioSampleRate,
        color: 'green'
      });
    }
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

