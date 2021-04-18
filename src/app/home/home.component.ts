import { Component, OnInit, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PartialParse, getPartialParse, getNoteTimesForMode } from './parsing';
import { prepareDisplay, Note } from './display';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  localStartedParse?: PartialParse;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
  }

  downloadSim(): void {
    this.http
      .get('/assets/Songs/Sneakman/Sneakman.sm', { responseType: "text" })
      .subscribe(response => this.parseSim(response));
  }
  parseSim(response: string): void {
    this.localStartedParse = getPartialParse(response);
    //let modeOptions: Mode[] = getModeOptionsForDisplay(localStartedParse.modes);
    //showModeOptions(modeOptions);
    this.finishParse();
  }

  finishParse() {
    let selectedMode: number = 1;//parseInt((<HTMLInputElement>document.getElementById("mode-select")).value);
    let tracks: Note[][];
    if(this.localStartedParse == undefined)
      return;
    tracks = getNoteTimesForMode(selectedMode, this.localStartedParse);
    console.log(tracks);
    //showParseInTextbox(tracks);
    this.drawParse(tracks);
  }

  // showParseInTextbox(parse: Note[][]) {
  //   document.getElementById("result-box-section").innerHTML =
  //     '<br><!--suppress HtmlUnknownAttribute --><input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value=' +
  //     JSON.stringify(parse) + '>';
  // }

  drawParse(tracks: Note[][]) {
    prepareDisplay(tracks);
  }
}
