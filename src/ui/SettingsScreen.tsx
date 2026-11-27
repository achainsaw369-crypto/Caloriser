import { useRef, useState } from 'react';
import { normalizeData } from '../core/store';
import { fmtKcal, kcalFromMacros, parseNum } from '../core/nutrition';
import { today } from '../core/dates';
import { store, useAppData } from '../state';

export function SettingsScreen() {
  const data = useAppData();
  const g = data.settings.goals;
  const [kcal, setKcal] = useState(String(g.kcal));
  const [protein, setProtein] = useState(String(g.protein));
  const [fat, setFat] = useState(String(g.fat));
  const [carbs, setCarbs] = useState(String(g.carbs));
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const vals = [kcal, protein, fat, carbs].map(parseNum);
  const valid = vals.every((v) => Number.isFinite(v) && v >= 0);
  const macroKcal = kcalFromMacros(vals[1] || 0, vals[2] || 0, vals[3] || 0);

  const save = () => {
    if (!valid) return;
    store.setGoals({ kcal: vals[0], protein: vals[1], fat: vals[2], carbs: vals[3] });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(store.getSnapshot(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calories-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    try {
      const parsed = normalizeData(JSON.parse(await file.text()));
      if (!confirm(`Заменить текущие данные? В файле: ${parsed.entries.length} записей, ${parsed.recipes.length} блюд.`)) return;
      store.replaceAll(parsed);
      setKcal(String(parsed.settings.goals.kcal));
      setProtein(String(parsed.settings.goals.protein));
      setFat(String(parsed.settings.goals.fat));
      setCarbs(String(parsed.settings.goals.carbs));
    } catch {
      alert('Не удалось прочитать файл');
    }
  };

  return (
    <>
      <h1 className="screen-title">Настройки</h1>
      <section className="card">
        <h3>Цели на день</h3>
        <div className="field">
          <label>Калории, ккал</label>
          <input inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} />
        </div>
        <div className="grid-3">
          <div className="field">
            <label>Белки, г</label>
            <input inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </div>
          <div className="field">
            <label>Жиры, г</label>
            <input inputMode="numeric" value={fat} onChange={(e) => setFat(e.target.value)} />
          </div>
          <div className="field">
            <label>Углеводы, г</label>
            <input inputMode="numeric" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          </div>
        </div>
        <p className="muted small">БЖУ дают ≈ {fmtKcal(macroKcal)} ккал.</p>
        <button className="btn btn-primary full" disabled={!valid} onClick={save}>
          {saved ? 'Сохранено ✓' : 'Сохранить цели'}
        </button>
      </section>

      <section className="card">
        <h3>Данные</h3>
        <p className="muted small">Данные хранятся только в этом браузере. Сделайте резервную копию, чтобы не потерять их.</p>
        <div className="row-gap">
          <button className="btn btn-ghost grow" onClick={exportData}>
            Экспорт
          </button>
          <button className="btn btn-ghost grow" onClick={() => fileRef.current?.click()}>
            Импорт
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importData(f);
              e.target.value = '';
            }}
          />
        </div>
      </section>

      <p className="muted small center">
        Данные о продуктах:{' '}
        <a href="https://openfoodfacts.org" target="_blank" rel="noreferrer">
          Open Food Facts
        </a>{' '}
        (ODbL) и встроенный справочник с усреднёнными значениями.
      </p>
    </>
  );
}
