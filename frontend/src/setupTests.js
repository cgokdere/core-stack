import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest has no global afterEach here, so Testing Library cannot clean up by itself.
afterEach(() => cleanup());

// Node 25 exposes an experimental localStorage that is not the Web Storage API.
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.clear !== 'function') {
  const store = new Map();
  const memoryStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(String(key), String(value)),
    removeItem: (key) => store.delete(String(key)),
    clear: () => store.clear(),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });
}
