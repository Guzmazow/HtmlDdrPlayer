import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Preferences } from '@models/preferences';

@Component({
  selector: 'app-preferences-dialog',
  templateUrl: './preferences-dialog.component.html',
  styleUrls: ['./preferences-dialog.component.scss']
})
export class PreferencesDialogComponent {
  preferencesForm = new FormGroup({
    npsFilter: new FormGroup({
      from: new FormControl(null),
      to: new FormControl(null),
    }),
    display: new FormGroup({
      laneWidth: new FormControl(null),
    }),
    play: new FormGroup({
      xMod: new FormControl(null),
      avgMod: new FormControl(null),
      minMod: new FormControl(null),
    })
  });

  constructor(
    public dialogRef: MatDialogRef<PreferencesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Preferences
  ) {
    this.preferencesForm.patchValue(data);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
