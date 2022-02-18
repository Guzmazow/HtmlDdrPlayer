import { GoodNoteQuantizations, BadNoteQuantizations, Difficulty, GameMode, GameModeType as GameModeType, NoteQuantization, NoteQuantizationTitle, NoteType, NoteTypeMap, SimfileNoteType, AllNoteQuantizations } from "./enums"
import { Note } from "./note";
import { ParsedSimfile } from "./parsed-simfile";

export class ParsedSimfileMode {
    simfile: ParsedSimfile;

    gameMode: GameMode;
    gameModeType: GameModeType;
    descAuthor: string;
    difficulty: Difficulty;
    meter: number;
    radar: string;
    rawNotes: string;

    tracks: Note[][] = [];

    totalTime: number = 0;
    totalTimeDisplay: string;
    nps: number = 0;
    rollCount: number = 0;
    holdCount: number = 0;
    noteCount: number = 0;
    mineCount: number = 0;

    stats: string;
    quantizationCountReadable: string;
    scores?: number[];
    displayScores?: string;
    bestScore?: string;

    constructor(simfile: ParsedSimfile, rawMode: Map<string, string>) {
        this.simfile = simfile;

        const type = rawMode.get("type") ?? "";
        this.gameMode = GameMode[type.split('-')[0].toUpperCase() as keyof typeof GameMode] ?? GameMode.NONE;
        this.gameModeType = GameModeType[type.split('-')[1].toUpperCase() as keyof typeof GameModeType] ?? GameModeType.NONE;
        this.descAuthor = rawMode.get("desc/author") ?? "";
        this.difficulty = Difficulty[(rawMode.get("difficulty") ?? "").toUpperCase() as keyof typeof Difficulty] ?? Difficulty.NONE;
        this.meter = parseInt(rawMode.get("meter") ?? "0");
        this.radar = rawMode.get("radar") ?? "";
        this.rawNotes = rawMode.get("notes") ?? "";

        //PARSING
        const measures = this.getMeasures(this.rawNotes.split("\n"));
        const beatsAndLines = this.getBeatInfoByLine(measures);
        //let cleanedBeatsAndLines = this.removeBlankLines(beatsAndLines);
        this.tracks = this.getTracksFromLines(this.getTimeInfoByLine(beatsAndLines));

        //STATS
        const allNotes = this.tracks.reduce((prev, curr) => prev.concat(curr), []).sort((a, b) => (a.related?.time ?? a.time) - (b.related?.time ?? b.time));
        const lastNote = allNotes[allNotes.length - 1];
        this.totalTime = lastNote.related?.time ?? lastNote.time;
        this.totalTimeDisplay = `${Math.floor(this.totalTime / 60)} minutes ${Math.round(this.totalTime % 60)} seconds`
        this.nps = (allNotes.filter(x =>
            x.type == NoteType.NORMAL ||
            x.type == NoteType.HOLD_HEAD ||
            x.type == NoteType.ROLL_HEAD
        ).length / this.totalTime);
        for (let note of allNotes) {
            switch (note.type) {
                case NoteType.ROLL_HEAD: this.rollCount++; break;
                case NoteType.HOLD_HEAD: this.holdCount++; break;
                case NoteType.NORMAL: this.noteCount++; break;
                case NoteType.MINE: this.mineCount++; break;
            }
        }
        const quantizations: string[] = [];
        for (const quantization of AllNoteQuantizations) {
            const count = allNotes.filter(x => x.quantization == quantization).length;
            if (count)
                quantizations.push(`${NoteQuantizationTitle[quantization]}:${count}`);
        }
        this.quantizationCountReadable = quantizations.join("; ");
        this.stats = `N:${this.noteCount} R:${this.rollCount} H:${this.holdCount}\nT:${this.totalTime.toFixed(2)} NPS: ${this.nps.toFixed(2)}`;
    }

    resetJudgement() {
        this.tracks.forEach(track => {
            track.forEach(note => {
                note.reset();
            })
        })
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


    getBeatInfoByLine(measures: string[][]) {
        let beatsAndLines = [];
        let currentBeat = 0;
        for (let i = 0; i < measures.length; i++) {
            let measure = measures[i];
            let beatsPerMeasure = measure.length;
            let threeNoteRepeatCycle = beatsPerMeasure % 3 == 0;
            //beatCycle is either 4*(4*X) or 3*(4*X)
            let beatCycle = 4//threeNoteRepeatCycle ? 3 : 4;
            let beatStepFraction = beatCycle / beatsPerMeasure; // 1, 0.5, 0.25, 0.125, 0.0625 | 0.33333, 0.16666, 0.083333
            let beatStep = beatsPerMeasure / beatCycle; // 1, 2, 4, 8, 16, 32 | 3, 4, 6
            let stepIsEven = beatStep % 2 == 0;
            let centerBeat = beatStep / 2
            //let beatCycleStep = beatStep / beatCycle; // 4, 8, 16, 32, 64, 128 | 12, 24, 48
            //let quantizationCount = Math.round(Math.log2(beatsPerMeasure)) - 1;// 1, 2, 3, 4, 5, 6 | 3, 4, 5 (round compensates the threeNoteRepeatCycle)
            let quantizationArray = threeNoteRepeatCycle ? BadNoteQuantizations : GoodNoteQuantizations;
            let quantizationIndex = quantizationArray.indexOf(beatsPerMeasure);
            if (quantizationIndex == -1) {
                console.warn(`quantization not found for beats per measure: ${beatsPerMeasure}, for song: ${this.simfile.filename}, for mode: ${this.meter}`);
            }
            for (let j = 0; j < measure.length; j++) {
                let beatInStep = j % beatStep;
                let noteQuantization = null;
                if (beatInStep == 0) {
                    noteQuantization = NoteQuantization.Q4;
                } else if (beatInStep == centerBeat) {
                    noteQuantization = NoteQuantization.Q8;
                } else if (!stepIsEven) {
                    noteQuantization = quantizationArray[quantizationIndex]
                } else {            
                    let beatStepRelativeToCenter = (beatInStep > centerBeat) ? (beatStep - beatInStep) : beatInStep;
                    noteQuantization = quantizationArray[Math.abs(quantizationIndex - (beatStepRelativeToCenter-1)) % (quantizationIndex + 1)]
                }

                if (!noteQuantization) {
                    console.warn(`missing quantization for beatStep: ${beatStepFraction}, for song: ${this.simfile.filename}, for mode: ${this.meter}`)
                }
                beatsAndLines.push({ quantization: noteQuantization ?? NoteQuantization.Q512, totalBeat: currentBeat, lineInfo: measure[j] });
                currentBeat += beatStepFraction;
            }
        }
        return beatsAndLines;
    }

    // removeBlankLines(beatsAndLines: { quantization: NoteQuantization, totalBeat: number, lineInfo: string }[]) {
    //     let cleanedBeatsAndLines = [];
    //     for (let i = 0; i < beatsAndLines.length; i++) {
    //         let line = beatsAndLines[i];
    //         if (!this.isAllEmpty(line.lineInfo)) {
    //             cleanedBeatsAndLines.push(line);
    //         }
    //     }
    //     return cleanedBeatsAndLines;
    // }

    // isAllEmpty(string: string) {
    //     for (let i = 0; i < string.length; i++) {
    //         if (<SimfileNoteType>string.charAt(i) != SimfileNoteType.EMPTY) {
    //             return false;
    //         }
    //     }
    //     return true;
    // }

    getTimeInfoByLine(
        infoByLine: { quantization: NoteQuantization, totalBeat: number, lineInfo: string }[]
    ) {
        let infoByLineWithTime: { time: number, quantization: NoteQuantization, totalBeat: number, lineInfo: string }[] = [];
        let currentTime = -this.simfile.offset + this.simfile.getElapsedTime(0, infoByLine[0].totalBeat);
        infoByLineWithTime.push({ time: currentTime, quantization: infoByLine[0].quantization, totalBeat: infoByLine[0].totalBeat, lineInfo: infoByLine[0].lineInfo });
        for (let i = 1; i < infoByLine.length; i++) {
            let startBeat = infoByLine[i - 1].totalBeat;
            let endBeat = infoByLine[i].totalBeat;
            currentTime += this.simfile.getElapsedTime(startBeat, endBeat);
            infoByLineWithTime.push({ time: currentTime, quantization: infoByLine[i].quantization, totalBeat: infoByLine[i].totalBeat, lineInfo: infoByLine[i].lineInfo });
        }
        return infoByLineWithTime;
    }

    getTracksFromLines(timesBeatsAndLines: { time: number, quantization: NoteQuantization, totalBeat: number, lineInfo: string; }[]) {
        let numTracks: number = timesBeatsAndLines[0].lineInfo.length;
        let tracks: Note[][] = [];
        for (let i = 0; i < numTracks; i++) {
            tracks.push([]);
        }
        for (let line of timesBeatsAndLines) {
            for (let i = 0; i < line.lineInfo.length; i++) {
                let simfileNoteType = <SimfileNoteType>line.lineInfo.charAt(i);
                if (simfileNoteType != SimfileNoteType.EMPTY) {
                    let newNote = new Note(i, NoteType.NONE, line.time, line.quantization, line.totalBeat, undefined, i);
                    if (simfileNoteType == SimfileNoteType.TAIL) {
                        // let bodyNotes: Note[] = [];
                        // for (let reversedIndex = tracks[i].length - 1; reversedIndex >= 0; reversedIndex--) {
                        //     let prevNote = tracks[i][reversedIndex];
                        //     switch (prevNote.type) {
                        //         case NoteType.EMPTY:
                        //             bodyNotes.push(prevNote);
                        //             break;
                        //         case NoteType.HOLD_HEAD:
                        //         case NoteType.ROLL_HEAD:
                        //             parent = prevNote;
                        //             break;
                        //     }
                        //     if (parent) break;
                        // }
                        //bodyNotes.forEach(x => { x.parent = parent; x.type = parent?.type == NoteType.HOLD_HEAD ? NoteType.HOLD_BODY : NoteType.ROLL_BODY });
                        newNote.related = tracks[i][tracks[i].length - 1];
                        newNote.related.related = newNote;
                        newNote.type = newNote.related.type == NoteType.HOLD_HEAD ? NoteType.HOLD_TAIL : NoteType.ROLL_TAIL
                    } else {
                        newNote.type = NoteTypeMap[simfileNoteType];
                    }
                    tracks[i].push(newNote);
                }
            }
        }
        return tracks;
    }
}
