import { Injectable } from '@angular/core';
import { Media } from './models/media';
import { ParsingService } from './parsing.service';
import { Direction } from './models/note-enums';

@Injectable({
  providedIn: 'root'
})
export class MediaService {

  media: Media = new Media();

  constructor(private parsingService: ParsingService) {

  }

  prepareMedia() {
    let filename = this.parsingService.partialParse.metaData.get("MUSIC");
    if (filename) {
      this.media.audio = new Audio(`${this.parsingService.smFileLocation.substring(0, this.parsingService.smFileLocation.lastIndexOf("/"))}/${filename}`);
      this.media.audio.load();
    }

    let directions = [Direction.DOWN, Direction.LEFT, Direction.UP, Direction.RIGHT];
    for (let direction of directions) {
      let arrowImage = <HTMLImageElement>document.getElementById("noteskin-arrow");
      this.media.arrowImageCache.set(direction, this.getClippedRegion(arrowImage, 0, 0, arrowImage.width, arrowImage.height / 8, direction));
    }
  }

  getClippedRegion(image: HTMLImageElement, x: number, y: number, width: number, height: number, direction: Direction) {

    var canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');

    if (ctx == null)
      throw 'ctx must not be null';

    canvas.width = width;
    canvas.height = height;

    var halfWidth = canvas.width / 2;
    var halfHeight = canvas.height / 2;
    var angleInRadians = 0;
    switch (direction) {
      case Direction.LEFT: angleInRadians = 90 * Math.PI / 180; break;
      case Direction.DOWN: angleInRadians = 0; break;
      case Direction.RIGHT: angleInRadians = -90 * Math.PI / 180; break;
      case Direction.UP: angleInRadians = 180 * Math.PI / 180; break;
    }

    ctx.translate(halfWidth, halfHeight);
    ctx.rotate(angleInRadians);
    //source region dest. region
    ctx.drawImage(image, x, y, width, height, -halfWidth, -halfHeight, width, height);
    ctx.rotate(-angleInRadians);
    ctx.translate(-halfWidth, -halfHeight);

    return canvas;
  }


}
