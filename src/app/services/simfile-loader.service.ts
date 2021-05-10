import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { GameRequest } from '@models/game-request';
import { ParsedSimfile } from '@models/parsed-simfile';
import { BehaviorSubject, forkJoin, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import SimfileRegistry from '../../assets/simfile-registry.json';

@Injectable({
  providedIn: 'root'
})
export class SimfileLoaderService {
  

  parsedSimfiles = new Map(SimfileRegistry[1].map(i => [i.filename, new ParsedSimfile(i.filename, i.youtubeVideoIds ?? [], i.skips ?? [])]));;
  parsedSimfilesLoaded = new Subject();
  gameRequested = new BehaviorSubject<GameRequest | undefined>(undefined);
  
  constructor(private http: HttpClient, private router: Router) {
    forkJoin(
      Array.from(this.parsedSimfiles.values()).map(simfile =>
        this.http
          .get(simfile.smFileLocation, { responseType: "text" })
          .pipe(map(reponse => ({ simfileContent: reponse, filename: simfile.filename })))
      )
    ).subscribe(reponses => {
      for (let response of reponses) {
        let simfileInfo = this.parsedSimfiles.get(response.filename);
        if (!simfileInfo) continue;
        simfileInfo.loadSimfile(response.simfileContent);
      }
      this.parsedSimfilesLoaded.next();
    });
  }

  startSelecting(){
    this.router.navigate(['/']);
  }

  requestGame(r: GameRequest) {
    this.gameRequested.next(r);
    this.router.navigate(['/ddr-player']);
  }
}
