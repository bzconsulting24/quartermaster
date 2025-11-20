import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.setMaxListeners(100);
export const emitAppEvent = (event) => {
    emitter.emit('event', event);
};
export const subscribeToEvents = (listener) => {
    emitter.on('event', listener);
    return () => emitter.off('event', listener);
};
