import { Component, OnInit } from '@angular/core';
import { SimfileLoaderService } from '@services/simfile-loader.service';

@Component({
  selector: 'app-simfile-selector',
  templateUrl: './simfile-selector.component.html',
  styleUrls: ['./simfile-selector.component.scss']
})
export class SimfileSelectorComponent implements OnInit {

  simfileRegistry = this.simfileLoaderService.simfileRegistry;

  constructor(private simfileLoaderService: SimfileLoaderService) { }

  ngOnInit(): void {

  }

}
