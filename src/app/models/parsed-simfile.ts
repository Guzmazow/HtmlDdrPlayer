import { Difficulty, GameMode, GameModeType } from "./enums";
import { ParsedSimfileMode } from "./parsed-simfile-mode";

export class ParsedSimfile {
  smFileLocation: string;
  filename: string;
  youtubeVideoIds: string[];
  skips: { from: number, to: number | null }[];

  loaded: boolean = false;
  title: string = "";
  artist: string = "";
  banner: string = "";
  background: string = "";
  cdTitle: string = "";
  music: string = "";
  offset: number = 0;
  sampleStart: number = 0;
  sampleLength: number = 0;
  selectable: boolean = true;
  bpms: string = "0-0";
  stops: string= "";
  bgChanges: string = "";

  modes: ParsedSimfileMode[] = [];

  rawMetaData = new Map<string, string>();
  rawModes: Map<string, string>[] = [];

  constructor(filename: string, youtubeVideoIds: string[], skips: { from: number, to: number | null }[]) {
    this.filename = filename;
    this.smFileLocation = `/assets/Simfiles/Otaku's Dream Mix/${filename}`;
    this.youtubeVideoIds = youtubeVideoIds;
    this.skips = skips;

  }

  loadSimfile(simfileContent: string) {
    this.rawMetaData = this.getTopMetaDataAsStrings(simfileContent);
    this.title = this.rawMetaData.get("TITLE") ?? "";
    this.artist = this.rawMetaData.get("ARTIST") ?? "";
    this.banner = this.rawMetaData.get("BANNER") ?? "";
    this.background = this.rawMetaData.get("BACKGROUND") ?? "";
    this.cdTitle = this.rawMetaData.get("CDTITLE") ?? "";
    this.music = this.rawMetaData.get("MUSIC") ?? "";
    this.offset = parseFloat(this.rawMetaData.get("OFFSET") ?? "0");
    this.sampleStart = parseFloat(this.rawMetaData.get("SAMPLESTART") ?? "0");
    this.sampleLength = parseFloat(this.rawMetaData.get("SAMPLELENGTH") ?? "0");
    this.selectable = (this.rawMetaData.get("SELECTABLE") ?? "YES").toUpperCase() == "YES";
    this.bpms = this.rawMetaData.get("BPMS") ?? "";
    this.stops = this.rawMetaData.get("STOPS") ?? "";
    this.bgChanges = this.rawMetaData.get("BGCHANGES") ?? "";

    this.rawModes = this.getModesInfoAsStrings(simfileContent);
    for (let mode of this.rawModes) {
      let type = mode.get("type") ?? "";
      this.modes.push({
        gameMode: GameMode[type.split('-')[0].toUpperCase() as keyof typeof GameMode] ?? GameMode.NONE,
        gameModeType: GameModeType[type.split('-')[1].toUpperCase() as keyof typeof GameModeType] ?? GameModeType.NONE,
        descAuthor: mode.get("desc/author") ?? "",
        difficulty: Difficulty[(mode.get("difficulty") ?? "").toUpperCase() as keyof typeof Difficulty] ?? Difficulty.NONE,
        meter: parseInt(mode.get("meter") ?? "0"),
        radar: mode.get("radar") ?? "",
        notes: mode.get("notes") ?? ""
      });

    }
    this.modes.sort((a, b) => {
      if (a.gameMode > b.gameMode)
        return 1
      else if (a.gameMode < b.gameMode)
        return -1

      if (a.gameModeType > b.gameModeType)
        return 1
      else if (a.gameModeType < b.gameModeType)
        return -1

      if (a.difficulty > b.difficulty)
        return 1;
      else if (a.difficulty < b.difficulty)
        return -1;
      else
        return 0;
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
