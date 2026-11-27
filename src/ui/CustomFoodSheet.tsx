import { useState } from 'react';
import type { Food } from '../core/types';
import { uid } from '../core/store';
import { fmtKcal, kcalFromMacros, parseNum } from '../core/nutrition';
import { Sheet } from './Sheet';

interface Props {
  initial?: Food;
  initialName?: string;
  onSave: (food: Food) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const str = (n?: number) => (n == null ? '' : String(Math.round(n * 100) / 100));

export function CustomFoodSheet({ initial, initialName, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? initialName ?? '');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [kcal, setKcal] = useState(str(initial?.per100g.kcal));
  const [protein, setProtein] = useState(str(initial?.per100g.protein));
  const [fat, setFat] = useState(str(initial?.per100g.fat));
  const [carbs, setCarbs] = useState(str(initial?.per100g.carbs));
  const [serving, setServing] = useState(str(initial?.servingGrams));

  const p = parseNum(protein) || 0;
  const f = parseNum(fat) || 0;
  const c = parseNum(carbs) || 0;
  const estimated = kcalFromMacros(p, f, c);
  const k = kcal.trim() ? parseNum(kcal) : estimated;
  const s = parseNum(serving);
  const valid = name.trim().length > 0 && Number.isFinite(k) && k >= 0 && (p > 0 || f > 0 || c > 0 || k > 0);

  const save = () => {
    if (!valid) return;
    onSave({
      id: initial?.id ?? `custom:${uid()}`,
      name: name.trim(),
      brand: brand.trim() || undefined,
      source: 'custom',
      per100g: { kcal: k, protein: p, fat: f, carbs: c },
      servingGrams: Number.isFinite(s) && s > 0 ? s : undefined,
    });
  };

  return (
    <Sheet
      title={initial ? 'Редактировать продукт' : 'Новый продукт'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button className="btn btn-danger" onClick={onDelete}>
              Удалить
            </button>
          )}
          <button className="btn btn-primary grow" disabled={!valid} onClick={save}>
            Сохранить
          </button>
        </>
      }
    >
      <div className="field">
        <label>Название</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, домашний хлеб" autoFocus />
      </div>
      <div className="field">
        <label>Бренд / примечание</label>
        <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Необязательно" />
      </div>
      <p className="section-label">Пищевая ценность на 100 г</p>
      <div className="grid-2">
        <div className="field">
          <label>Белки, г</label>
          <input inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="0" />
        </div>
        <div className="field">
          <label>Жиры, г</label>
          <input inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" />
        </div>
        <div className="field">
          <label>Углеводы, г</label>
          <input inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="0" />
        </div>
        <div className="field">
          <label>Калории, ккал</label>
          <input
            inputMode="decimal"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            placeholder={estimated ? `≈ ${fmtKcal(estimated)}` : '0'}
          />
        </div>
      </div>
      <div className="field">
        <label>Вес порции / упаковки, г</label>
        <input inputMode="decimal" value={serving} onChange={(e) => setServing(e.target.value)} placeholder="Необязательно" />
      </div>
      {!kcal.trim() && estimated > 0 && (
        <p className="muted small">Калории не указаны — посчитаем по БЖУ: ≈ {fmtKcal(estimated)} ккал.</p>
      )}
    </Sheet>
  );
}
