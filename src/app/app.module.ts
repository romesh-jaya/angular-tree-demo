import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TreeModule } from 'primeng/tree';

import { TableModule } from 'primeng/table';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, TreeModule, TableModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
