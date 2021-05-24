import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { SimfileRegistryYoutubeInfo } from '@models/simfile-registry-youtube-info';
import { NgxY2PlayerComponent, NgxY2PlayerOptions } from 'ngx-y2-player';

@Component({
  selector: 'app-youtube-video',
  templateUrl: './youtube-video.component.html',
  styleUrls: ['./youtube-video.component.css']
})
export class YoutubeVideoComponent implements OnInit {

  @Input() playerOptions: NgxY2PlayerOptions = {};
  @Input() youtubeVideo: SimfileRegistryYoutubeInfo = { id: "", skips: [] };
  @ViewChild('video') video?: NgxY2PlayerComponent;
  constructor() { }

  ngOnInit(): void {
  }


  onVideoReady(event: YT.PlayerEvent) {
    //console.log("Video ready", event.target);
  }
}
