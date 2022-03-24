import { Directive, ElementRef, Input, NgZone, OnDestroy } from '@angular/core';
import {
  fromEvent,
  tap,
  merge,
  switchMap,
  finalize,
  takeUntil,
  AsyncSubject,
  Subject,
  Observable,
} from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { WebsocketService } from './websocket.service';

interface ClientMessage {
  event: 'move' | 'up';
  imageName: string;
  translateState: TranslateState;
}

interface TranslateState {
  translateX: number;
  translateY: number;
}

@Directive({
  selector: '[appDraggableSocket]',
})
export class DraggableSocketDirective implements OnDestroy {
  @Input('appDraggableSocket') imageName!: string;
  msgToServer = this.websocket.onChannel<ClientMessage>('msgToServer');
  msgToClient = this.websocket.onChannel<ClientMessage[]>('msgToClient');
  msgToClientInit =
    this.websocket.onChannel<ClientMessage[]>('msgToInitClient');
  move$ = new Subject<TranslateState>();
  up$ = new Subject<TranslateState>();
  destroy$ = new AsyncSubject<void>();
  onInitMessage$ = this.msgToClientInit.pipe(
    this.mapToThisImageEvent(),
    tap((event) => {
      const translate = event.translateState;
      this.stateX = translate.translateX;
      this.stateY = translate.translateY;
    })
  );
  onUpMessage$ = this.msgToClient.pipe(
    this.mapToThisImageEvent(),
    this.onMessageEvent('up')
  );

  onMoveMessage$ = this.msgToClient.pipe(
    this.mapToThisImageEvent(),
    this.onMessageEvent('move')
  );

  onChangeTranslate$ = merge(this.onInitMessage$, this.onMoveMessage$);

  stateX = 0;
  stateY = 0;

  constructor(
    private websocket: WebsocketService,
    private zone: NgZone,
    private el: ElementRef<HTMLElement>
  ) {
    this.zone.runOutsideAngular(() => {
      this.dragElement(this.el.nativeElement)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    });

    this.el.nativeElement.classList.add('draggable');

    this.move$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      this.msgToServer.emit({
        event: 'move',
        imageName: this.imageName,
        translateState: event,
      });
    });

    this.up$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      this.msgToServer.emit({
        event: 'up',
        imageName: this.imageName,
        translateState: event,
      });
    });

    this.onChangeTranslate$
      .pipe(takeUntil(this.destroy$))
      .subscribe((clientMessage) => {
        const translate = clientMessage.translateState;
        this.el.nativeElement.style.transform = `translate(${translate.translateX}px, ${translate.translateY}px)`;
      });

    this.onUpMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((clientMessage) => {
        const translate = clientMessage.translateState;
        this.stateX = translate.translateX;
        this.stateY = translate.translateY;
      });
  }

  dragElement(element: HTMLElement) {
    const mousedown$ = fromEvent<MouseEvent>(element, 'mousedown').pipe(
      tap((event) => event.preventDefault())
    );

    const touchstart$ = fromEvent<TouchEvent>(element, 'touchstart').pipe(
      tap((event) => event.preventDefault())
    );

    const down$ = merge(mousedown$, touchstart$);

    const mousemove$ = fromEvent<MouseEvent>(document, 'mousemove');
    const touchmove$ = fromEvent<TouchEvent>(document, 'touchmove');

    const move$ = merge(mousemove$, touchmove$);

    const mouseup$ = fromEvent<MouseEvent>(document, 'mouseup');
    const touchend$ = fromEvent<TouchEvent>(document, 'touchend');

    const up$ = merge(mouseup$, touchend$);

    const getClient = (event: MouseEvent | TouchEvent) => {
      let clientY: number;
      let clientX: number;
      if (event instanceof TouchEvent) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      return { clientY, clientX };
    };

    return down$.pipe(
      switchMap((downEvent) => {
        let translate: TranslateState;
        const clientDown = getClient(downEvent);
        return move$.pipe(
          tap((moveEvent) => {
            const clientMove = getClient(moveEvent);
            const translateX =
              clientMove.clientX - clientDown.clientX + this.stateX;
            const translateY =
              clientMove.clientY - clientDown.clientY + this.stateY;
            this.move$.next({ translateX, translateY });
            translate = { translateX, translateY };
          }),
          finalize(() => {
            this.up$.next(translate);
          }),
          takeUntil(up$)
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private mapToThisImageEvent() {
    return (source: Observable<ClientMessage[]>) =>
      source.pipe(
        map((clientState) => {
          return clientState.find((c) => c.imageName === this.imageName);
        }),
        filter((client): client is ClientMessage => Boolean(client))
      );
  }

  private onMessageEvent(event: ClientMessage['event']) {
    return (source: Observable<ClientMessage>) =>
      source.pipe(filter((client) => client.event === event));
  }
}
