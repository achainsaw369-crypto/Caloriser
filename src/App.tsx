import { useState } from 'react';
import { today } from './core/dates';
import { DiaryScreen } from './ui/DiaryScreen';
import { MyFoodsScreen } from './ui/MyFoodsScreen';
import { SettingsScreen } from './ui/SettingsScreen';

type Tab = 'diary' | 'foods' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'diary', label: 'Дневник', icon: '📖' },
  { id: 'foods', label: 'Мои блюда', icon: '🍲' },
  { id: 'settings', label: 'Настройки', icon: '⚙️' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('diary');
  const [date, setDate] = useState(today());

  return (
    <div className="app">
      <main className="content">
        {tab === 'diary' && <DiaryScreen date={date} setDate={setDate} />}
        {tab === 'foods' && <MyFoodsScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>
      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span className="nav-icon" aria-hidden="true">
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
