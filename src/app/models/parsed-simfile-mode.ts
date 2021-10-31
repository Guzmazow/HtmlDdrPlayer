import { AllNoteQuantizations, BadNoteQuantizations, Difficulty, GameMode, GameModeType as GameModeType, NoteQuantization, NoteType, SimfileNoteType } from "./enums"
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

    bpms: { beat: number; bpm: number }[] = [];
    stops: { stopDuration: number; beat: number }[] = [];
    tracks: Note[][] = [];

    totalTime: number = 0;
    totalTimeDisplay: string;
    nps: number = 0;
    rollCount: number = 0;
    holdCount: number = 0;
    noteCount: number = 0;
    mineCount: number = 0;

    stats: string;
    scores?: number[];
    displayScores?: string;
    bestScore?: string;

    constructor(simfile: ParsedSimfile, rawMode: Map<string, string>) {
        this.simfile = simfile;

        let type = rawMode.get("type") ?? "";
        this.gameMode = GameMode[type.split('-')[0].toUpperCase() as keyof typeof GameMode] ?? GameMode.NONE;
        this.gameModeType = GameModeType[type.split('-')[1].toUpperCase() as keyof typeof GameModeType] ?? GameModeType.NONE;
        this.descAuthor = rawMode.get("desc/author") ?? "";
        this.difficulty = Difficulty[(rawMode.get("difficulty") ?? "").toUpperCase() as keyof typeof Difficulty] ?? Difficulty.NONE;
        this.meter = parseInt(rawMode.get("meter") ?? "0");
        this.radar = rawMode.get("radar") ?? "";
        this.rawNotes = rawMode.get("notes") ?? "";

        //PARSING
        let measures = this.getMeasures(this.rawNotes.split("\n"));
        let beatsAndLines = this.getBeatInfoByLine(measures);
        //let cleanedBeatsAndLines = this.removeBlankLines(beatsAndLines);
        this.bpms = this.parseBPMS(simfile.bpms);
        this.stops = this.parseStops(simfile.stops);
        this.tracks = this.getTracksFromLines(this.getTimeInfoByLine(beatsAndLines, simfile.offset, this.bpms, this.stops));

        //STATS
        let allNotes = this.tracks.reduce((prev, curr) => prev.concat(curr), []).sort((a, b) => a.time - b.time);
        this.totalTime = allNotes[allNotes.length - 1].time;
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

        this.stats = `N:${this.noteCount} R:${this.rollCount} H:${this.holdCount}\nT:${this.totalTime.toFixed(2)} NPS: ${this.nps.toFixed(2)}`
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
            let beatStep = beatsPerMeasure / beatCycle; // 1, 2, 4, 8, 16, 32 | 4, 8, 16
            //let beatCycleStep = (beatStep-1) * beatCycle; // 4, 8, 16, 32, 64, 128 | 12, 24, 48
            let quantizationCount = Math.round(Math.log2(beatsPerMeasure)) - 1;// 1, 2, 3, 4, 5, 6 | 3, 4, 5 (round compensates the threeNoteRepeatCycle)
            let quantizationIndex = threeNoteRepeatCycle ? BadNoteQuantizations.indexOf(beatsPerMeasure) : AllNoteQuantizations.indexOf(beatsPerMeasure);
            if (quantizationIndex == -1) {
                console.warn(`quantization not found for beats per measure: ${beatsPerMeasure}, for song: ${this.simfile.filename}, for mode: ${this.meter}`);
            }
            for (let j = 0; j < measure.length; j++) {
                let noteQuantizationIndex = j % beatStep % quantizationCount; // 0-quantizationCount / 0-quantizationCount
                let noteQuantization = AllNoteQuantizations[noteQuantizationIndex];
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
        infoByLine: { quantization: NoteQuantization, totalBeat: number, lineInfo: string }[],
        offset: number,
        bpms: { beat: number, bpm: number }[],
        stops: { beat: number, stopDuration: number }[]
    ) {
        let infoByLineWithTime: { time: number, quantization: NoteQuantization, totalBeat: number, lineInfo: string }[] = [];
        let currentTime = -offset + this.getElapsedTime(0, infoByLine[0].totalBeat, bpms, stops);
        infoByLineWithTime.push({ time: currentTime, quantization: infoByLine[0].quantization, totalBeat: infoByLine[0].totalBeat, lineInfo: infoByLine[0].lineInfo });
        for (let i = 1; i < infoByLine.length; i++) {
            let startBeat = infoByLine[i - 1].totalBeat;
            let endBeat = infoByLine[i].totalBeat;
            currentTime += this.getElapsedTime(startBeat, endBeat, bpms, stops);
            infoByLineWithTime.push({ time: currentTime, quantization: infoByLine[i].quantization, totalBeat: infoByLine[i].totalBeat, lineInfo: infoByLine[i].lineInfo });
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
                    let newNote = new Note(NoteType.NONE, line.time, line.quantization, line.totalBeat, undefined);
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
                        switch (simfileNoteType) {
                            //case SimfileNoteType.EMPTY: type = NoteType.EMPTY; break;
                            case SimfileNoteType.NORMAL: newNote.type = NoteType.NORMAL; break;
                            case SimfileNoteType.HOLD_HEAD: newNote.type = NoteType.HOLD_HEAD; break;
                            case SimfileNoteType.ROLL_HEAD: newNote.type = NoteType.ROLL_HEAD; break;
                            case SimfileNoteType.MINE: newNote.type = NoteType.MINE; break;
                        }
                    }
                    tracks[i].push(newNote);
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
