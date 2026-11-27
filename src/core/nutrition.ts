import type { DiaryEntry, Food, Nutrients, Recipe } from './types';

export const ZERO: Nutrients = { kcal: 0, protein: 0, fat: 0, carbs: 0 };

export function mul(n: Nutrients, k: number): Nutrients {
  return { kcal: n.kcal * k, protein: n.protein * k, fat: n.fat * k, carbs: n.carbs * k };
}

export function add(a: Nutrients, b: Nutrients): Nutrients {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    fat: a.fat + b.fat,
    carbs: a.carbs + b.carbs,
  };
}

export function sum(list: Nutrients[]): Nutrients {
  return list.reduce(add, ZERO);
}

/** Пищевая ценность заданного веса продукта */
export function forGrams(food: Food, grams: number): Nutrients {
  return mul(food.per100g, grams / 100);
}

export function entriesTotal(entries: Pick<DiaryEntry, 'food' | 'grams'>[]): Nutrients {
  return sum(entries.map((e) => forGrams(e.food, e.grams)));
}

export function recipeRawWeight(r: Pick<Recipe, 'ingredients'>): number {
  return r.ingredients.reduce((s, i) => s + i.grams, 0);
}

export function recipeWeight(r: Pick<Recipe, 'ingredients' | 'cookedWeight'>): number {
  return r.cookedWeight && r.cookedWeight > 0 ? r.cookedWeight : recipeRawWeight(r);
}

export function recipeTotals(r: Pick<Recipe, 'ingredients'>): Nutrients {
  return entriesTotal(r.ingredients);
}

/** Превращает рецепт в «продукт», чтобы его можно было добавить в дневник */
export function recipeToFood(r: Recipe): Food {
  const weight = recipeWeight(r);
  const totals = recipeTotals(r);
  return {
    id: `recipe:${r.id}`,
    name: r.name,
    source: 'recipe',
    per100g: weight > 0 ? mul(totals, 100 / weight) : ZERO,
    servingGrams: weight > 0 && r.servings > 0 ? weight / r.servings : undefined,
  };
}

/** Оценка калорий по БЖУ (4/9/4 ккал на грамм) */
export function kcalFromMacros(protein: number, fat: number, carbs: number): number {
  return protein * 4 + fat * 9 + carbs * 4;
}

/** Уникальные продукты из последних записей дневника */
export function recentFoods(entries: DiaryEntry[], limit = 30): Food[] {
  const seen = new Set<string>();
  const out: Food[] = [];
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);
  for (const e of sorted) {
    if (seen.has(e.food.id)) continue;
    seen.add(e.food.id);
    out.push(e.food);
    if (out.length >= limit) break;
  }
  return out;
}

export function fmtKcal(n: number): string {
  return String(Math.round(n));
}

export function fmtG(n: number): string {
  if (Math.abs(n) < 10) return String(Math.round(n * 10) / 10).replace('.', ',');
  return String(Math.round(n));
}

export function parseNum(s: string): number {
  const n = parseFloat(s.replace(',', '.').trim());
  return Number.isFinite(n) ? n : NaN;
}
