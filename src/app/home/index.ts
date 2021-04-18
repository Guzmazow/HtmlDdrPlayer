// import {Note, prepareDisplay} from "./display";
// import {getNoteTimesForMode, getPartialParse, PartialParse} from "./parsing";

// export class Mode {
//     public type: string;
//     public difficulty: string;
//     public meter: string;
//     public id: number;
// }

// let reader: FileReader;
// let localStartedParse: PartialParse;

// export function parseFile(
//     file: File,
//     listener: (this: FileReader, ev: ProgressEvent<FileReader>) => any,
//     options?: boolean | AddEventListenerOptions
// ) {
//     reader = new FileReader();
//     reader.readAsText(file);
//     reader.addEventListener("loadend", listener, options);
// }

// // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
// export function clearStartedParse() {
//     document.getElementById("finish-parse-section").innerHTML = "";
//     localStartedParse = undefined;
// }

// // noinspection JSUnusedLocalSymbols
// export function go() {
//     window.alert('lol');
//     let upload: HTMLInputElement = <HTMLInputElement>(
//         document.getElementById("upload")
//     );
//     let file: File = upload.files[0];
//     parseFile(file, onFileLoaded);
// }

// function onFileLoaded() {
//     let fileContents: string = <string>reader.result;
//     startParse(fileContents);
// }

// function startParse(fileContents: string) {
//     localStartedParse = getPartialParse(fileContents);
//     let modeOptions: Mode[] = getModeOptionsForDisplay(localStartedParse.modes);
//     showModeOptions(modeOptions);
// }

// export function getModeOptionsForDisplay(modesAsStrings: Map<string, string>[]) {
//     let modeOptions: Mode[] = [];
//     for (let i = 0; i < modesAsStrings.length; i++) {
//         let mode: Map<string, string> = modesAsStrings[i];
//         modeOptions.push({type: mode.get("type"), difficulty: mode.get("difficulty"), meter: mode.get("meter"), id: i});
//     }
//     modeOptions.sort(compareModeOptions);
//     return modeOptions;
// }

// export function compareModeOptions(a: Mode, b: Mode) {
//     let typeA = a.type.toUpperCase();
//     let typeB = b.type.toUpperCase();
//     if (typeA != typeB) {
//         if (typeA < typeB) {
//             return -1;
//         } else {
//             return 1;
//         }
//     } else {
//         let difficultyA = a.difficulty.toUpperCase();
//         let difficultyB = b.difficulty.toUpperCase();
//         if (difficultyA != difficultyB) {
//             return difficultyRank(difficultyA) - difficultyRank(difficultyB);
//         } else {
//             let meterA = parseFloat(a.meter);
//             let meterB = parseFloat(b.meter);
//             if (meterA != meterB) {
//                 return meterA - meterB;
//             }
//         }
//     }
//     return a.id = b.id;
// }

// function difficultyRank(difficulty: string) {
//     switch (difficulty) {
//         case "BEGINNER":
//             return 0;
//         case "EASY":
//             return 1;
//         case "MEDIUM":
//             return 2;
//         case "HARD":
//             return 3;
//         case "CHALLENGE":
//             return 4;
//         case "EDIT":
//             return 5;
//         default:
//             return 6;
//     }
// }

// function showModeOptions(modeOptions: Mode[]) {
//     // let modeSelect: HTMLElement = document.getElementById("finish-parse-section");
//     // let html: string = 'Choose a mode: <select id="mode-select">\n' +
//     //     '<option hidden disabled selected value></option>\n';
//     // for (let i = 0; i < modeOptions.length; i++) {
//     //     let mode: Mode = modeOptions[i];
//     //     html += '<option value="' + mode.id + '">' +
//     //         mode.type + ', ' + mode.difficulty + ', ' + mode.meter +
//     //         '</option>\n';
//     // }
//     // html += '</select><br>\n';
//     // html += getFinishParseButton();
//     // modeSelect.innerHTML = html;
//     finishParse()
// }

// function getFinishParseButton() {
//     return '<input type="button" value="Finish Parse" onclick="simparser.finishParse()"><br>';
// }

// // noinspection JSUnusedLocalSymbols
// export function finishParse() {
//     let selectedMode: number = 1;//parseInt((<HTMLInputElement>document.getElementById("mode-select")).value);
//     let tracks: Note[][] = getNoteTimesForMode(selectedMode, localStartedParse);
//     console.log(tracks);
//     //showParseInTextbox(tracks);
//     drawParse(tracks);
// }

// function showParseInTextbox(parse: Note[][]) {
//     document.getElementById("result-box-section").innerHTML =
//         '<br><!--suppress HtmlUnknownAttribute --><input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value=' +
//         JSON.stringify(parse) + '>';
// }

// function drawParse(tracks: Note[][]) {
//     document.getElementById("graphical-display-section").innerHTML =
//         '<br><canvas id="canvas"></canvas>';
//     prepareDisplay(tracks);
// }
