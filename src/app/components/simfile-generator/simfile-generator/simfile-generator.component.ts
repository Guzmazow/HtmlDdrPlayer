import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Log } from '@services/log.service';

@Component({
  selector: 'app-simfile-generator',
  templateUrl: './simfile-generator.component.html',
  styleUrls: ['./simfile-generator.component.scss']
})
export class SimfileGeneratorComponent {

  public audioTempo: string = "Unknown";
  public audioTempoCount: any[] = [];
  public audioTempoInterval: any[] = [];
  public audioPeakCount: number = 0;

  private dataCache!: Float32Array;

  constructor() {}


  audioSelected(event: Event){

    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length == 1) {
      Log.debug("SimfileGenerator", "FileUpload -> files");
      this.tempoDetect(fileList);
    }


    
  }



  tempoDetect(fileList: FileList) {
    var file = fileList[0];
    var reader = new FileReader();
    var context = new(window.AudioContext || (<any>window).webkitAudioContext)();
    reader.onload = () => {
      if(reader.result instanceof ArrayBuffer){
        context.decodeAudioData(reader.result, (buffer) => {
          this.prepare(buffer);
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  prepare(buffer: AudioBuffer) {
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
      this.process(e);
    };
  }
  
  checkPeaks(e: Event){
    (<HTMLInputElement>e.target).value
    var data = this.dataCache;
    var max = this.arrayMax(data);
    var min = this.arrayMin(data);
    var threshold = min + (max - min) * +(<HTMLInputElement>e.target).value;
    var peaks = this.getPeaksAtThreshold(data, threshold);
    this.audioPeakCount = peaks.length;
  }

  process(e: OfflineAudioCompletionEvent) {
    var filteredBuffer = e.renderedBuffer;
    //If you want to analyze both channels, use the other channel later
    var data = filteredBuffer.getChannelData(0);
    this.dataCache = data;
    var max = this.arrayMax(data);
    var min = this.arrayMin(data);
    var threshold = min + (max - min) * 0.98;
    var peaks = this.getPeaksAtThreshold(data, threshold);
    this.audioPeakCount = peaks.length;
    var intervalCounts = this.countIntervalsBetweenNearbyPeaks(peaks);
    var tempoCounts = this.groupNeighborsByTempo(intervalCounts);
    tempoCounts.sort((a, b) => {
      return b.count - a.count;
    });
    if (tempoCounts.length) {
      this.audioTempo = tempoCounts[0].tempo.toString();
      this.audioTempoCount = tempoCounts;
      this.audioTempoInterval = intervalCounts;
    }
  }
  
  // http://tech.beatport.com/2014/web-audio/beat-detection-using-web-audio/
  getPeaksAtThreshold(data: Float32Array, threshold: number) {
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
  
  countIntervalsBetweenNearbyPeaks(peaks: number[]) {
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
  
  groupNeighborsByTempo(intervalCounts: {
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
  arrayMin(arr: Float32Array) {
    var len = arr.length,
      min = Infinity;
    while (len--) {
      if (arr[len] < min) {
        min = arr[len];
      }
    }
    return min;
  }
  
  arrayMax(arr: Float32Array) {
    var len = arr.length,
      max = -Infinity;
    while (len--) {
      if (arr[len] > max) {
        max = arr[len];
      }
    }
    return max;
  }
}
