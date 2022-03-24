import { Observable } from 'rxjs';
import { Socket } from 'socket.io-client';

export function fromSocketEvent<T>(socket: Socket, eventName: string) {
  return new Observable<T>((observer) => {
    const listener = (data: T) => {
      observer.next(data);
    };
    socket.on(eventName, listener);
    return () => socket.off(eventName, listener);
  });
}
