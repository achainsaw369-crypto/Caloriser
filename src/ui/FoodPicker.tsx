import { useEffect, useMemo, useState } from 'react';
import type { Food } from '../core/types';
import { BUILTIN_FOODS } from '../core/builtinFoods';
import { isBarcode, lookupBarcode, searchOpenFoodFacts } from '../core/foodApi';
import { recentFoods, recipeToFood } from '../core/nutrition';
import { searchLocal } from '../core/search';
import { store, useAppData } from '../state';
import { Sheet } from './Sheet';
import { FoodRow } from './FoodRow';
import { CustomFoodSheet } from './CustomFoodSheet';

interface Props {
  title: string;
  onPick: (food: Food) => void;
  onClose: () => void;
  /** Не показывать этот рецепт (чтобы блюдо не стало ингредиентом самого себя) */
  excludeId?: string;
}

type Tab = 'recent' | 'mine' | 'base';
type Status = 'idle' | 'loading' | 'done' | 'error';

export function FoodPicker({ title, onPick, onClose, excludeId }: Props) {
  const data = useAppData();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>(() => (data.entries.length ? 'recent' : 'base'));
  const [remote, setRemote] = useState<Food[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [creating, setCreating] = useState(false);

  const term = query.trim();

  useEffect(() => {
    if (term.length < 2) {
      setRemote([]);
      setStatus('idle');
      return;
    }
    const ctrl = new AbortController();
    setStatus('loading');
    const timer = setTimeout(async () => {
      try {
        const res = isBarcode(term)
          ? await lookupBarcode(term, ctrl.signal).then((f) => (f ? [f] : []))
          : await searchOpenFoodFacts(term, ctrl.signal);
        setRemote(res);
        setStatus('done');
      } catch {
        if (!ctrl.signal.aborted) setStatus('error');
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [term]);

  const mine = useMemo(
    () => [...data.recipes.map(recipeToFood), ...data.customFoods].filter((f) => f.id !== excludeId),
    [data.recipes, data.customFoods, excludeId],
  );
  const recent = useMemo(() => recentFoods(data.entries).filter((f) => f.id !== excludeId), [data.entries, excludeId]);
  const local = useMemo(() => (term ? searchLocal([...mine, ...BUILTIN_FOODS], term) : []), [term, mine]);

  const list = (foods: Food[], empty: string) =>
    foods.length ? (
      <div className="food-list">
        {foods.map((f) => (
          <FoodRow key={f.id} food={f} onClick={() => onPick(f)} />
        ))}
      </div>
    ) : (
      <p className="empty">{empty}</p>
    );

  return (
    <Sheet title={title} onClose={onClose}>
      <div className="search-bar">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск продукта или штрихкод"
          autoFocus
        />
      </div>
      <button className="btn btn-ghost full" onClick={() => setCreating(true)}>
        + Создать свой продукт
      </button>

      {term ? (
        <>
          {local.length > 0 && (
            <>
              <p className="section-label">Мои и справочник</p>
              {list(local, '')}
            </>
          )}
          <p className="section-label">
            Open Food Facts {status === 'loading' && <span className="spinner" aria-label="Загрузка" />}
          </p>
          {status === 'error' && <p className="empty">Не удалось загрузить данные. Проверьте подключение к интернету.</p>}
          {status === 'done' && list(remote, 'Ничего не найдено. Попробуйте другой запрос или создайте свой продукт.')}
          {status === 'idle' && <p className="empty">Введите хотя бы 2 символа</p>}
        </>
      ) : (
        <>
          <div className="segmented full tabs">
            <button className={tab === 'recent' ? 'active' : ''} onClick={() => setTab('recent')}>
              Недавние
            </button>
            <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>
              Мои
            </button>
            <button className={tab === 'base' ? 'active' : ''} onClick={() => setTab('base')}>
              Справочник
            </button>
          </div>
          {tab === 'recent' && list(recent, 'Здесь появятся продукты, которые вы недавно добавляли.')}
          {tab === 'mine' && list(mine, 'Своих блюд и продуктов пока нет. Создайте их во вкладке «Мои блюда».')}
          {tab === 'base' && list(BUILTIN_FOODS, '')}
        </>
      )}

      {creating && (
        <CustomFoodSheet
          initialName={isBarcode(term) ? '' : term}
          onClose={() => setCreating(false)}
          onSave={(food) => {
            store.saveCustomFood(food);
            setCreating(false);
            onPick(food);
          }}
        />
      )}
    </Sheet>
  );
}
