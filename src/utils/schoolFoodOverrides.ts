import { schoolNutritionFields } from '../api/schoolFoods';
import type { SchoolFood, SchoolFoodPatch, SchoolNutritionKey } from '../api/schoolFoods';

export type Draft = Record<SchoolNutritionKey, string> & {
  name: string; servingSize: string; ingredients: string; labels: string;
  isFavoritable: '' | 'true' | 'false';
};

export function toDraft(food: SchoolFood): Draft {
  return {
    ...Object.fromEntries(Object.keys(schoolNutritionFields).map((key) => {
      const value = key === 'totalFat' ? food.fat : food[key as Exclude<SchoolNutritionKey, 'totalFat'>];
      return [key, value == null ? '' : String(value)];
    })),
    name: food.name,
    servingSize: food.servingSize ?? '',
    ingredients: food.ingredients ?? '',
    labels: typeof food.labels === 'string' ? food.labels : JSON.stringify(food.labels ?? []),
    isFavoritable: food.is_favoritable == null ? '' : food.is_favoritable ? 'true' : 'false',
  } as Draft;
}

/** Scale the current nutrients without changing unknowns or food details. */
export function multiplyNutrition(draft: Draft, multiplier: string): Draft {
  const factor = Number(multiplier);
  if (!multiplier.trim() || !Number.isFinite(factor) || factor < 0) {
    throw new Error('Enter a nonnegative multiplier, such as 0.5 or 2.');
  }
  const scaled = { ...draft };
  for (const key of Object.keys(schoolNutritionFields) as SchoolNutritionKey[]) {
    if (!draft[key].trim()) continue;
    const value = Number(draft[key]);
    if (value === -1) continue;
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Check ${schoolNutritionFields[key]} before applying the multiplier.`);
    }
    const result = value * factor;
    if (!Number.isFinite(result)) {
      throw new Error(`The multiplier makes ${schoolNutritionFields[key]} too large.`);
    }
    // Avoid floating-point artifacts such as 0.1 × 3 = 0.30000000000000004.
    scaled[key] = String(Number(result.toPrecision(12)));
  }
  return scaled;
}

export function buildPatch(draft: Draft, original: Draft): SchoolFoodPatch {
  const patch: SchoolFoodPatch = {};
  for (const key of Object.keys(schoolNutritionFields) as SchoolNutritionKey[]) {
    if (draft[key] === original[key]) continue;
    const value = Number(draft[key]);
    if (!draft[key].trim() || !Number.isFinite(value) || (value < 0 && value !== -1)) {
      throw new Error(`${schoolNutritionFields[key]} must be a nonnegative number or -1 for unknown.`);
    }
    if (original[key] === '' || value !== Number(original[key])) patch[key] = value;
  }
  for (const key of ['name', 'servingSize', 'ingredients', 'labels'] as const) {
    if (draft[key] === original[key]) continue;
    if (key === 'name' && !draft.name.trim()) throw new Error('Food name cannot be blank.');
    if (key === 'labels') {
      let labels: unknown;
      try { labels = JSON.parse(draft.labels); } catch { throw new Error('Labels must be a JSON array of strings, such as ["Vegan"].'); }
      if (!Array.isArray(labels) || labels.some((label) => typeof label !== 'string')) {
        throw new Error('Labels must be a JSON array of strings, such as ["Vegan"].');
      }
      if (JSON.stringify(labels) === JSON.stringify(JSON.parse(original.labels))) continue;
      patch.labels = JSON.stringify(labels);
    } else {
      patch[key] = key === 'name' ? draft[key].trim() : draft[key];
    }
  }
  if (draft.isFavoritable !== original.isFavoritable && draft.isFavoritable !== '') {
    patch.isFavoritable = draft.isFavoritable === 'true';
  }
  return patch;
}
