/** Локальная дата в формате YYYY-MM-DD */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

const weekdayFmt = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' });
const dayMonthFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const fullFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

export function formatDateTitle(iso: string): { title: string; subtitle: string } {
  const t = today();
  const d = fromISODate(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const dateText = sameYear ? dayMonthFmt.format(d) : fullFmt.format(d);
  const rel =
    iso === t ? 'Сегодня' : iso === addDays(t, -1) ? 'Вчера' : iso === addDays(t, 1) ? 'Завтра' : null;
  const weekday = weekdayFmt.format(d);
  if (rel) return { title: rel, subtitle: `${weekday}, ${dateText}` };
  return { title: dateText, subtitle: weekday };
}
