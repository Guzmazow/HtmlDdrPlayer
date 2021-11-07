import { Injectable } from '@angular/core';
import { Preferences } from '@models/preferences';
import { LocalStorage } from '@other/storage';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PreferenceService {

  /**
   * Local storage of all preferemces
   */
  @LocalStorage('', new Preferences()) private preferences!: Preferences;

  onPreferenceChange = new BehaviorSubject<Preferences>(this.preferences);

  constructor() { 
    //insert defaults if missing
    this.preferences = new Preferences(this.preferences)
    this.onPreferenceChange.next(this.preferences);
  }

  save(pref: Preferences){
    this.preferences = pref;
    this.onPreferenceChange.next(pref);
  }
}
