import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInput } from '@angular/material/input';
import { Preferences } from '@models/preferences';


const ControlsCOM = [
 { "key": "index", "UP": "15", "DOWN": "14", "LEFT": "13", "RIGHT": "12", "START": "11", "SELECT": "10", "N/A": "9 .. 0" },
 { "key": "value", "UP": "1", "DOWN": "2", "LEFT": "4", "RIGHT": "8", "START": "16", "SELECT": "32", "N/A": "64 .. 32768" },
];

@Component({
  selector: 'app-preferences-dialog',
  templateUrl: './preferences-dialog.component.html',
  styleUrls: ['./preferences-dialog.component.scss']
})
export class PreferencesDialogComponent {
  controlsCOMDisplayedColumns: string[] = ["key", "UP", "DOWN", "LEFT", "RIGHT", "START", "SELECT", "N/A"];
  controlsCOM = ControlsCOM;

  preferencesForm = new FormGroup({
    controls: new FormGroup({
      left: new FormControl(null),
      down: new FormControl(null),
      up: new FormControl(null),
      right: new FormControl(null),
      start: new FormControl(null),
      select: new FormControl(null),
      cancel: new FormControl(null),
      test: new FormControl(null),
    }),
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
    @Inject(MAT_DIALOG_DATA) public data: Preferences,
    private cdRef: ChangeDetectorRef
  ) {
    this.preferencesForm.patchValue(data);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  keyConfigure(event: KeyboardEvent): boolean {
    var input = event.target as HTMLInputElement;
    var controlsFormGroup = this.preferencesForm.controls['controls'] as FormGroup;
    var keyInputFormControl = controlsFormGroup.controls[input.getAttribute("formControlName") || ""];
    keyInputFormControl.setValue(event.code || event.key);
    if(event.preventDefault) event.preventDefault();
    return false;
  }

}
