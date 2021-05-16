import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { GameRequest } from '@models/game-request';
import { ParsedSimfile } from '@models/parsed-simfile';
import { SimfileRegistryFolder } from '@models/simfile-registry-folder';
import { BehaviorSubject, concat, forkJoin, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SimfileLoaderService {
  simfileRegistryFolders?: Map<string, SimfileRegistryFolder>;
  parsedSimfilesLoaded = new BehaviorSubject(false);
  gameRequested = new BehaviorSubject<GameRequest | undefined>(undefined);

  constructor(private http: HttpClient, private router: Router) {
    this.http.get<SimfileRegistryFolder[]>("/assets/simfile-registry.json", { responseType: "json" }).subscribe(registry => {
      this.simfileRegistryFolders = new Map<string, SimfileRegistryFolder>(registry.map(folder => [folder.location, folder]));
      this.simfileRegistryFolders.forEach(folder => {
        folder.parsedSimfiles = new Map<string, ParsedSimfile>(folder.simfiles.map(x => [x.filename, new ParsedSimfile(folder, x)]));
      });

      forkJoin(
        Array.from(this.simfileRegistryFolders.values()).map(folder =>
          forkJoin(
            Array.from(folder.parsedSimfiles.values()).map(simfile =>
              this.http
                .get(simfile.smFileLocation, { responseType: "text" })
                .pipe(map(reponse => ({ simfileContent: reponse, folderName: folder.location, filename: simfile.filename })))
            )
          )
      )).subscribe(reponses => {
          let allFolderResponses = reponses.reduce((accumulator, value) => accumulator.concat(value), []);
          for (let response of allFolderResponses) {
            let folder = this.simfileRegistryFolders?.get(response.folderName);
            if (!folder) continue;
            let simfileInfo = folder.parsedSimfiles.get(response.filename);
            if (!simfileInfo) continue;
            simfileInfo.loadSimfile(response.simfileContent);
          }
          this.parsedSimfilesLoaded.next(true);
        });
    });


  }

  startSelecting() {
    this.router.navigate(['/']);
  }

  requestGame(r: GameRequest) {
    this.gameRequested.next(r);
    this.router.navigate(['/ddr-player']);
  }
}
