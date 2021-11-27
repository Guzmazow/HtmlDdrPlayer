import { Log } from "@services/log.service";
import { Difficulty, GameMode, GameModeType, NoteType } from "./enums";
import { ParsedSimfileFolder } from "./parsed-folder";
import { ParsedSimfileMode } from "./parsed-simfile-mode";
import { SimfileRegistryEntry } from "./simfile-registry-entry";
import { SimfileRegistryYoutubeInfo } from "./simfile-registry-youtube-info";
import { b64_to_utf8 } from '@other/storage';
import { is_overlapping } from "@other/math";

enum ElapsedTimeType {
  NOTE = 0,
  BPM = 1,
  STOPS = 2
}

export class ParsedSimfile {
  folder: ParsedSimfileFolder;

  smFileLocation: string;
  filename: string;
  status?: string;
  youtubeVideos: SimfileRegistryYoutubeInfo[];

  loaded: boolean = false;
  title: string;
  titleTranslit: string;
  subtitle: string;
  subtitleTranslit: string;
  artist: string;
  artistTranslit: string;
  credit: string; //Prefer one on difficulty mode because of collab
  banner: string; //Unused
  background: string; //Only youtube for now
  jacket: string; //WTF is this
  lyricsPath: string; //No idea how this works
  cdTitle: string;
  music: string;
  offset: number;
  sampleStart: number;
  sampleLength: number;
  selectable: boolean;
  listSort: string; //WTF is this
  bpms: { beat: number; bpm: number; }[];
  bpmsTime: { from: number; to: number; bpm: number; }[];
  bpmReadable: string;
  stops: { beat: number; stopDuration: number; }[];
  stopsTime: { time: number; stopDuration: number; }[];
  stopsReadable: string;
  tickCount: string; //Probably relaease hold counter configuration for very short holds... otherwise no idea
  bgChanges: string;
  keySounds: string; //Never seen this in use
  attacks: string; //Never seen this in use

  modes: ParsedSimfileMode[] = [];

  rawMetaData = new Map<string, string>();
  rawModes: Map<string, string>[] = [];

  constructor(folder: ParsedSimfileFolder, registryEntry: SimfileRegistryEntry) {
    this.folder = folder;
    this.filename = registryEntry.filename;
    this.status = registryEntry.status;
    this.smFileLocation = `/assets/Simfiles/${folder.location}/${registryEntry.filename}`;

    if (!registryEntry.simfileDataBase64) {
      throw `Missing ${this.smFileLocation} simfile base64 data!`;
    }

    let simfileContent = b64_to_utf8(registryEntry.simfileDataBase64);
    this.rawMetaData = this.getTopMetaDataAsStrings(simfileContent);
    this.title = this.rawMetaData.get("TITLE") ?? "";
    this.titleTranslit = this.rawMetaData.get("TITLETRANSLIT") ?? "";
    this.subtitle = this.rawMetaData.get("SUBTITLE") ?? "";
    this.subtitleTranslit = this.rawMetaData.get("SUBTITLETRANSLIT") ?? "";
    this.artist = this.rawMetaData.get("ARTIST") ?? "";
    this.artistTranslit = this.rawMetaData.get("ARTISTTRANSLIT") ?? "";
    this.credit = this.rawMetaData.get("CREDIT") ?? "";
    this.banner = this.rawMetaData.get("BANNER") ?? "";
    this.background = this.rawMetaData.get("BACKGROUND") ?? "";
    this.jacket = this.rawMetaData.get("JACKET") ?? "";
    this.lyricsPath = this.rawMetaData.get("LYRICSPATH") ?? "";
    this.cdTitle = this.rawMetaData.get("CDTITLE") ?? "";
    this.music = this.rawMetaData.get("MUSIC") ?? "";
    this.offset = parseFloat(this.rawMetaData.get("OFFSET") ?? "0");
    this.sampleStart = parseFloat(this.rawMetaData.get("SAMPLESTART") ?? "0");
    this.sampleLength = parseFloat(this.rawMetaData.get("SAMPLELENGTH") ?? "0");
    this.selectable = (this.rawMetaData.get("SELECTABLE") ?? "YES").toUpperCase() == "YES";
    this.listSort = this.rawMetaData.get("LISTSORT") ?? "";

    this.bpms = this.parseBPMS(this.rawMetaData.get("BPMS") ?? "");

    //NegBPM workaround #1
    for (let index = 0; index < this.bpms.length; index++) {
      const bpm = this.bpms[index];
      if (bpm.bpm < 0) {
        bpm.bpm = 0;
        const nextBpm = this.bpms[index + 1]
        if (nextBpm) nextBpm.beat += (nextBpm.beat - bpm.beat);
      }
    }

    this.stops = this.parseStops(this.rawMetaData.get("STOPS") ?? "");


    this.tickCount = this.rawMetaData.get("TICKCOUNT") ?? "";
    this.bgChanges = this.rawMetaData.get("BGCHANGES") ?? "";
    this.keySounds = this.rawMetaData.get("KEYSOUNDS") ?? "";
    this.attacks = this.rawMetaData.get("ATTACKS") ?? "";

    this.rawModes = this.getModesInfoAsStrings(simfileContent);
    for (const rawMode of this.rawModes) {
      const mode = new ParsedSimfileMode(this, rawMode);
      if (mode.gameMode == GameMode.DANCE && mode.gameModeType == GameModeType.SINGLE) {
        this.modes.push(mode);
      }
    }

    this.modes.sort((a, b) => {
      if (a.gameMode > b.gameMode) return 1
      else if (a.gameMode < b.gameMode) return -1

      if (a.gameModeType > b.gameModeType) return 1
      else if (a.gameModeType < b.gameModeType) return -1

      if (a.difficulty > b.difficulty) return 1;
      else if (a.difficulty < b.difficulty) return -1;
      else return 0;
    });


    this.bpmsTime = this.bpms.map(x => { return { from: this.getElapsedTime(0, x.beat, ElapsedTimeType.BPM) - this.offset, to: 0, bpm: x.bpm } })
    for (let index = 0; index < this.bpmsTime.length - 1; index++) {
      this.bpmsTime[index].to = this.bpmsTime[index + 1].from;
    }
    this.bpmsTime[this.bpmsTime.length - 1].to = this.modes.reduce((prev, curr) => prev < curr.totalTime ? curr.totalTime : prev, 0); /* find max totaltime */

    if (this.bpms.length == 1) {
      this.bpmReadable = `Static ${this.bpms[0].bpm}`
    } else {
      this.bpmReadable = `Variable(${this.bpms.length}) ${Math.min(...this.bpms.map(x => x.bpm))} - ${Math.max(...this.bpms.map(x => x.bpm))}`
    }
    if (this.bpms.find(x => x.bpm < 0)) {
      this.bpmReadable += " NegBPM!";
    }
    this.stopsTime = this.stops.map(x => { return { time: this.getElapsedTime(0, x.beat, ElapsedTimeType.STOPS) - this.offset, stopDuration: x.stopDuration } });
    if(this.stops.length){
      this.stopsReadable = `(${this.stops.length}) ${Math.min(...this.stops.map(x => x.stopDuration))} - ${Math.max(...this.stops.map(x => x.stopDuration))}`
    }else{
      this.stopsReadable = "None";
    }

    for (const mode of this.modes) 
      for(const track of mode.tracks)
        for(const note of track)
          note.time = this.applyStopsToNoteTime(note.time);
    

    this.youtubeVideos = registryEntry.youtubeVideos;
    this.youtubeVideos.forEach(y => {
      y.offset = y.offset ?? 0;
      y.skips = y.skips?.map(x => ({ from: x.from, to: x.to, skipped: false })) ?? [];
      if (y.skips.length == 0 || y.skips.length > 0 && y.skips[0].from !== 0)
        y.skips.unshift({ from: 0, to: 0, skipped: false });

      let start = Math.round(this.sampleStart + y.skips.reduce((prev, elem) => prev + (elem.from < this.sampleStart ? ((elem.to ?? 0) - elem.from) : 0), 0));
      let end = this.sampleLength ? (start + Math.round(this.sampleLength ?? 0)) : 10
      y.previewOptions = {
        height: 'auto',//screen.height, // you can set 'auto', it will use container width to set size
        width: 'auto',//screen.width,
        playerVars: {
          start: start,
          end: end,
          autoplay: YT.AutoPlay.AutoPlay,
          disablekb: YT.KeyboardControls.Disable
        },

        // aspectRatio: (3 / 4), // you can set ratio of aspect ratio to auto resize with
      }
    });
    this.loaded = true;
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
    };
    return modes;
  }

  cleanMetaDataString(string: string): string {
    return string.trim().replace(/\n/g, "");
  }

  getElapsedBeats(toTime: number) {
    let currentTime = 0;
    let currentBeat = 0;
    while (currentTime < toTime) {
      currentTime = this.getElapsedTime(0, currentBeat);
      currentBeat++;
    }
    return currentBeat;
  }

  getElapsedTime(startBeat: number, endBeat: number, type: ElapsedTimeType = ElapsedTimeType.NOTE) {
    let currentBPMIndex: number = this.getStartBPMIndex(startBeat);
    let earliestBeat: number = startBeat;
    let elapsedTime: number = (type == ElapsedTimeType.BPM) ? 0 : this.stoppedTime(startBeat, endBeat);
    do {
      let nextBPMChange: number = this.getNextBPMChange(currentBPMIndex);
      let nextBeat: number = Math.min(endBeat, nextBPMChange);

      // NegBPM workaround #2
      elapsedTime += this.bpms[currentBPMIndex].bpm == 0 ? 0 : (nextBeat - earliestBeat) / this.bpms[currentBPMIndex].bpm * 60;
      //elapsedTime += (nextBeat - earliestBeat) / this.bpms[currentBPMIndex].bpm * 60;

      earliestBeat = nextBeat;
      currentBPMIndex++;
    } while (earliestBeat < endBeat);

    return elapsedTime;
  }

  getStartBPMIndex(startBeat: number) {
    let startBPMIndex = 0;
    for (let i = 1; i < this.bpms.length; i++) {
      if (this.bpms[i].beat < startBeat) {
        startBPMIndex = i;
      }
    }
    return startBPMIndex;
  }

  // does NOT snap to nearest 1/192nd of beat
  stoppedTime(startBeat: number, endBeat: number) {
    let time = 0;
    for (let i = 0; i < this.stops.length; i++) {
      let stopBeat = this.stops[i].beat;
      if (startBeat <= stopBeat && stopBeat < endBeat) {
        time += this.stops[i].stopDuration;
      }
    }
    return time;
  }

  getNextBPMChange(currentBPMIndex: number): number {
    if (currentBPMIndex + 1 < this.bpms.length) {
      return this.bpms[currentBPMIndex + 1].beat;
    }
    return Number.POSITIVE_INFINITY;
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

  applyStopsToNoteTime(noteTime: number) {
    let noteTimeWithStops = noteTime;
    for (const stop of this.stopsTime) {
      const endOfStop = stop.time + stop.stopDuration;
      if (is_overlapping(0, noteTime, endOfStop, endOfStop)) {
        noteTimeWithStops -= stop.stopDuration;
      }
    }
    return noteTimeWithStops;
  }

  applyStopsToLaneTime(laneTime: number) {
    let fromTimeWithStops = laneTime;
    let prevStops = 0;
    for (const stop of this.stopsTime) {
      const endOfStop = stop.time + stop.stopDuration;
      if (is_overlapping(laneTime, laneTime, stop.time, endOfStop)) {
        fromTimeWithStops = stop.time - prevStops;
      } else {
        if (is_overlapping(0, laneTime, endOfStop, endOfStop)) {
          fromTimeWithStops -= stop.stopDuration;
        }
      }
      prevStops += stop.stopDuration;
    }
    return fromTimeWithStops;
  }
}
