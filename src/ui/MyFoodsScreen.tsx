import { useState } from 'react';
import type { Food, Recipe } from '../core/types';
import { recipeToFood } from '../core/nutrition';
import { store, useAppData } from '../state';
import { FoodRow } from './FoodRow';
import { RecipeEditor } from './RecipeEditor';
import { CustomFoodSheet } from './CustomFoodSheet';

type Editing = null | { kind: 'recipe'; recipe?: Recipe } | { kind: 'food'; food?: Food };

export function MyFoodsScreen() {
  const data = useAppData();
  const [tab, setTab] = useState<'recipes' | 'foods'>('recipes');
  const [editing, setEditing] = useState<Editing>(null);

  const recipes = [...data.recipes].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const foods = [...data.customFoods].sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  return (
    <>
      <h1 className="screen-title">Мои блюда</h1>
      <div className="segmented full tabs">
        <button className={tab === 'recipes' ? 'active' : ''} onClick={() => setTab('recipes')}>
          Блюда ({recipes.length})
        </button>
        <button className={tab === 'foods' ? 'active' : ''} onClick={() => setTab('foods')}>
          Продукты ({foods.length})
        </button>
      </div>

      {tab === 'recipes' ? (
        <>
          <button className="btn btn-primary full" onClick={() => setEditing({ kind: 'recipe' })}>
            + Новое блюдо
          </button>
          <p className="muted small">
            Соберите блюдо из продуктов — калорийность на 100 г и на порцию посчитается автоматически. Блюдо появится в
            поиске при добавлении еды.
          </p>
          {recipes.length === 0 ? (
            <p className="empty">Пока нет ни одного блюда.</p>
          ) : (
            <div className="food-list card-list">
              {recipes.map((r) => (
                <FoodRow key={r.id} food={recipeToFood(r)} onClick={() => setEditing({ kind: 'recipe', recipe: r })} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button className="btn btn-primary full" onClick={() => setEditing({ kind: 'food' })}>
            + Новый продукт
          </button>
          {foods.length === 0 ? (
            <p className="empty">Пока нет своих продуктов.</p>
          ) : (
            <div className="food-list card-list">
              {foods.map((f) => (
                <FoodRow key={f.id} food={f} onClick={() => setEditing({ kind: 'food', food: f })} />
              ))}
            </div>
          )}
        </>
      )}

      {editing?.kind === 'recipe' && (
        <RecipeEditor
          initial={editing.recipe}
          onClose={() => setEditing(null)}
          onSave={(r) => {
            store.saveRecipe(r);
            setEditing(null);
          }}
          onDelete={
            editing.recipe
              ? () => {
                  if (confirm(`Удалить блюдо «${editing.recipe!.name}»? Записи в дневнике сохранятся.`)) {
                    store.deleteRecipe(editing.recipe!.id);
                    setEditing(null);
                  }
                }
              : undefined
          }
        />
      )}
      {editing?.kind === 'food' && (
        <CustomFoodSheet
          initial={editing.food}
          onClose={() => setEditing(null)}
          onSave={(f) => {
            store.saveCustomFood(f);
            setEditing(null);
          }}
          onDelete={
            editing.food
              ? () => {
                  if (confirm(`Удалить продукт «${editing.food!.name}»? Записи в дневнике сохранятся.`)) {
                    store.deleteCustomFood(editing.food!.id);
                    setEditing(null);
                  }
                }
              : undefined
          }
        />
      )}
    </>
  );
}
