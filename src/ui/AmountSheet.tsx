import { useState } from 'react';
import type { Food, MealType } from '../core/types';
import { MEALS } from '../core/types';
import { forGrams, fmtG, fmtKcal, parseNum } from '../core/nutrition';
import { Sheet } from './Sheet';
import { sourceLabel } from './FoodRow';

interface Props {
  food: Food;
  title: string;
  confirmLabel: string;
  initialGrams?: number;
  /** Если задан — показывается выбор приёма пищи */
  meal?: MealType;
  onConfirm: (grams: number, meal?: MealType) => void;
  onDelete?: () => void;
  onClose: () => void;
}

type Unit = 'g' | 'serving';

function trim(n: number) {
  return String(Math.round(n * 100) / 100);
}

export function AmountSheet({ food, title, confirmLabel, initialGrams, meal, onConfirm, onDelete, onClose }: Props) {
  const serving = food.servingGrams && food.servingGrams > 0 ? food.servingGrams : undefined;

  const [unit, setUnit] = useState<Unit>(() =>
    initialGrams == null && food.source === 'recipe' && serving ? 'serving' : 'g',
  );
  const [amount, setAmount] = useState(() => {
    if (initialGrams != null) return trim(initialGrams);
    if (food.source === 'recipe' && serving) return '1';
    return String(serving ? Math.round(serving) : 100);
  });
  const [selMeal, setSelMeal] = useState<MealType | undefined>(meal);

  const value = parseNum(amount);
  const grams = unit === 'g' ? value : value * (serving ?? 0);
  const valid = Number.isFinite(grams) && grams > 0;
  const n = forGrams(food, valid ? grams : 0);

  const switchUnit = (u: Unit) => {
    if (u === unit || !serving) return;
    if (Number.isFinite(value)) setAmount(trim(u === 'g' ? value * serving : value / serving));
    setUnit(u);
  };

  const quick = unit === 'g' ? [50, 100, 150, 200, 250] : [0.5, 1, 1.5, 2];

  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button className="btn btn-danger" onClick={onDelete}>
              Удалить
            </button>
          )}
          <button className="btn btn-primary grow" disabled={!valid} onClick={() => onConfirm(grams, selMeal)}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="amount-food">
        <div className="food-name big">{food.name}</div>
        <div className="muted">
          {sourceLabel(food)}
          {food.brand ? ` · ${food.brand}` : ''} · {fmtKcal(food.per100g.kcal)} ккал / 100 г
        </div>
      </div>

      <div className="amount-input">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && valid && onConfirm(grams, selMeal)}
          autoFocus
          aria-label="Количество"
        />
        {serving ? (
          <div className="segmented">
            <button className={unit === 'g' ? 'active' : ''} onClick={() => switchUnit('g')}>
              г
            </button>
            <button className={unit === 'serving' ? 'active' : ''} onClick={() => switchUnit('serving')}>
              порц. ({fmtG(serving)} г)
            </button>
          </div>
        ) : (
          <span className="unit">г</span>
        )}
      </div>

      <div className="chips">
        {quick.map((q) => (
          <button key={q} className="chip" onClick={() => setAmount(String(q))}>
            {String(q).replace('.', ',')} {unit === 'g' ? 'г' : 'порц.'}
          </button>
        ))}
      </div>

      {selMeal && (
        <div className="field">
          <label>Приём пищи</label>
          <div className="segmented full">
            {MEALS.map((m) => (
              <button key={m.id} className={selMeal === m.id ? 'active' : ''} onClick={() => setSelMeal(m.id)}>
                {m.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="nutri-grid">
        <div>
          <b>{fmtKcal(n.kcal)}</b>
          <span>ккал</span>
        </div>
        <div className="c-protein">
          <b>{fmtG(n.protein)}</b>
          <span>белки, г</span>
        </div>
        <div className="c-fat">
          <b>{fmtG(n.fat)}</b>
          <span>жиры, г</span>
        </div>
        <div className="c-carbs">
          <b>{fmtG(n.carbs)}</b>
          <span>углев., г</span>
        </div>
      </div>
      {unit === 'serving' && valid && <p className="muted center">≈ {fmtG(grams)} г</p>}
    </Sheet>
  );
}
