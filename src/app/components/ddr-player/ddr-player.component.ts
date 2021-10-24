import { Component } from '@angular/core';

@Component({
  selector: 'app-ddr-player',
  templateUrl: './ddr-player.component.html',
  styleUrls: ['./ddr-player.component.scss']
})
export class DdrPlayerComponent {

  screenWidth: number = screen.width;
  screenHeight: number = screen.height;

  constructor(  ) {  }

}
