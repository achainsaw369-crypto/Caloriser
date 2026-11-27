import { useSyncExternalStore } from 'react';
import { AppStore } from './core/store';
import { webStorage } from './platform/webStorage';

export const store = new AppStore(webStorage);

export function useAppData() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
