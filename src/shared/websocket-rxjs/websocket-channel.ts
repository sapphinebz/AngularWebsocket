import {
  AsyncSubject,
  combineLatestWith,
  Observable,
  ReplaySubject,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { Socket } from 'socket.io-client';
import { fromSocketEvent } from './websocket-utils';

export class WebsocketChannel<T> extends Subject<T> {
  private emitAction = new ReplaySubject<T>();

  constructor(
    private onConnected: Observable<Socket>,
    private channel: string,
    private destroy$: AsyncSubject<void>
  ) {
    super();

    this.onConnected
      .pipe(
        switchMap((socket) => {
          return fromSocketEvent<T>(socket, this.channel);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(this);

    this.emitAction
      .pipe(combineLatestWith(this.onConnected), takeUntil(this.destroy$))
      .subscribe(([message, socket]) => {
        socket.emit(this.channel, message);
      });
  }

  emit(message: T) {
    this.emitAction.next(message);
  }
}
