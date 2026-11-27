import type { Food } from '../core/types';
import { fmtG, fmtKcal } from '../core/nutrition';

const SOURCE_LABEL: Record<Food['source'], string> = {
  builtin: 'Справочник',
  openfoodfacts: 'Open Food Facts',
  custom: 'Мой продукт',
  recipe: 'Моё блюдо',
};

export function sourceLabel(food: Food) {
  return SOURCE_LABEL[food.source];
}

export function FoodRow({ food, onClick }: { food: Food; onClick: () => void }) {
  const n = food.per100g;
  const isRecipe = food.source === 'recipe' && food.servingGrams;
  const k = isRecipe ? food.servingGrams! / 100 : 1;
  return (
    <button className="food-row" onClick={onClick}>
      <div className="food-row-main">
        <div className="food-name">{food.name}</div>
        <div className="food-meta">
          <span className={`tag tag-${food.source}`}>{sourceLabel(food)}</span>
          {food.brand && <span className="muted"> · {food.brand}</span>}
        </div>
        <div className="food-macros muted">
          Б {fmtG(n.protein * k)} · Ж {fmtG(n.fat * k)} · У {fmtG(n.carbs * k)}
        </div>
      </div>
      <div className="food-row-kcal">
        <b>{fmtKcal(n.kcal * k)}</b>
        <span className="muted">{isRecipe ? 'ккал / порция' : 'ккал / 100 г'}</span>
      </div>
    </button>
  );
}
