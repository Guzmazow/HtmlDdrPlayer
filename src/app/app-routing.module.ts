import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from '@components/home/home.component';
import { DdrPlayerComponent } from '@components/ddr-player/ddr-player.component';
import { SimfileSelectorComponent } from '@components/simfile-selector/simfile-selector.component';
import { SynchronizerComponent } from '@components/synchronizer/synchronizer.component';
import { SimfileGeneratorComponent } from '@components/simfile-generator/simfile-generator.component';

const routes: Routes = [
  {
    path: '', component: HomeComponent, children: [
      {
        path: '', component: SimfileSelectorComponent
      },
      {
        path: 'synchronizer/:foldername/:filename', component: SynchronizerComponent
      },
      {
        path: 'ddr-player', component: DdrPlayerComponent
      },
      {
        path: 'simfile-generator', component: SimfileGeneratorComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
