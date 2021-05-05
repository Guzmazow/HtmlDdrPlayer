import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from '@components/home/home.component';
import { DdrPlayerComponent } from '@components/ddr-player/ddr-player.component';

const routes: Routes = [
  {
    path: '', component: HomeComponent, children: [
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
