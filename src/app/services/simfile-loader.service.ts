import { Injectable } from '@angular/core';
import SimfileRegistry from '../../assets/simfile-registry.json';

@Injectable({
  providedIn: 'root'
})
export class SimfileLoaderService {

  simfileRegistry = SimfileRegistry;

  constructor() { 
  }
}
