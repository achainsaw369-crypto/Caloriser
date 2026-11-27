import { useMemo, useRef, useState } from 'react';
import type { DiaryEntry, Food, MealType, Nutrients } from '../core/types';
import { MEALS } from '../core/types';
import { entriesTotal, fmtG, fmtKcal, forGrams } from '../core/nutrition';
import { addDays, formatDateTitle, today } from '../core/dates';
import { store, useAppData } from '../state';
import { FoodPicker } from './FoodPicker';
import { AmountSheet } from './AmountSheet';

type Flow =
  | null
  | { kind: 'add'; meal: MealType; food?: Food }
  | { kind: 'edit'; entry: DiaryEntry };

interface Props {
  date: string;
  setDate: (d: string) => void;
}

export function DiaryScreen({ date, setDate }: Props) {
  const data = useAppData();
  const [flow, setFlow] = useState<Flow>(null);

  const dayEntries = useMemo(() => data.entries.filter((e) => e.date === date), [data.entries, date]);
  const byMeal = useMemo(() => {
    const m: Record<MealType, DiaryEntry[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const e of [...dayEntries].sort((a, b) => a.createdAt - b.createdAt)) m[e.meal].push(e);
    return m;
  }, [dayEntries]);
  const total = entriesTotal(dayEntries);

  const mealTitle = (id: MealType) => MEALS.find((m) => m.id === id)!.title;

  return (
    <>
      <DateNav date={date} setDate={setDate} />
      <DaySummary total={total} goals={data.settings.goals} />

      {MEALS.map((m) => (
        <MealCard
          key={m.id}
          title={m.title}
          entries={byMeal[m.id]}
          onAdd={() => setFlow({ kind: 'add', meal: m.id })}
          onEdit={(entry) => setFlow({ kind: 'edit', entry })}
        />
      ))}

      {flow?.kind === 'add' && (
        <FoodPicker
          title={`${mealTitle(flow.meal)} — добавить`}
          onClose={() => setFlow(null)}
          onPick={(food) => setFlow({ ...flow, food })}
        />
      )}
      {flow?.kind === 'add' && flow.food && (
        <AmountSheet
          food={flow.food}
          title={mealTitle(flow.meal)}
          confirmLabel="Добавить"
          onClose={() => setFlow({ kind: 'add', meal: flow.meal })}
          onConfirm={(grams) => {
            store.addEntry(date, flow.meal, flow.food!, grams);
            setFlow(null);
          }}
        />
      )}
      {flow?.kind === 'edit' && (
        <AmountSheet
          food={flow.entry.food}
          title="Изменить запись"
          confirmLabel="Сохранить"
          initialGrams={flow.entry.grams}
          meal={flow.entry.meal}
          onClose={() => setFlow(null)}
          onConfirm={(grams, meal) => {
            store.updateEntry(flow.entry.id, { grams, meal });
            setFlow(null);
          }}
          onDelete={() => {
            store.deleteEntry(flow.entry.id);
            setFlow(null);
          }}
        />
      )}
    </>
  );
}

function DateNav({ date, setDate }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { title, subtitle } = formatDateTitle(date);
  const isToday = date === today();

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch {
        /* fallthrough */
      }
    }
    el.focus();
    el.click();
  };

  return (
    <div className="date-nav">
      <button className="icon-btn lg" onClick={() => setDate(addDays(date, -1))} aria-label="Предыдущий день">
        ‹
      </button>
      <button className="date-title" onClick={openPicker}>
        <span className="date-main">{title} ▾</span>
        <span className="date-sub">{subtitle}</span>
        <input
          ref={inputRef}
          type="date"
          className="hidden-date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
        />
      </button>
      <button className="icon-btn lg" onClick={() => setDate(addDays(date, 1))} aria-label="Следующий день">
        ›
      </button>
      {!isToday && (
        <button className="today-btn" onClick={() => setDate(today())}>
          Сегодня
        </button>
      )}
    </div>
  );
}

function DaySummary({ total, goals }: { total: Nutrients; goals: Nutrients }) {
  const left = goals.kcal - total.kcal;
  const pct = goals.kcal > 0 ? Math.min(100, (total.kcal / goals.kcal) * 100) : 0;
  const over = left < 0;
  return (
    <section className="card summary">
      <div className="summary-top">
        <div>
          <div className="summary-kcal">
            {fmtKcal(total.kcal)} <span>/ {fmtKcal(goals.kcal)} ккал</span>
          </div>
          <div className={over ? 'over' : 'muted'}>
            {over ? `Превышение на ${fmtKcal(-left)} ккал` : `Осталось ${fmtKcal(left)} ккал`}
          </div>
        </div>
        <Ring pct={pct} over={over} />
      </div>
      <div className="macro-bars">
        <MacroBar label="Белки" cls="protein" value={total.protein} goal={goals.protein} />
        <MacroBar label="Жиры" cls="fat" value={total.fat} goal={goals.fat} />
        <MacroBar label="Углеводы" cls="carbs" value={total.carbs} goal={goals.carbs} />
      </div>
    </section>
  );
}

function Ring({ pct, over }: { pct: number; over: boolean }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
      <circle cx="32" cy="32" r={r} className="ring-bg" />
      {pct > 0 && (
        <circle
          cx="32"
          cy="32"
          r={r}
          className={over ? 'ring-fg over' : 'ring-fg'}
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          transform="rotate(-90 32 32)"
        />
      )}
      <text x="32" y="36" textAnchor="middle">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function MacroBar({ label, cls, value, goal }: { label: string; cls: string; value: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div className="macro">
      <div className="macro-head">
        <span>{label}</span>
        <span className="muted">
          {fmtG(value)} / {fmtG(goal)} г
        </span>
      </div>
      <div className="bar">
        <div className={`bar-fill bg-${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MealCard({
  title,
  entries,
  onAdd,
  onEdit,
}: {
  title: string;
  entries: DiaryEntry[];
  onAdd: () => void;
  onEdit: (e: DiaryEntry) => void;
}) {
  const t = entriesTotal(entries);
  return (
    <section className="card meal">
      <header className="meal-head">
        <div>
          <h3>{title}</h3>
          {entries.length > 0 && (
            <div className="muted small">
              Б {fmtG(t.protein)} · Ж {fmtG(t.fat)} · У {fmtG(t.carbs)}
            </div>
          )}
        </div>
        <div className="meal-head-right">
          {entries.length > 0 && <b>{fmtKcal(t.kcal)} ккал</b>}
          <button className="add-btn" onClick={onAdd} aria-label={`Добавить в ${title.toLowerCase()}`}>
            +
          </button>
        </div>
      </header>
      {entries.length > 0 && (
        <ul className="entries">
          {entries.map((e) => {
            const n = forGrams(e.food, e.grams);
            return (
              <li key={e.id}>
                <button className="entry" onClick={() => onEdit(e)}>
                  <span className="entry-name">
                    {e.food.name}
                    <span className="muted small"> · {fmtG(e.grams)} г</span>
                  </span>
                  <span className="entry-kcal">{fmtKcal(n.kcal)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
