import type { Food } from './types';

/**
 * Поиск продуктов в открытой базе Open Food Facts (https://openfoodfacts.org, лицензия ODbL).
 * Ключ API не нужен, CORS разрешён.
 */

const SEARCH_URL = 'https://search.openfoodfacts.org/search';
const LEGACY_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product/';
const FIELDS = 'code,product_name,product_name_ru,brands,nutriments,serving_size,serving_quantity';

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_ru?: string;
  brands?: string | string[];
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

function num(v: unknown): number | undefined {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function parseServing(p: OffProduct): number | undefined {
  const q = num(p.serving_quantity);
  if (q && q > 0) return q;
  const m = p.serving_size?.match(/([\d.,]+)\s*(g|г|гр|ml|мл)\b/i);
  if (m) {
    const n = parseFloat(m[1].replace(',', '.'));
    if (n > 0) return n;
  }
  return undefined;
}

export function mapOffProduct(p: OffProduct): Food | null {
  const n = p.nutriments ?? {};
  let kcal = num(n['energy-kcal_100g']);
  if (kcal === undefined) {
    const kj = num(n['energy_100g']);
    if (kj !== undefined) kcal = kj / 4.184;
  }
  const name = decodeEntities(p.product_name_ru || p.product_name || '');
  if (!name || kcal === undefined || !p.code) return null;
  // Новый поисковый API отдаёт бренды как теги вида «русское-молоко»
  const brand = Array.isArray(p.brands)
    ? p.brands.map((b) => b.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())).join(', ')
    : p.brands;
  return {
    id: `off:${p.code}`,
    name,
    brand: brand ? decodeEntities(brand) : undefined,
    source: 'openfoodfacts',
    barcode: p.code,
    per100g: {
      kcal,
      protein: num(n['proteins_100g']) ?? 0,
      fat: num(n['fat_100g']) ?? 0,
      carbs: num(n['carbohydrates_100g']) ?? 0,
    },
    servingGrams: parseServing(p),
  };
}

function mapList(list: OffProduct[]): Food[] {
  const seen = new Set<string>();
  const out: Food[] = [];
  for (const p of list) {
    const f = mapOffProduct(p);
    if (f && !seen.has(f.id)) {
      seen.add(f.id);
      out.push(f);
    }
  }
  return out;
}

export async function searchOpenFoodFacts(query: string, signal?: AbortSignal, pageSize = 30): Promise<Food[]> {
  const params = new URLSearchParams({ q: query, page_size: String(pageSize), fields: FIELDS });
  try {
    const res = await fetch(`${SEARCH_URL}?${params}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { hits?: OffProduct[] };
    return mapList(json.hits ?? []);
  } catch (e) {
    if (signal?.aborted) throw e;
    // Запасной вариант — классический API поиска
    const legacy = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: String(pageSize),
      fields: FIELDS,
    });
    const res = await fetch(`${LEGACY_SEARCH_URL}?${legacy}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { products?: OffProduct[] };
    return mapList(json.products ?? []);
  }
}

export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<Food | null> {
  const res = await fetch(`${PRODUCT_URL}${encodeURIComponent(code)}?fields=${FIELDS}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { status?: number; product?: OffProduct };
  if (!json.product) return null;
  return mapOffProduct({ ...json.product, code: json.product.code ?? code });
}

export function isBarcode(s: string): boolean {
  return /^\d{8,14}$/.test(s.trim());
}
