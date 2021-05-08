import { Injectable } from '@angular/core';
import { Note } from '@models/note';
import { NoteType } from '@models/enums'
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ParsingService {

  smFileLocation: string = "";

  offset: number = 0;
  bpms: { beat: number; bpm: number }[] = [];
  stops: { stopDuration: number; beat: number }[] = [];
  tracks: Note[][] = [];
  metaData: Map<string, string> = new Map<string, string>();
  modes: Map<string, string>[] = [];

  onSimLoaded = new Subject();
  onModeSelected = new Subject();

  constructor(private http: HttpClient) { }

  loadSim(url: string) {
    this.smFileLocation = url;
    this.http
      .get(url, { responseType: "text" })
      .subscribe(response => this.partialParse(response));
  }

  /* Step One Of Parsing */
  partialParse(fileContents: string) {
    this.metaData = this.getTopMetaDataAsStrings(fileContents);
    this.modes = this.getModesInfoAsStrings(fileContents);

    let selectedMode: number = 1;//parseInt((<HTMLInputElement>document.getElementById("mode-select")).value);
    this.getFullModeSpecificParse(1);
    this.onSimLoaded.next();
  }

  getTopMetaDataAsStrings(file: string) {
    // match any metadata tag excluding the "NOTES" tag (case-insensitive)
    let re = /#(?![nN][oO][tT][eE][sS])([^:]+):([^;]+);/g;
    //let matches = [...file.matchAll(re)];
    let matches: RegExpExecArray[] = [];
    var m;
    while (m = re.exec(file)) {
      matches.push(m);
    }
    let metaData: Map<string, string> = new Map();
    for (let i = 0; i < matches.length; i++) {
      let match = matches[i];
      metaData.set(this.cleanMetaDataString(match[1]).toUpperCase(), this.cleanMetaDataString(match[2]));
    }
    return metaData;
  }

  getModesInfoAsStrings(fileContents: string) {
    // Get "NOTES" sections (case-insensitive). The first five values are postfixed with a colon.
    // Note data comes last, postfixed by a semicolon.
    let re = /#[nN][oO][tT][eE][sS]:([^:]*):([^:]*):([^:]*):([^:]*):([^:]*):([^;]+;)/g;
    // let matches = [...fileContents.matchAll(re)];
    let matches: RegExpExecArray[] = [];
    var m;
    while (m = re.exec(fileContents)) {
      matches.push(m);
    }
    let modes: Map<string, string>[] = [];
    let fieldNames = ["type", "desc/author", "difficulty", "meter", "radar"];
    for (let i = 0; i < matches.length; i++) {
      let match = matches[i];
      let mode: Map<string, string> = new Map();
      for (let j = 1; j < match.length - 1; j++) {
        mode.set(fieldNames[j - 1], this.cleanMetaDataString(match[j]));
      }
      mode.set("notes", match[match.length - 1]);
      modes.push(mode);
    }
    modes.reverse();
    modes.sort((a, b) => ((a.get('type') || '') < (b.get('type') || '')) ? 1 : -1);
    return modes;
  }

  cleanMetaDataString(string: string): string {
    return string.trim().replace(/\n/g, "");
  }

  /* Step Two Of Parsing */

  getFullModeSpecificParse(modeIndex: number) {   
    let unparsedNotes: string = this.modes[modeIndex].get("notes") || '';
    let unparsedArray: string[] = unparsedNotes.split("\n");
    let measures: string[][] = this.getMeasures(unparsedArray);
    let beatsAndLines: { beat: number, lineInfo: string }[] = this.getBeatInfoByLine(measures);
    let cleanedBeatsAndLines: { beat: number, lineInfo: string }[] = this.removeBlankLines(beatsAndLines);
    this.offset = parseFloat(this.metaData.get("OFFSET") || '0');
    this.bpms = this.parseBPMS(this.metaData.get("BPMS") || '0-0');
    this.stops = this.parseStops(this.metaData.get("STOPS") || '');
    let timesBeatsAndLines: { time: number; beat: number; lineInfo: string }[] = this.getTimeInfoByLine(cleanedBeatsAndLines, this.offset, this.bpms, this.stops);
    this.tracks = this.getTracksFromLines(timesBeatsAndLines);
    this.onModeSelected.next();
  }

  getMeasures(unparsedArray: string[]) {
    let measures: string[][] = [];
    let state = 0;
    let i = 0;
    let currentMeasure: string[] = [];
    while (i < unparsedArray.length) {
      let currentLine = unparsedArray[i];
      switch (state) {
        case 0:
          if (!currentLine.includes("//") && currentLine.trim() !== "") {
            state = 1;
          } else {
            i++;
          }
          break;
        case 1:
          if (!currentLine.includes(",") && !currentLine.includes(";") && currentLine.trim() !== "") {
            currentMeasure.push(currentLine.trim());
            i++;
          } else {
            state = 2;
          }
          break;
        case 2:
          measures.push(currentMeasure);
          currentMeasure = [];
          i++;
          state = 0;
          break;
      }
    }
    return measures;
  }

  // assumes 4/4 time signature
  getBeatInfoByLine(measures: string[][]) {
    let beatsAndLines = [];
    let currentBeat = 0;
    for (let i = 0; i < measures.length; i++) {
      let measure = measures[i];
      for (let j = 0; j < measure.length; j++) {
        beatsAndLines.push({ beat: currentBeat, lineInfo: measure[j] });
        currentBeat += 4 / measure.length;
      }
    }
    return beatsAndLines;
  }

  removeBlankLines(beatsAndLines: { beat: number, lineInfo: string }[]) {
    let cleanedBeatsAndLines = [];
    for (let i = 0; i < beatsAndLines.length; i++) {
      let line = beatsAndLines[i];
      if (!this.isAllZeros(line.lineInfo)) {
        cleanedBeatsAndLines.push(line);
      }
    }
    return cleanedBeatsAndLines;
  }

  isAllZeros(string: string) {
    for (let i = 0; i < string.length; i++) {
      if (string.charAt(i) !== '0') {
        return false;
      }
    }
    return true;
  }

  getTimeInfoByLine(infoByLine: { beat: number, lineInfo: string }[], offset: number,
    bpms: { beat: number, bpm: number }[], stops: { beat: number, stopDuration: number }[]
  ): { time: number, beat: number, lineInfo: string }[] {
    let infoByLineWithTime: { time: number, beat: number, lineInfo: string }[] = [];
    let currentTime = -offset + this.getElapsedTime(0, infoByLine[0].beat, bpms, stops);
    infoByLineWithTime.push({ time: currentTime, beat: infoByLine[0].beat, lineInfo: infoByLine[0].lineInfo });
    for (let i = 1; i < infoByLine.length; i++) {
      let startBeat = infoByLine[i - 1].beat;
      let endBeat = infoByLine[i].beat;
      currentTime += this.getElapsedTime(startBeat, endBeat, bpms, stops);
      infoByLineWithTime.push({ time: currentTime, beat: infoByLine[i].beat, lineInfo: infoByLine[i].lineInfo });
    }
    return infoByLineWithTime;
  }

  getElapsedTime(startBeat: number, endBeat: number, bpms: { beat: number, bpm: number }[],
    stops: { beat: number, stopDuration: number }[]) {
    let currentBPMIndex: number = this.getStartBPMIndex(startBeat, bpms);
    let earliestBeat: number = startBeat;
    let elapsedTime: number = stops == null ? 0 : this.stoppedTime(startBeat, endBeat, stops);
    do {
      let nextBPMChange: number = this.getNextBPMChange(currentBPMIndex, bpms);
      let nextBeat: number = Math.min(endBeat, nextBPMChange);
      elapsedTime += (nextBeat - earliestBeat) / bpms[currentBPMIndex].bpm * 60;
      earliestBeat = nextBeat;
      currentBPMIndex++;
    } while (earliestBeat < endBeat);
    return elapsedTime;
  }

  getStartBPMIndex(startBeat: number, bpms: { beat: number, bpm: number }[]) {
    let startBPMIndex = 0;
    for (let i = 1; i < bpms.length; i++) {
      if (bpms[i].beat < startBeat) {
        startBPMIndex = i;
      }
    }
    return startBPMIndex;
  }

  // does NOT snap to nearest 1/192nd of beat
  stoppedTime(startBeat: number, endBeat: number, stops: { beat: number, stopDuration: number }[]) {
    let time = 0;
    for (let i = 0; i < stops.length; i++) {
      let stopBeat = stops[i].beat;
      if (startBeat <= stopBeat && stopBeat < endBeat) {
        time += stops[i].stopDuration;
      }
    }
    return time;
  }

  getNextBPMChange(currentBPMIndex: number, bpms: { beat: number, bpm: number }[]) {
    if (currentBPMIndex + 1 < bpms.length) {
      return bpms[currentBPMIndex + 1].beat;
    }
    return Number.POSITIVE_INFINITY;
  }

  getTracksFromLines(timesBeatsAndLines: { time: number; beat: number; lineInfo: string; }[]) {
    let numTracks: number = timesBeatsAndLines[0].lineInfo.length;
    let tracks: Note[][] = [];
    for (let i = 0; i < numTracks; i++) {
      tracks.push([]);
    }
    for (let i = 0; i < timesBeatsAndLines.length; i++) {
      let line: { time: number; beat: number; lineInfo: string } = timesBeatsAndLines[i];
      for (let j = 0; j < line.lineInfo.length; j++) {
        let noteType = line.lineInfo.charAt(j);
        if (noteType !== "0") {
          tracks[j].push(new Note(<NoteType>noteType, line.time));
        }
      }
    }
    return tracks;
  }

  parseBPMS(bpmString: string) {
    if (bpmString == null) {
      return [];
    }
    let bpmArray: [number, number][] = this.parseFloatEqualsFloatPattern(bpmString);
    let bpms: { beat: number; bpm: number }[] = [];
    for (let i = 0; i < bpmArray.length; i++) {
      bpms.push({ beat: bpmArray[i][0], bpm: bpmArray[i][1] });
    }
    return bpms;
  }

  parseStops(stopsString: string) {
    if (!stopsString) {
      return [];
    }
    let stopsArray: [number, number][] = this.parseFloatEqualsFloatPattern(stopsString);
    let stops: { stopDuration: number; beat: number }[] = [];
    for (let i = 0; i < stopsArray.length; i++) {
      stops.push({ beat: stopsArray[i][0], stopDuration: stopsArray[i][1] });
    }
    return stops;
  }

  parseFloatEqualsFloatPattern(string: string) {
    let stringArray: string[][] = string.split(",").map(e => e.trim().split("="));
    let array: [number, number][] = [];
    for (let i = 0; i < stringArray.length; i++) {
      array.push([parseFloat(stringArray[i][0]), parseFloat(stringArray[i][1])]);
    }
    return array;
  }
}
