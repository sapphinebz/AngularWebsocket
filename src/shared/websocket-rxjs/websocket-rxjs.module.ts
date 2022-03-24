import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DraggableSocketDirective } from './draggable-socket.directive';

@NgModule({
  declarations: [DraggableSocketDirective],
  exports: [DraggableSocketDirective],
  imports: [CommonModule],
})
export class WebsocketRxJSModule {}
