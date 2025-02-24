import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TreeModule } from 'primeng/tree';
import { FileUploadModule } from '@iplab/ngx-file-upload';
import { TableModule } from 'primeng/table';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    TreeModule,
    TableModule,
    FileUploadModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
