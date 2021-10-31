import { Log } from "@services/log.service";
import { Difficulty, GameMode, GameModeType, NoteType } from "./enums";
import { ParsedSimfileFolder } from "./parsed-folder";
import { ParsedSimfileMode } from "./parsed-simfile-mode";
import { SimfileRegistryEntry } from "./simfile-registry-entry";
import { SimfileRegistryYoutubeInfo } from "./simfile-registry-youtube-info";
import { b64_to_utf8 } from '@other/storage';

export class ParsedSimfile {
  folder: ParsedSimfileFolder;

  smFileLocation: string;
  filename: string;
  status?: string;
  youtubeVideos: SimfileRegistryYoutubeInfo[];

  loaded: boolean = false;
  title: string = "";
  titleTranslit: string = "";
  subtitle: string = "";
  subtitleTranslit: string = "";
  artist: string = "";
  artistTranslit: string = "";
  credit: string = ""; //Prefer one on difficulty mode because of collab
  banner: string = ""; //Unused
  background: string = ""; //Only youtube for now
  jacket: string = ""; //WTF is this
  lyricsPath: string = ""; //No idea how this works
  cdTitle: string = "";
  music: string = "";
  offset: number = 0;
  sampleStart: number = 0;
  sampleLength: number = 0;
  selectable: boolean = true;
  listSort: string = ""; //WTF is this
  bpms: string = "0-0";
  stops: string = "";
  tickCount: string = ""; //Probably relaease hold counter configuration for very short holds... otherwise no idea
  bgChanges: string = "";
  keySounds: string = ""; //Never seen this in use
  attacks: string = ""; //Never seen this in use

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
    this.bpms = this.rawMetaData.get("BPMS") ?? "";
    this.stops = this.rawMetaData.get("STOPS") ?? "";
    this.tickCount = this.rawMetaData.get("TICKCOUNT") ?? "";
    this.bgChanges = this.rawMetaData.get("BGCHANGES") ?? "";
    this.keySounds = this.rawMetaData.get("KEYSOUNDS") ?? "";
    this.attacks = this.rawMetaData.get("ATTACKS") ?? "";

    this.rawModes = this.getModesInfoAsStrings(simfileContent);
    for (let rawMode of this.rawModes) {
      let mode = new ParsedSimfileMode(this, rawMode);
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
}
