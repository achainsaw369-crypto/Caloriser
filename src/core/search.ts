import type { Food } from './types';

export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

/** Все слова запроса должны встречаться в названии/бренде */
export function matchesQuery(food: Food, query: string): boolean {
  const words = normalizeText(query).split(' ').filter(Boolean);
  if (!words.length) return true;
  const hay = normalizeText(`${food.name} ${food.brand ?? ''}`);
  return words.every((w) => hay.includes(w));
}

/** Локальный поиск с ранжированием: сначала совпадение с начала названия */
export function searchLocal(foods: Food[], query: string, limit = 40): Food[] {
  const q = normalizeText(query);
  return foods
    .filter((f) => matchesQuery(f, q))
    .map((f) => ({ f, score: normalizeText(f.name).startsWith(q) ? 0 : 1 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((x) => x.f);
}
