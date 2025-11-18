import { EventEmitter } from 'node:events';

export type AppEvent = {
  type: string;
  payload: Record<string, unknown>;
};

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export const emitAppEvent = (event: AppEvent) => {
  emitter.emit('event', event);
};

export const subscribeToEvents = (listener: (event: AppEvent) => void) => {
  emitter.on('event', listener);
  return () => emitter.off('event', listener);
};
