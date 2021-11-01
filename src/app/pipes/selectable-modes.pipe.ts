import { Pipe, PipeTransform } from '@angular/core';
import { ParsedSimfileMode } from '@models/parsed-simfile-mode';
import { PreferenceService } from '@services/preference.service';

@Pipe({
  name: 'selectableModes'
})
export class SelectableModesPipe implements PipeTransform {

  constructor(private preferenceService: PreferenceService) { }

  transform(allModes: ParsedSimfileMode[]) {
    let NPSFilter = this.preferenceService.onPreferenceChange.value.NPSFilter;
    return allModes.filter(mode =>
      (!NPSFilter.from || mode.nps >= NPSFilter.from) &&
      (!NPSFilter.to || mode.nps <= NPSFilter.to)
    );
  }

}
