import type { AppData, DiaryEntry, Food, MealType, Nutrients, Recipe } from './types';

/**
 * Адаптер хранилища. Асинхронный, чтобы в нативной версии подключить
 * AsyncStorage / SQLite без изменений в остальной логике.
 */
export interface StorageAdapter {
  load(): Promise<unknown | null>;
  save(data: AppData): Promise<void>;
}

export const DEFAULT_GOALS: Nutrients = { kcal: 2000, protein: 100, fat: 67, carbs: 250 };

export function emptyData(): AppData {
  return { version: 1, entries: [], customFoods: [], recipes: [], settings: { goals: { ...DEFAULT_GOALS } } };
}

/** Приводит произвольные данные (из хранилища или импорта) к актуальному формату */
export function normalizeData(raw: unknown): AppData {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Partial<AppData>;
  return {
    version: 1,
    entries: Array.isArray(d.entries) ? d.entries : [],
    customFoods: Array.isArray(d.customFoods) ? d.customFoods : [],
    recipes: Array.isArray(d.recipes) ? d.recipes : [],
    settings: { goals: { ...DEFAULT_GOALS, ...(d.settings?.goals ?? {}) } },
  };
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

type Listener = () => void;

export class AppStore {
  private data: AppData = emptyData();
  private listeners = new Set<Listener>();

  constructor(private storage: StorageAdapter) {}

  async init(): Promise<void> {
    try {
      const raw = await this.storage.load();
      if (raw) this.data = normalizeData(raw);
    } catch (e) {
      console.error('Не удалось загрузить данные', e);
    }
    this.emit();
  }

  getSnapshot = (): AppData => this.data;

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private update(fn: (d: AppData) => AppData) {
    this.data = fn(this.data);
    this.emit();
    this.storage.save(this.data).catch((e) => console.error('Не удалось сохранить данные', e));
  }

  // --- Дневник ---

  addEntry(date: string, meal: MealType, food: Food, grams: number): DiaryEntry {
    const entry: DiaryEntry = { id: uid(), date, meal, food, grams, createdAt: Date.now() };
    this.update((d) => ({ ...d, entries: [...d.entries, entry] }));
    return entry;
  }

  updateEntry(id: string, patch: Partial<Pick<DiaryEntry, 'grams' | 'meal'>>) {
    this.update((d) => ({ ...d, entries: d.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  }

  deleteEntry(id: string) {
    this.update((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }));
  }

  // --- Свои продукты ---

  saveCustomFood(food: Food) {
    this.update((d) => {
      const exists = d.customFoods.some((f) => f.id === food.id);
      return {
        ...d,
        customFoods: exists ? d.customFoods.map((f) => (f.id === food.id ? food : f)) : [...d.customFoods, food],
      };
    });
  }

  deleteCustomFood(id: string) {
    this.update((d) => ({ ...d, customFoods: d.customFoods.filter((f) => f.id !== id) }));
  }

  // --- Свои блюда ---

  saveRecipe(recipe: Recipe) {
    this.update((d) => {
      const exists = d.recipes.some((r) => r.id === recipe.id);
      return {
        ...d,
        recipes: exists ? d.recipes.map((r) => (r.id === recipe.id ? recipe : r)) : [...d.recipes, recipe],
      };
    });
  }

  deleteRecipe(id: string) {
    this.update((d) => ({ ...d, recipes: d.recipes.filter((r) => r.id !== id) }));
  }

  // --- Настройки ---

  setGoals(goals: Nutrients) {
    this.update((d) => ({ ...d, settings: { ...d.settings, goals } }));
  }

  replaceAll(data: AppData) {
    this.update(() => normalizeData(data));
  }
}
