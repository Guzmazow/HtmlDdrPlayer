import { Pipe, PipeTransform } from '@angular/core';
import { ParsedSimfileMode } from '@models/parsed-simfile-mode';
import { PreferenceService } from '@services/preference.service';

@Pipe({
  name: 'selectableModes'
})
export class SelectableModesPipe implements PipeTransform {

  constructor(private preferenceService: PreferenceService) { }

  transform(allModes: ParsedSimfileMode[]) {
    let npsFilter = this.preferenceService.onPreferenceChange.value.npsFilter;
    return allModes.filter(mode =>
      (!npsFilter.from || mode.nps >= npsFilter.from) &&
      (!npsFilter.to || mode.nps <= npsFilter.to)
    );
  }

}
