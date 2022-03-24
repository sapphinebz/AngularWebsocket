import { Component, OnInit } from '@angular/core';
import { WebsocketService } from 'src/shared/websocket-rxjs/websocket.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [WebsocketService],
})
export class AppComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
