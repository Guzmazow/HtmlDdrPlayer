import { ResultForPeak } from "@models/result-for-peak";

export function loadTempo(byteBuffer: ArrayBuffer, peakThreshhold: number): Promise<ProcessCallback> {
    return new Promise((resolve, reject) => {
      tempoDetect(byteBuffer, peakThreshhold, (result) => {
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

export function tempoDetect(arrayBuffer: ArrayBuffer, peakThreshhold: number, callback: (result: ProcessCallback) => void) {
    var context = new (window.AudioContext || (<any>window).webkitAudioContext)();
    context.decodeAudioData(arrayBuffer, (buffer) => {
        var offlineContext = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
        var source = offlineContext.createBufferSource();
        source.buffer = buffer;
        var filter = offlineContext.createBiquadFilter();
        filter.type = "lowpass";
        source.connect(filter);
        filter.connect(offlineContext.destination);
        source.start(0);
        offlineContext.startRendering();
        offlineContext.oncomplete = (e) => {
            callback(process(e, peakThreshhold, buffer.sampleRate));
        };
    });
};

export function checkPeaks(value: number, data: Float32Array,) {
    var max = arrayMax(data);
    var min = arrayMin(data);
    var threshold = min + (max - min) * +value;
    var peaks = getPeaksAtThreshold(data, threshold);
    return peaks;
}

export interface ProcessCallback extends ResultForPeak {
    data: Float32Array,
    audioPeaks: number[],
    audioTempo: number,
    audioTempoCount: { tempo: number, count: number }[],
    audioTempoInterval: { interval: number, count: number }[]
    audioSampleRate: number
}


function process(e: OfflineAudioCompletionEvent, peakThreshhold: number, sampleRate: number): ProcessCallback {
    var filteredBuffer = e.renderedBuffer;
    //If you want to analyze both channels, use the other channel later
    var data = filteredBuffer.getChannelData(0);
    var max = arrayMax(data);
    var min = arrayMin(data);
    var threshold = min + (max - min) * peakThreshhold;
    var peaks = getPeaksAtThreshold(data, threshold);
    var intervalCounts = countIntervalsBetweenNearbyPeaks(peaks);
    var tempoCounts = groupNeighborsByTempo(intervalCounts);
    tempoCounts.sort((a, b) => {
        return b.count - a.count;
    });

    console.log('Audio complete');
    return {
        data: data,
        audioPeaks: peaks,
        audioTempo: tempoCounts[0]?.tempo ?? 0,
        audioTempoCount: tempoCounts,
        audioTempoInterval: intervalCounts,
        audioSampleRate: sampleRate,
        title: "Tempo result",
        index: 3,
        points: peaks.map(peak => ({
            time: peak / sampleRate,
            color: 'green',
            update: ()=>{}
        }))
    }
}

// http://tech.beatport.com/2014/web-audio/beat-detection-using-web-audio/
function getPeaksAtThreshold(data: Float32Array, threshold: number) {
    var peaksArray = [];
    var length = data.length;
    for (var i = 0; i < length;) {
        if (data[i] > threshold) {
            peaksArray.push(i);
            // Skip forward ~ 1/4s to get past this peak.
            i += 10000;
        }
        i++;
    }
    return peaksArray;
}

function countIntervalsBetweenNearbyPeaks(peaks: number[]) {
    var intervalCounts: {
        interval: number,
        count: number
    }[] = [];
    peaks.forEach((peak, index) => {
        for (var i = 0; i < 10; i++) {
            var interval = peaks[index + i] - peak;
            var foundInterval = intervalCounts.some((intervalCount) => {
                if (intervalCount.interval === interval) return intervalCount.count++;
                return false;
            });
            //Additional checks to avoid infinite loops in later processing
            if (!isNaN(interval) && interval !== 0 && !foundInterval) {
                intervalCounts.push({
                    interval: interval,
                    count: 1
                });
            }
        }
    });
    return intervalCounts;
}

function groupNeighborsByTempo(intervalCounts: {
    interval: number,
    count: number
}[]) {
    var tempoCounts: {
        tempo: number;
        count: number;
    }[] = [];
    intervalCounts.forEach((intervalCount) => {
        //Convert an interval to tempo
        var theoreticalTempo = 60 / (intervalCount.interval / 44100);
        theoreticalTempo = Math.round(theoreticalTempo);
        if (theoreticalTempo === 0) {
            return;
        }
        // Adjust the tempo to fit within the 90-180 BPM range
        while (theoreticalTempo < 90) theoreticalTempo *= 2;
        while (theoreticalTempo > 180) theoreticalTempo /= 2;

        var foundTempo = tempoCounts.some((tempoCount) => {
            if (tempoCount.tempo === theoreticalTempo) return tempoCount.count += intervalCount.count;
            return false;
        });
        if (!foundTempo) {
            tempoCounts.push({
                tempo: theoreticalTempo,
                count: intervalCount.count
            });
        }
    });
    return tempoCounts;
}

// http://stackoverflow.com/questions/1669190/javascript-min-max-array-values
function arrayMin(arr: Float32Array) {
    var len = arr.length,
        min = Infinity;
    while (len--) {
        if (arr[len] < min) {
            min = arr[len];
        }
    }
    return min;
}

function arrayMax(arr: Float32Array) {
    var len = arr.length,
        max = -Infinity;
    while (len--) {
        if (arr[len] > max) {
            max = arr[len];
        }
    }
    return max;
}