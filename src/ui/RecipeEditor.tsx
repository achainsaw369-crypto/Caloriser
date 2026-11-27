import { useState } from 'react';
import type { Food, Recipe, RecipeIngredient } from '../core/types';
import { uid } from '../core/store';
import { fmtG, fmtKcal, forGrams, mul, parseNum, recipeRawWeight, recipeTotals } from '../core/nutrition';
import { Sheet } from './Sheet';
import { FoodPicker } from './FoodPicker';
import { AmountSheet } from './AmountSheet';

interface Props {
  initial?: Recipe;
  onSave: (r: Recipe) => void;
  onDelete?: () => void;
  onClose: () => void;
}

type AmountState = null | { food: Food; ingId?: string; grams?: number };

export function RecipeEditor({ initial, onSave, onDelete, onClose }: Props) {
  const [id] = useState(() => initial?.id ?? uid());
  const [name, setName] = useState(initial?.name ?? '');
  const [servings, setServings] = useState(String(initial?.servings ?? 1));
  const [cooked, setCooked] = useState(initial?.cookedWeight ? String(initial.cookedWeight) : '');
  const [ings, setIngs] = useState<RecipeIngredient[]>(initial?.ingredients ?? []);
  const [picking, setPicking] = useState(false);
  const [amount, setAmount] = useState<AmountState>(null);

  const servingsN = Math.max(1, Math.round(parseNum(servings) || 1));
  const cookedN = parseNum(cooked);
  const raw = recipeRawWeight({ ingredients: ings });
  const weight = Number.isFinite(cookedN) && cookedN > 0 ? cookedN : raw;
  const totals = recipeTotals({ ingredients: ings });
  const per100 = weight > 0 ? mul(totals, 100 / weight) : totals;
  const perServing = mul(totals, 1 / servingsN);
  const valid = name.trim().length > 0 && ings.length > 0;

  const save = () => {
    if (!valid) return;
    const now = Date.now();
    onSave({
      id,
      name: name.trim(),
      ingredients: ings,
      servings: servingsN,
      cookedWeight: Number.isFinite(cookedN) && cookedN > 0 ? cookedN : undefined,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <Sheet
      title={initial ? 'Редактировать блюдо' : 'Новое блюдо'}
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
        <label>Название блюда</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, сырники" autoFocus={!initial} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Количество порций</label>
          <input inputMode="numeric" value={servings} onChange={(e) => setServings(e.target.value)} />
        </div>
        <div className="field">
          <label>Вес готового блюда, г</label>
          <input
            inputMode="decimal"
            value={cooked}
            onChange={(e) => setCooked(e.target.value)}
            placeholder={raw ? `${fmtG(raw)} (сумма)` : 'Необязательно'}
          />
        </div>
      </div>

      <p className="section-label">Ингредиенты</p>
      {ings.length === 0 && <p className="empty">Добавьте продукты, из которых состоит блюдо.</p>}
      <ul className="entries boxed">
        {ings.map((i) => (
          <li key={i.id}>
            <button className="entry" onClick={() => setAmount({ food: i.food, ingId: i.id, grams: i.grams })}>
              <span className="entry-name">
                {i.food.name}
                <span className="muted small"> · {fmtG(i.grams)} г</span>
              </span>
              <span className="entry-kcal">{fmtKcal(forGrams(i.food, i.grams).kcal)}</span>
            </button>
          </li>
        ))}
      </ul>
      <button className="btn btn-ghost full" onClick={() => setPicking(true)}>
        + Добавить ингредиент
      </button>

      {ings.length > 0 && (
        <div className="recipe-summary">
          <div>
            <span className="muted">Всего ({fmtG(weight)} г)</span>
            <b>{fmtKcal(totals.kcal)} ккал</b>
          </div>
          <div>
            <span className="muted">На 100 г</span>
            <b>{fmtKcal(per100.kcal)} ккал</b>
            <span className="muted small">
              Б {fmtG(per100.protein)} · Ж {fmtG(per100.fat)} · У {fmtG(per100.carbs)}
            </span>
          </div>
          <div>
            <span className="muted">Порция ({fmtG(weight / servingsN)} г)</span>
            <b>{fmtKcal(perServing.kcal)} ккал</b>
            <span className="muted small">
              Б {fmtG(perServing.protein)} · Ж {fmtG(perServing.fat)} · У {fmtG(perServing.carbs)}
            </span>
          </div>
        </div>
      )}

      {picking && (
        <FoodPicker
          title="Ингредиент"
          excludeId={`recipe:${id}`}
          onClose={() => setPicking(false)}
          onPick={(food) => setAmount({ food })}
        />
      )}
      {amount && (
        <AmountSheet
          food={amount.food}
          title={amount.ingId ? 'Ингредиент' : 'Сколько добавить'}
          confirmLabel={amount.ingId ? 'Сохранить' : 'Добавить'}
          initialGrams={amount.grams}
          onClose={() => setAmount(null)}
          onConfirm={(grams) => {
            if (amount.ingId) {
              setIngs((list) => list.map((i) => (i.id === amount.ingId ? { ...i, grams } : i)));
            } else {
              setIngs((list) => [...list, { id: uid(), food: amount.food, grams }]);
              setPicking(false);
            }
            setAmount(null);
          }}
          onDelete={
            amount.ingId
              ? () => {
                  setIngs((list) => list.filter((i) => i.id !== amount.ingId));
                  setAmount(null);
                }
              : undefined
          }
        />
      )}
    </Sheet>
  );
}
