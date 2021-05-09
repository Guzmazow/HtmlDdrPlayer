export class ParsedSimfile {
    smFileLocation: string;
    filename: string;

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
    bpms: string = "";
    bgChanges: string ="";
    //0: {"TITLE" => "1, 2 Fanclub"} {key: "TITLE", value: "1, 2 Fanclub"}
    //1: {"ARTIST" => "Mikito-P feat. Kagamine Rin & GUMI"} {key: "ARTIST", value: "Mikito-P feat. Kagamine Rin & GUMI"}
    //2: {"BANNER" => "1 2 Fanclub - bn.png"} {key: "BANNER", value: "1 2 Fanclub - bn.png"}
    //3: {"BACKGROUND" => "1 2 Fanclub - bg.png"} {key: "BACKGROUND", value: "1 2 Fanclub - bg.png"}
    //4: {"CDTITLE" => "gpopcdtitle.png"} {key: "CDTITLE", value: "gpopcdtitle.png"}
    //5: {"MUSIC" => "1 2 Fanclub.ogg"} {key: "MUSIC", value: "1 2 Fanclub.ogg"}
    //6: {"OFFSET" => "0.932"} {key: "OFFSET", value: "0.932"}
    //7: {"SAMPLESTART" => "71.887"} {key: "SAMPLESTART", value: "71.887"}
    //8: {"SAMPLELENGTH" => "13.240"} {key: "SAMPLELENGTH", value: "13.240"}
    //9: {"SELECTABLE" => "YES"} {key: "SELECTABLE", value: "YES"}
    //10: {"BPMS" => "0.000=145.000"} {key: "BPMS", value: "0.000=145.000"}
    //11: {"BGCHANGES" => "1.750=1 2 Fanclub.mpg=1.000=1=0=0=StretchNoLoop==CrossFade==,99999=-nosongbg-=1.000=0=0=0 // don't automatically add -songbackground-"} {key: "BGCHANGES", value: "1.750=1 2 Fanclub.mpg=1.000=1=0=0=StretchNoLoop==C…"}
    

    rawMetaData = new Map<string, string>();
    rawModes: Map<string, string>[] = [];

    constructor(filename: string){
      this.filename = filename;
      this.smFileLocation = `/assets/Simfiles/${filename}`;

    }

    loadSimfile(simfileContent: string){
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
        this.bgChanges = this.rawMetaData.get("BGCHANGES") ?? "";

        this.rawModes = this.getModesInfoAsStrings(simfileContent);
        
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
        }
        modes.reverse();
        modes.sort((a, b) => ((a.get('type') || '') < (b.get('type') || '')) ? 1 : -1);
        return modes;
      }
    
      cleanMetaDataString(string: string): string {
        return string.trim().replace(/\n/g, "");
      }
}
