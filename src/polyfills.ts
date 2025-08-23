import { Buffer } from 'buffer';

(window as any).Buffer = Buffer;
(globalThis as any).Buffer = Buffer;

if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

if (typeof (window as any).process === 'undefined') {
  (window as any).process = {
    env: {},
    version: 'v18.0.0',
    nextTick: (cb: () => void) => setTimeout(cb, 0),
    browser: true,
  };
}