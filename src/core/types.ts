// Платформенно-независимые модели данных. Этот слой без React/DOM —
// его можно переиспользовать в нативном приложении (React Native / Expo).

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEALS: { id: MealType; title: string }[] = [
  { id: 'breakfast', title: 'Завтрак' },
  { id: 'lunch', title: 'Обед' },
  { id: 'dinner', title: 'Ужин' },
  { id: 'snack', title: 'Перекус' },
];

/** Пищевая ценность. Для продуктов — на 100 г. */
export interface Nutrients {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export type FoodSource = 'builtin' | 'openfoodfacts' | 'custom' | 'recipe';

export interface Food {
  id: string;
  name: string;
  brand?: string;
  source: FoodSource;
  per100g: Nutrients;
  /** Вес одной порции/упаковки, если известен */
  servingGrams?: number;
  barcode?: string;
}

export interface RecipeIngredient {
  id: string;
  /** Снимок продукта на момент добавления */
  food: Food;
  grams: number;
}

/** Своё блюдо (рецепт) */
export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  servings: number;
  /** Вес готового блюда (после варки/жарки). Если не задан — сумма ингредиентов. */
  cookedWeight?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DiaryEntry {
  id: string;
  /** Локальная дата YYYY-MM-DD */
  date: string;
  meal: MealType;
  /** Снимок продукта — правка рецепта не меняет прошлые записи */
  food: Food;
  grams: number;
  createdAt: number;
}

export interface Settings {
  goals: Nutrients;
}

export interface AppData {
  version: 1;
  entries: DiaryEntry[];
  customFoods: Food[];
  recipes: Recipe[];
  settings: Settings;
}
