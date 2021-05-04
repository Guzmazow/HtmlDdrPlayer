import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DisplayService } from './display.service';
import { ParsingService } from './parsing.service';

@Component({
  selector: 'app-ddr-player',
  templateUrl: './ddr-player.component.html',
  styleUrls: ['./ddr-player.component.css']
})
export class DdrPlayerComponent implements OnInit {
  screenWidth: number = screen.width;
  screenHeight: number = screen.height;
  startedPlaying: boolean = false;

  constructor(
    private http: HttpClient, 
    private displayService: DisplayService,
    private parsingService: ParsingService
  ) { }

  ngOnInit(): void {
    this.parsingService.loadSim('/assets/Songs/Sneakman/Sneakman.sm');
  }

  // showParseInTextbox(parse: Note[][]) {
  //   document.getElementById("result-box-section").innerHTML =
  //     '<br><!--suppress HtmlUnknownAttribute --><input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value=' +
  //     JSON.stringify(parse) + '>';
  // }

  play(){
    this.displayService.prepareDisplayContext();
    this.displayService.load();
    this.startedPlaying = true;
  }

}
