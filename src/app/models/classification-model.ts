import { YamNetTypes, YamNetVoice } from "@other/yamnet";
import { ClassResults } from "./class-results";
import * as tf from '@tensorflow/tfjs'

export function loadClass(byteBuffer: ArrayBuffer): Promise<ClassResults> {
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
        const chunkSize = audioBuffer.sampleRate;//audioBuffer.sampleRate;

        // const modelUrl = 'https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1';
        tf.loadGraphModel("/assets/ML/yamnet/model.json", {}/*, { fromTFHub: true }*/).then((model) => {
          var classResults: ClassResults = {
            index: 4,
            title: "Classification result",
            data: []
          };
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
            classResults.data.push({
              classifications: [{
                categories: values.map((x, i) => ({
                  categoryName: `${YamNetTypes[i] ?? "Unknown"}(${x.toFixed(3)})`,
                  score: x,
                  id: i
                })).sort((a, b) => b.score - a.score)
                .filter(x => x.score > 0.001)
                .filter(x => (x.id in YamNetVoice))
              }],
              timestampMs: (i) * 1000 / audioBuffer.sampleRate
            });
          }

          var bit = false;
          classResults.segments = [];
          for (let index = 0; index < classResults.data.length; index++) {
            const result = classResults.data[index];
            const resultNext = classResults.data[index + 1]

            var label = "";
            for (let index = 0; index < result.classifications[0].categories.length; index++) {
              const element = result.classifications[0].categories[index];
              // if (element.score == 0)
              //   break;
              label += "; " + element.categoryName;
            }

            result.classifications[0].categories.filter(x => x.score)
            classResults.segments.push({
              startTime: (result.timestampMs ?? 0) / 1000,
              endTime: (resultNext?.timestampMs ?? ((result.timestampMs ?? 0) + 1000)) / 1000,
              labelText: label.substring(1),
              color: bit ? 'green' : "yellow",
              update: () => { }
            });
            bit = !bit;
          }

          console.log("Classification complete")
          resolve(classResults);
        });
      });

    });
  }