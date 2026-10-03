import { useState } from 'react';
import type { FormEvent } from 'react';
import { SCHOOL } from '../config';
import { schoolFoodsApi, schoolNutritionFields } from '../api/schoolFoods';
import type { SchoolFood, SchoolFoodPatch, SchoolNutritionKey } from '../api/schoolFoods';
import { toDraft, buildPatch } from '../utils/schoolFoodOverrides';
import type { Draft } from '../utils/schoolFoodOverrides';
import { Button } from '../components/Button';
import '../components/FormField.css';
import './FoodForm.css';
import './SchoolFoodOverridesPage.css';

export const SchoolFoodOverridesPage = () => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'name' | 'id'>('name');
  const [results, setResults] = useState<SchoolFood[]>([]);
  const [searched, setSearched] = useState(false);
  const [food, setFood] = useState<SchoolFood | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [original, setOriginal] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selectFood = (selected: SchoolFood) => {
    const values = toDraft(selected);
    setFood(selected);
    setDraft(values);
    setOriginal(values);
    setError('');
    setMessage('');
  };

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim() || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    setResults([]);
    setFood(null);
    setDraft(null);
    setOriginal(null);
    setSearched(false);
    try {
      if (mode === 'id') {
        selectFood(await schoolFoodsApi.getById(query.trim()));
      } else {
        setResults(await schoolFoodsApi.search(query.trim()));
        setSearched(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load school foods.');
    } finally {
      setBusy(false);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!food || !draft || !original || busy) return;
    setError('');
    setMessage('');
    let patch: SchoolFoodPatch;
    try {
      patch = buildPatch(draft, original);
      if (!Object.keys(patch).length) throw new Error('Change at least one field before saving.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check the changed fields.');
      return;
    }
    setBusy(true);
    try {
      await schoolFoodsApi.override(food.id, patch);
      // A failed verification must not invite resubmission of an already saved patch.
      const saved = {
        ...food, ...patch, fat: patch.totalFat ?? food.fat,
        is_favoritable: patch.isFavoritable === undefined ? food.is_favoritable : Number(patch.isFavoritable),
        isOverridden: 1,
      };
      selectFood(saved);
      setResults((prev) => prev.map((item) => item.id === saved.id ? saved : item));
      try {
        const fresh = await schoolFoodsApi.getById(food.id);
        selectFood(fresh);
        setResults((prev) => prev.map((item) => item.id === fresh.id ? fresh : item));
        setMessage('Override saved and verified.');
      } catch {
        setMessage('Override saved. Could not reload the food to verify it; look it up again to check.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the override.');
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof Draft, label: string, type: 'text' | 'number' | 'textarea') => (
    <div className="form-field" key={key}>
      <label className="form-field__label" htmlFor={`override-${key}`}>{label}</label>
      {type === 'textarea' ? (
        <textarea id={`override-${key}`} className="form-field__input" rows={3} value={draft?.[key] ?? ''}
          onChange={(e) => setDraft((prev) => prev && ({ ...prev, [key]: e.target.value }))} />
      ) : (
        <input id={`override-${key}`} className="form-field__input" type={type} step={type === 'number' ? 'any' : undefined}
          value={draft?.[key] ?? ''} onChange={(e) => setDraft((prev) => prev && ({ ...prev, [key]: e.target.value }))} />
      )}
    </div>
  );

  return (
    <div className="food-form school-overrides">
      <header className="food-form__header">
        <h1 className="food-form__title">School Food Overrides</h1>
        <p className="food-form__subtitle">Correct foods in the {SCHOOL} catalog. Changes apply across every menu using the food ID and persist through later scrapes. Further edits are allowed; there is no reset.</p>
      </header>
      <form className="food-form__form" onSubmit={search}>
        <fieldset disabled={busy} className="school-overrides__fieldset">
          <label className="form-field__label" htmlFor="school-food-mode">Find food by</label>
          <select id="school-food-mode" className="form-field__input" value={mode} onChange={(e) => setMode(e.target.value as 'name' | 'id')}>
            <option value="name">Name (starts with)</option><option value="id">Food ID</option>
          </select>
          <label className="form-field__label" htmlFor="school-food-query">{mode === 'id' ? 'Food ID' : 'Food name'}</label>
          <input id="school-food-query" className="form-field__input" value={query} onChange={(e) => setQuery(e.target.value)} required />
          <Button type="submit" disabled={busy || !query.trim()}>{busy ? 'Working…' : 'Find food'}</Button>
        </fieldset>
      </form>
      {error && <p className="form-field__error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {searched && results.length === 0 && <p role="status">No foods found. Try another name or a food ID.</p>}
      {results.length > 0 && <div className="school-overrides__results" aria-label="Matching foods">
        <p>Up to 20 matches. Choose a food, or narrow your search.</p>
        {results.map((item) => <Button key={item.id} variant="secondary" disabled={busy} onClick={() => selectFood(item)}>
          {item.name} · {item.id}{item.isOverridden === 1 ? ' · Overridden' : ''}
        </Button>)}
      </div>}
      {food && draft && <form className="food-form__form" onSubmit={save} noValidate>
        <h2>{food.name}</h2>
        <p>Food ID: {food.id} · {food.isOverridden === 1 ? 'Overridden — protected from scrapes' : 'No admin override'}</p>
        <p>Only changed fields are saved. Use -1 for unknown nutrients. Labels must be a JSON array, for example ["Vegan"].</p>
        <fieldset disabled={busy} className="school-overrides__fieldset">
          <div className="food-form__section">
            <h3 className="food-form__section-title">Basic Information</h3>
            {field('name', 'Food Name', 'text')}
            {field('servingSize', 'Serving Size', 'text')}
            {field('ingredients', 'Ingredients', 'textarea')}
            {field('labels', 'Labels (JSON array)', 'text')}
            <label className="form-field__label" htmlFor="override-favoritable">Can be favorited</label>
            <select id="override-favoritable" className="form-field__input" value={draft.isFavoritable}
              onChange={(e) => setDraft({ ...draft, isFavoritable: e.target.value as Draft['isFavoritable'] })}>
              {original?.isFavoritable === '' && <option value="">Unspecified (preserve)</option>}
              <option value="true">Yes</option><option value="false">No</option>
            </select>
          </div>
          <div className="food-form__grid">
            {(Object.keys(schoolNutritionFields) as SchoolNutritionKey[]).map((key) => field(key, schoolNutritionFields[key], 'number'))}
          </div>
          <div className="food-form__actions">
            <Button variant="secondary" disabled={busy} onClick={() => { setDraft(original); setError(''); setMessage(''); }}>Discard changes</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save override'}</Button>
          </div>
        </fieldset>
      </form>}
    </div>
  );
};
