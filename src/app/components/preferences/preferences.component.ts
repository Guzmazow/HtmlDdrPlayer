import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Preferences } from '@models/preferences';
import { Log } from '@services/log.service';
import { PreferenceService } from '@services/preference.service';
import { PreferencesDialogComponent } from './preferences-dialog.component';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss']
})
export class PreferencesComponent {

  constructor(
    private dialog: MatDialog,
    private preferenceService: PreferenceService
  ) { }

  open(): void {
    const dialogRef = this.dialog.open(PreferencesDialogComponent, {
      data: this.preferenceService.onPreferenceChange.value
    });

    dialogRef.afterClosed().subscribe((result: Preferences) => {
      if (!result) return; //canceled
      Log.info("PreferencesComponent", "Saved", result)
      this.preferenceService.save(result);
    });
  }

}
