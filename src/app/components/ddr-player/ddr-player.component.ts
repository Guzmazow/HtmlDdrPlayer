import { Component, OnInit } from '@angular/core';
import { DisplayService } from '@services/display.service';
import { ParsingService } from '@services/parsing.service';
import { MediaService } from '@services/media.service';

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
    private displayService: DisplayService,
    private parsingService: ParsingService,
    private mediaService: MediaService,
  ) { }

  ngOnInit(): void {
    this.parsingService.loadedSim.subscribe(()=>{
      this.mediaService.prepareMedia();
    })
    this.parsingService.loadSim('/assets/Songs/Sneakman/Sneakman.sm');
  }

  // showParseInTextbox(parse: Note[][]) {
  //   document.getElementById("result-box-section").innerHTML =
  //     '<br><!--suppress HtmlUnknownAttribute --><input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value=' +
  //     JSON.stringify(parse) + '>';
  // }

  play(){
    this.mediaService.media.audio.play();
    this.displayService.prepareDisplayContext();
    this.displayService.load();
    this.startedPlaying = true;
  }

}
