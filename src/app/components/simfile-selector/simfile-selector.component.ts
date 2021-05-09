import { Component, OnInit } from '@angular/core';
import { MatSelectionListChange } from '@angular/material/list';
import { ParsedSimfile } from '@models/parsed-simfile';
import { ParsingService } from '@services/parsing.service';
import { SimfileLoaderService } from '@services/simfile-loader.service';

@Component({
  selector: 'app-simfile-selector',
  templateUrl: './simfile-selector.component.html',
  styleUrls: ['./simfile-selector.component.scss']
})
export class SimfileSelectorComponent implements OnInit {

  parsedSimfiles: ParsedSimfile[] = [];
  selectedSimfile?: ParsedSimfile;

  constructor(private simfileLoaderService: SimfileLoaderService, private parsingService: ParsingService) {
    this.simfileLoaderService.parsedSimfilesLoaded.subscribe(() => {
      this.parsedSimfiles = Array.from(simfileLoaderService.parsedSimfiles.values());
    });


  }

  ngOnInit(): void {

  }

  onChange(ev: MatSelectionListChange) {
    if (ev.options.length > 0) {
      this.selectedSimfile = ev.options[0].value;
    }
  }


}
