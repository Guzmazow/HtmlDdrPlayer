import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ParsedSimfile } from '@models/parsed-simfile';
import { forkJoin, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import SimfileRegistry from '../../assets/simfile-registry.json';

@Injectable({
  providedIn: 'root'
})
export class SimfileLoaderService {

  parsedSimfiles = new Map(SimfileRegistry.map(i => [i.filename, new ParsedSimfile(i.filename)]));;

  parsedSimfilesLoaded = new Subject();

  constructor(private http: HttpClient) {
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
}
