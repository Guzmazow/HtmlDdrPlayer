/* Step One Of Parsing */

import { Note } from "./display";

export class PartialParse {
    metaData!: Map<string, string>;
    modes!: Map<string, string>[];
}

export class FullParse {
    metaData!: Map<string, string>;
    offset!: number;
    bpms!: [number, number][];
    stops!: [number, number][];
    tracks!: Note[][];
}

export function getPartialParse(fileContents: string) {
    let partialParse: PartialParse = new PartialParse();
    partialParse.metaData = getTopMetaDataAsStrings(fileContents);
    partialParse.modes = getModesInfoAsStrings(fileContents);
    return partialParse;
}

function getTopMetaDataAsStrings(file: string) {
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
        metaData.set(cleanMetaDataString(match[1]).toUpperCase(), cleanMetaDataString(match[2]));
    }
    return metaData;
}

function getModesInfoAsStrings(fileContents: string) {
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
            mode.set(fieldNames[j - 1], cleanMetaDataString(match[j]));
        }
        mode.set("notes", match[match.length - 1]);
        modes.push(mode);
    }
    return modes;
}

function cleanMetaDataString(string: string): string {
    return string.trim().replace(/\n/g, "");
}

/* Step Two Of Parsing */

export function getNoteTimesForMode(modeIndex: number, partialParse: PartialParse): Note[][] {
    let unparsedNotes: string = partialParse.modes[modeIndex].get("notes") || '';
    let unparsedArray: string[] = unparsedNotes.split("\n");
    let measures: string[][] = getMeasures(unparsedArray);
    let beatsAndLines: { beat: number, lineInfo: string }[] = getBeatInfoByLine(measures);
    let cleanedBeatsAndLines: { beat: number, lineInfo: string }[] = removeBlankLines(beatsAndLines);
    let offset: number = parseFloat(partialParse.metaData.get("OFFSET") || 'ADD DEFAULT');
    let bpms: { beat: number; bpm: number }[] = parseBPMS(partialParse.metaData.get("BPMS") || 'ADD DEFAULT');
    let stops: { stopDuration: number; beat: number }[] = parseStops(partialParse.metaData.get("STOPS") || 'ADD DEFAULT');
    let timesBeatsAndLines: { time: number; beat: number; lineInfo: string }[] = getTimeInfoByLine(cleanedBeatsAndLines, offset, bpms, stops);
    return getTracksFromLines(timesBeatsAndLines);
}

function getMeasures(unparsedArray: string[]) {
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
function getBeatInfoByLine(measures: string[][]) {
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

function removeBlankLines(beatsAndLines: { beat: number, lineInfo: string }[]) {
    let cleanedBeatsAndLines = [];
    for (let i = 0; i < beatsAndLines.length; i++) {
        let line = beatsAndLines[i];
        if (!isAllZeros(line.lineInfo)) {
            cleanedBeatsAndLines.push(line);
        }
    }
    return cleanedBeatsAndLines;
}

function isAllZeros(string: string) {
    for (let i = 0; i < string.length; i++) {
        if (string.charAt(i) !== '0') {
            return false;
        }
    }
    return true;
}

function getTimeInfoByLine(infoByLine: { beat: number, lineInfo: string }[], offset: number,
    bpms: { beat: number, bpm: number }[], stops: { beat: number, stopDuration: number }[]
): { time: number, beat: number, lineInfo: string }[] {
    let infoByLineWithTime: { time: number, beat: number, lineInfo: string }[] = [];
    let currentTime = -offset + getElapsedTime(0, infoByLine[0].beat, bpms, stops);
    infoByLineWithTime.push({ time: currentTime, beat: infoByLine[0].beat, lineInfo: infoByLine[0].lineInfo });
    for (let i = 1; i < infoByLine.length; i++) {
        let startBeat = infoByLine[i - 1].beat;
        let endBeat = infoByLine[i].beat;
        currentTime += getElapsedTime(startBeat, endBeat, bpms, stops);
        infoByLineWithTime.push({ time: currentTime, beat: infoByLine[i].beat, lineInfo: infoByLine[i].lineInfo });
    }
    return infoByLineWithTime;
}

function getElapsedTime(startBeat: number, endBeat: number, bpms: { beat: number, bpm: number }[],
    stops: { beat: number, stopDuration: number }[]) {
    let currentBPMIndex: number = getStartBPMIndex(startBeat, bpms);
    let earliestBeat: number = startBeat;
    let elapsedTime: number = stops == null ? 0 : stoppedTime(startBeat, endBeat, stops);
    do {
        let nextBPMChange: number = getNextBPMChange(currentBPMIndex, bpms);
        let nextBeat: number = Math.min(endBeat, nextBPMChange);
        elapsedTime += (nextBeat - earliestBeat) / bpms[currentBPMIndex].bpm * 60;
        earliestBeat = nextBeat;
        currentBPMIndex++;
    } while (earliestBeat < endBeat);
    return elapsedTime;
}

function getStartBPMIndex(startBeat: number, bpms: { beat: number, bpm: number }[]) {
    let startBPMIndex = 0;
    for (let i = 1; i < bpms.length; i++) {
        if (bpms[i].beat < startBeat) {
            startBPMIndex = i;
        }
    }
    return startBPMIndex;
}

// does NOT snap to nearest 1/192nd of beat
function stoppedTime(startBeat: number, endBeat: number, stops: { beat: number, stopDuration: number }[]) {
    let time = 0;
    for (let i = 0; i < stops.length; i++) {
        let stopBeat = stops[i].beat;
        if (startBeat <= stopBeat && stopBeat < endBeat) {
            time += stops[i].stopDuration;
        }
    }
    return time;
}

function getNextBPMChange(currentBPMIndex: number, bpms: { beat: number, bpm: number }[]) {
    if (currentBPMIndex + 1 < bpms.length) {
        return bpms[currentBPMIndex + 1].beat;
    }
    return Number.POSITIVE_INFINITY;
}

function getTracksFromLines(timesBeatsAndLines: { time: number; beat: number; lineInfo: string; }[]) {
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
                tracks[j].push({ type: noteType, time: line.time });
            }
        }
    }
    return tracks;
}

function parseBPMS(bpmString: string) {
    if (bpmString == null) {
        return [];
    }
    let bpmArray: [number, number][] = parseFloatEqualsFloatPattern(bpmString);
    let bpms: { beat: number; bpm: number }[] = [];
    for (let i = 0; i < bpmArray.length; i++) {
        bpms.push({ beat: bpmArray[i][0], bpm: bpmArray[i][1] });
    }
    return bpms;
}

function parseStops(stopsString: string) {
    if (stopsString == null) {
        return [];
    }
    let stopsArray: [number, number][] = parseFloatEqualsFloatPattern(stopsString);
    let stops: { stopDuration: number; beat: number }[] = [];
    for (let i = 0; i < stopsArray.length; i++) {
        stops.push({ beat: stopsArray[i][0], stopDuration: stopsArray[i][1] });
    }
    return stops;
}

function parseFloatEqualsFloatPattern(string: string) {
    let stringArray: string[][] = string.split(",").map(e => e.trim().split("="));
    let array: [number, number][] = [];
    for (let i = 0; i < stringArray.length; i++) {
        array.push([parseFloat(stringArray[i][0]), parseFloat(stringArray[i][1])]);
    }
    return array;
}