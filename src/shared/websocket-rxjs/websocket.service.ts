import { Injectable, OnDestroy } from '@angular/core';
import { AsyncSubject, first, map, share, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { fromSocketEvent } from './websocket-utils';
import { WebsocketChannel } from './websocket-channel';

@Injectable()
export class WebsocketService implements OnDestroy {
  private socket = io({ hostname: 'localhost:3001', path: '/dde' });
  private onConnectState = new AsyncSubject<Socket>();
  private destroy$ = new AsyncSubject<void>();
  onConnect$ = this.onConnectState.pipe(map(() => this.socket));

  constructor() {
    this.onConnectChange();
  }

  private onConnectChange() {
    fromSocketEvent<Socket>(this.socket, 'connect')
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe(this.onConnectState);
  }

  onChannel<T = any>(channel: string) {
    return new WebsocketChannel<T>(this.onConnect$, channel, this.destroy$);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
