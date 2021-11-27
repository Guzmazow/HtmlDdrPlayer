import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { GameRequest } from '@models/game-request';
import { ParsedSimfileFolder } from '@models/parsed-folder';
import { SimfileRegistryFolder } from '@models/simfile-registry-folder';
import { BehaviorSubject } from 'rxjs';
import { DisplayService } from './display.service';
import { Log } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class SimfileLoaderService {
  parsedSimfileFolders?: Map<string, ParsedSimfileFolder>;
  parsedSimfilesLoaded = new BehaviorSubject(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    private displayService: DisplayService
  ) {
    this.http.get<SimfileRegistryFolder[]>("/assets/simfile-registry-with-data.json", { responseType: "json" }).subscribe(registry => {
      this.parsedSimfileFolders = new Map<string, ParsedSimfileFolder>(registry.map(folder => [folder.location, new ParsedSimfileFolder(folder)]));
      this.parsedSimfilesLoaded.next(true);
      Log.debug("SimfileLoaderService", "simfiles loaded");

    // first version of loading, load one by one
    //   forkJoin(
    //     Array.from(this.simfileRegistryFolders.values()).map(folder =>
    //       forkJoin(
    //         Array.from((folder.parsedSimfiles ?? []).values()).map(simfile =>
    //           this.http
    //             .get(simfile.smFileLocation, { responseType: "text" })
    //             .pipe(map(reponse => ({ simfileContent: reponse, folderName: folder.location, filename: simfile.filename })))
    //         )
    //       )
    //     )).subscribe(reponses => {
    //       let allFolderResponses = reponses.reduce((accumulator, value) => accumulator.concat(value), []);
    //       for (let response of allFolderResponses) {
    //         let folder = this.simfileRegistryFolders?.get(response.folderName);
    //         if (!folder) continue;
    //         let simfileInfo = folder.parsedSimfiles?.get(response.filename);
    //         if (!simfileInfo) continue;
    //         simfileInfo.loadSimfile(response.simfileContent);
    //         //console.log(response.filename, response.simfileContent);
    //         simfileInfo.registry.simfileDataBase64 = this.utf8_to_b64(response.simfileContent);
    //       }
    //       this.parsedSimfilesLoaded.next(true);

    //       var array = Array.from(this.simfileRegistryFolders??[], ([name, value]) => value);
    //       var temp = <SimfileRegistryFolder[]>JSON.parse(JSON.stringify(array));
    //       temp.forEach(x => {
    //         x.parsedSimfiles = undefined;
    //       });
    //       this.save('lol.json', JSON.stringify(temp))
    //     });



   });


  }


  // save(filename: string, data: string) {
  //   const blob = new Blob([data], { type: 'text/json' });
  //   const elem = window.document.createElement('a');
  //   elem.id = 'lolz';
  //   elem.href = window.URL.createObjectURL(blob);
  //   elem.download = filename;
  //   document.body.appendChild(elem);
  //   elem.click();
  //   //document.body.removeChild(elem);
  // }

  startSelecting() {
    this.router.navigate(['/']);
  }

  requestGame(r: GameRequest) {
    Log.info("SimfileLoaderService", "Requesting game", r);
    this.displayService.requestGame(r);
  }
}
