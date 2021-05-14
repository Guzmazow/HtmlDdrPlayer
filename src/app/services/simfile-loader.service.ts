import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { GameRequest } from '@models/game-request';
import { ParsedSimfile } from '@models/parsed-simfile';
import { SimfileRegistryFolder } from '@models/simfile-registry-folder';
import { BehaviorSubject, forkJoin, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SimfileLoaderService {

  parsedFolderName?: string;
  parsedSimfiles?: Map<string, ParsedSimfile>;
  parsedSimfilesLoaded = new  BehaviorSubject(false);
  gameRequested = new BehaviorSubject<GameRequest | undefined>(undefined);

  constructor(private http: HttpClient, private router: Router) {
    this.http.get<SimfileRegistryFolder[]>("/assets/simfile-registry.json", { responseType: "json" }).subscribe(registry => {
      this.parsedFolderName = registry[1].name;
      this.parsedSimfiles = new Map<string, ParsedSimfile>(registry[1].simfiles.map(x => [x.filename, new ParsedSimfile(x)]));

      forkJoin(
        Array.from(this.parsedSimfiles.values()).map(simfile =>
          this.http
            .get(simfile.smFileLocation, { responseType: "text" })
            .pipe(map(reponse => ({ simfileContent: reponse, filename: simfile.filename })))
        )
      ).subscribe(reponses => {
        for (let response of reponses) {
          let simfileInfo = this.parsedSimfiles?.get(response.filename);
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
