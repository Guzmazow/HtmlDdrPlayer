import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from '@components/home/home.component';
import { DdrPlayerComponent } from '@components/ddr-player/ddr-player.component';
import { SimfileSelectorComponent } from '@components/simfile-selector/simfile-selector.component';

const routes: Routes = [
  {
    path: '', component: HomeComponent, children: [
      {
        path: '', component: SimfileSelectorComponent
      },
      {
        path: 'ddr-player', component: DdrPlayerComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
