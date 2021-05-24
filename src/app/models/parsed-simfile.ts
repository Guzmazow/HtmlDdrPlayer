import { Difficulty, GameMode, GameModeType, NoteType } from "./enums";
import { ParsedSimfileMode } from "./parsed-simfile-mode";
import { PlayableSimfileMode } from "./playable-simfile-mode";
import { SimfileRegistryEntry } from "./simfile-registry-entry";
import { SimfileRegistryFolder } from "./simfile-registry-folder";
import { SimfileRegistryYoutubeInfo } from "./simfile-registry-youtube-info";

export class ParsedSimfile implements SimfileRegistryEntry {
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

  constructor(folderRegistryEntry: SimfileRegistryFolder, registryEntry: SimfileRegistryEntry) {
    this.filename = registryEntry.filename;
    this.status = registryEntry.status;
    this.smFileLocation = `/assets/Simfiles/${folderRegistryEntry.location}/${registryEntry.filename}`;
    this.youtubeVideos = registryEntry.youtubeVideos;
    this.youtubeVideos.forEach(y => {
      y.offset = y.offset ?? 0;
      y.skips = y.skips?.map(x => ({ from: x.from, to: x.to, skipped: false })) ?? [];
    });
  }

  loadSimfile(simfileContent: string) {
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
    for (let mode of this.rawModes) {
      let type = mode.get("type") ?? "";
      let gameMode = GameMode[type.split('-')[0].toUpperCase() as keyof typeof GameMode] ?? GameMode.NONE;
      let gameModeType = GameModeType[type.split('-')[1].toUpperCase() as keyof typeof GameModeType] ?? GameModeType.NONE;
      if (gameMode == GameMode.DANCE && gameModeType == GameModeType.SINGLE) {
        this.modes.push({
          gameMode: gameMode,
          gameModeType: gameModeType,
          descAuthor: mode.get("desc/author") ?? "",
          difficulty: Difficulty[(mode.get("difficulty") ?? "").toUpperCase() as keyof typeof Difficulty] ?? Difficulty.NONE,
          meter: parseInt(mode.get("meter") ?? "0"),
          radar: mode.get("radar") ?? "",
          notes: mode.get("notes") ?? "",
          stats: ""
        });
      }
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
    this.modes.forEach(mode => {
      let playable = new PlayableSimfileMode(this, mode);
      let allNotes = playable.tracks.reduce((prev, curr) => prev.concat(curr), []);
      let rollCount = 0;
      let holdCount = 0;
      let noteCount = 0;
      for (let note of allNotes) {
        switch (note.type) {
          case NoteType.ROLL_HEAD: rollCount++; break;
          case NoteType.HOLD_HEAD: holdCount++; break;
          case NoteType.NORMAL: noteCount++; break;
        }
      }

      mode.stats = `N:${noteCount} R:${rollCount} H:${holdCount}`
    })
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
