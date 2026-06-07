import { useMemo, useState } from 'react';

const WEEKDAYS = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];
const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

// ---------------------------------------------------------------------------
//  Calendar — backend calendar massivini oylik grid ko'rinishida chiqaradi.
//   free  -> yashil (bosish mumkin)
//   booked-> qizil (bosish mumkin: band ma'lumoti)
//   past  -> kulrang (disabled)
//
//  props:
//   calendar: [{ date:'YYYY-MM-DD', status:'free'|'booked'|'past' }]
//   selectedDate: tanlangan {date,...} yoki null
//   onSelectDate: (cell) => void
// ---------------------------------------------------------------------------
export default function Calendar({ calendar = [], selectedDate, onSelectDate }) {
  // date -> status xaritasi
  const statusMap = useMemo(() => {
    const m = {};
    for (const d of calendar) m[d.date] = d.status;
    return m;
  }, [calendar]);

  // mavjud oylar ('YYYY-MM') tartiblangan
  const months = useMemo(() => {
    const set = new Set(calendar.map((d) => d.date.slice(0, 7)));
    return Array.from(set).sort();
  }, [calendar]);

  const [idx, setIdx] = useState(0);

  if (months.length === 0) return null;

  const safeIdx = Math.min(idx, months.length - 1);
  const ym = months[safeIdx];
  const [year, month] = ym.split('-').map(Number);

  // oyning birinchi kuni qaysi hafta kuniga to'g'ri kelishi (Dushanba = 0)
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, date: dateStr, status: statusMap[dateStr] || 'free' });
  }

  const handleClick = (cell) => {
    if (!cell || cell.status === 'past') return;
    onSelectDate(cell);
  };

  return (
    <div className="calendar card">
      <div className="calendar-head">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={safeIdx === 0}
        >
          ‹
        </button>
        <strong>{MONTHS[month - 1]} {year}</strong>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setIdx((i) => Math.min(months.length - 1, i + 1))}
          disabled={safeIdx === months.length - 1}
        >
          ›
        </button>
      </div>

      <div className="calendar-grid weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-weekday">{w}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e${i}`} className="cal-cell empty" />;
          const isSelected = selectedDate?.date === cell.date;
          return (
            <button
              key={cell.date}
              type="button"
              className={`cal-cell cal-${cell.status} ${isSelected ? 'cal-selected' : ''}`}
              onClick={() => handleClick(cell)}
              disabled={cell.status === 'past'}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="calendar-legend">
        <span><i className="dot dot-free" /> Bo'sh</span>
        <span><i className="dot dot-booked" /> Band</span>
        <span><i className="dot dot-past" /> O'tgan</span>
      </div>
    </div>
  );
}
