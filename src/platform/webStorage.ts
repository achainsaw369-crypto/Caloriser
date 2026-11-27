import type { StorageAdapter } from '../core/store';

const KEY = 'calorie-counter:data:v1';

/** Веб-реализация хранилища на localStorage. В нативной версии заменить на AsyncStorage/SQLite. */
export const webStorage: StorageAdapter = {
  async load() {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },
};
