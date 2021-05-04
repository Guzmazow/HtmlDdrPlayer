import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';

import {MatSidenavModule} from '@angular/material/sidenav';
import {MatCardModule} from '@angular/material/card';
import { HttpClientModule } from '@angular/common/http';
import { MatExpansionModule }from '@angular/material/expansion';

import { DdrPlayerComponent } from './ddr-player/ddr-player.component';
import { NoteLaneComponent } from './ddr-player/note-lane/note-lane.component';
import { JudgementComponent } from './ddr-player/judgement/judgement.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DdrPlayerComponent,
    NoteLaneComponent,
    JudgementComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatCardModule,
    MatExpansionModule
  ],
  providers: [ ],
  bootstrap: [AppComponent]
})
export class AppModule { }
