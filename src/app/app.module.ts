import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { WebsocketRxJSModule } from 'src/shared/websocket-rxjs/websocket-rxjs.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, WebsocketRxJSModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
