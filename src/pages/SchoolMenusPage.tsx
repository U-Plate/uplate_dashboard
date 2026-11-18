import { useEffect, useState } from 'react';
import { MEAL_TIMES, schoolMenusApi } from '../api/schoolMenus';
import type { MenuFood, MenuRow, MiniFood, SchoolListEntry } from '../api/schoolMenus';
import { Button } from '../components/Button';

/** Debug viewer for any school's dining-hall menus, read the way the app reads them. */

interface Meal {
  mealTime: string;
  hours: string;
  updated: number;
  stations: [string, MiniFood[]][];
}

interface HallResult {
  hall: string;
  meals: Meal[];
  error?: string;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatHours(raw: string | null): string {
  if (!raw) return 'no hours';
  try {
    const parsed = JSON.parse(raw);
    const h = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    const fmt = (s?: string) =>
      s ? new Date(s).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '?';
    return `${fmt(h?.Start)} – ${fmt(h?.End)}`;
  } catch {
    return raw;
  }
}

function parseItems(raw: string): MiniFood[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) return parsed;
    // Legacy format: { mealTime: MiniFood[] }
    return Object.values(parsed).flat() as MiniFood[];
  } catch {
    return [];
  }
}

function toMeals(rows: MenuRow[]): Meal[] {
  const order = (m: string) => {
    const i = (MEAL_TIMES as readonly string[]).indexOf(m);
    return i === -1 ? MEAL_TIMES.length : i;
  };
  return rows
    .map((row) => {
      const stations = new Map<string, MiniFood[]>();
      for (const item of parseItems(row.meal_data)) {
        const key = item.station || '(no station)';
        stations.set(key, [...(stations.get(key) ?? []), item]);
      }
      return {
        mealTime: row.meal_time,
        hours: formatHours(row.hours),
        updated: row.unix_update_time,
        stations: [...stations.entries()],
      };
    })
    .sort((a, b) => order(a.mealTime) - order(b.mealTime));
}

export const SchoolMenusPage = () => {
  const [schools, setSchools] = useState<SchoolListEntry[]>([]);
  const [school, setSchool] = useState('');
  const [date, setDate] = useState(todayIso());
  const [results, setResults] = useState<HallResult[]>([]);
  const [foods, setFoods] = useState<Map<string, MenuFood>>(new Map());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    schoolMenusApi
      .getSchools()
      .then((list) => {
        setSchools(list);
        setSchool((current) => current || list[0]?.schoolCode || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const load = async () => {
    const entry = schools.find((s) => s.schoolCode === school);
    if (!entry || busy) return;
    setBusy(true);
    setError('');
    setResults([]);
    setFoods(new Map());
    try {
      const halls = await Promise.all(
        entry.diningHalls.map(async (hall): Promise<HallResult> => {
          try {
            return { hall, meals: toMeals(await schoolMenusApi.getHallMenus(school, hall, date)) };
          } catch (err) {
            return { hall, meals: [], error: err instanceof Error ? err.message : String(err) };
          }
        }),
      );
      setResults(halls);

      const ids = [
        ...new Set(
          halls.flatMap((h) => h.meals.flatMap((m) => m.stations.flatMap(([, items]) => items.map((i) => i.id)))),
        ),
      ];
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 200) chunks.push(ids.slice(i, i + 200));
      const found = (await Promise.all(chunks.map((c) => schoolMenusApi.getFoods(school, c)))).flat();
      setFoods(new Map(found.map((f) => [f.id, f])));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: 1000 }}>
      <h1>School menus (debug)</h1>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
        <select value={school} onChange={(e) => setSchool(e.target.value)}>
          {schools.map((s) => (
            <option key={s.schoolCode} value={s.schoolCode}>
              {s.schoolCode} ({s.diningHalls.length} halls)
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button onClick={load} disabled={!school || busy}>
          {busy ? 'Loading…' : 'Load menus'}
        </Button>
      </div>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {results.map((hall) => (
        <details key={hall.hall} open={hall.meals.length > 0} style={{ marginBottom: '0.75rem' }}>
          <summary>
            <strong>{hall.hall}</strong>{' '}
            {hall.error ? <span style={{ color: 'crimson' }}>— {hall.error}</span> : `— ${hall.meals.length} meal(s)`}
          </summary>
          {hall.meals.map((meal) => (
            <div key={meal.mealTime} style={{ marginLeft: '1rem' }}>
              <h3 style={{ marginBottom: '0.25rem' }}>
                {meal.mealTime}{' '}
                <small style={{ fontWeight: 'normal' }}>
                  {meal.hours} · updated {new Date(meal.updated * 1000).toLocaleString()}
                </small>
              </h3>
              {meal.stations.map(([station, items]) => (
                <div key={station} style={{ marginLeft: '1rem' }}>
                  <h4 style={{ margin: '0.5rem 0 0.25rem' }}>{station}</h4>
                  <ul style={{ margin: 0 }}>
                    {items.map((item, i) => {
                      const food = foods.get(item.id);
                      return (
                        <li key={`${item.id}-${i}`}>
                          {food ? food.name : <em>{busy ? 'loading…' : 'not found'}</em>}
                          {food?.calories != null && ` · ${Math.round(food.calories)} kcal`}
                          {food?.servingSize && ` · ${food.servingSize}`}{' '}
                          <code style={{ opacity: 0.6 }}>{item.id}</code>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </details>
      ))}
    </div>
  );
};
