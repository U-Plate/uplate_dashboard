import { api } from './client';
import { SCHOOL } from '../config';
import { getAdminKey } from '../utils/adminKey';

export const schoolNutritionFields = {
  calories: 'Calories (kcal)',
  protein: 'Protein (g)',
  carbs: 'Carbohydrates (g)',
  totalFat: 'Total Fat (g)',
  sugar: 'Sugar (g)',
  saturatedFat: 'Saturated Fat (g)',
  addedSugars: 'Added Sugars (g)',
  sodium: 'Sodium (mg)',
  dietaryFiber: 'Dietary Fiber (g)',
  cholesterol: 'Cholesterol (mg)',
  caloriesFromFat: 'Calories from Fat (kcal)',
  calcium: 'Calcium (mg)',
  iron: 'Iron (mg)',
} as const;

export type SchoolNutritionKey = keyof typeof schoolNutritionFields;
export type SchoolFoodPatch = Partial<Record<SchoolNutritionKey, number> & {
  name: string;
  servingSize: string;
  ingredients: string;
  labels: string;
  isFavoritable: boolean;
}>;

/** School catalog responses are flat database rows, unlike restaurant foods. */
export interface SchoolFood extends Partial<Record<Exclude<SchoolNutritionKey, 'totalFat'>, number>> {
  id: string;
  name: string;
  school: string;
  fat?: number;
  servingSize?: string;
  ingredients?: string;
  labels?: string | string[];
  is_favoritable?: number;
  isOverridden?: number;
}

export const schoolFoodsApi = {
  search: async (query: string): Promise<SchoolFood[]> => {
    const data = await api.get<{ status: boolean; results: SchoolFood[] }>(
      `/${SCHOOL}/foods/search?q=${encodeURIComponent(query)}`,
    );
    return data.results;
  },

  getById: async (id: string): Promise<SchoolFood> => {
    const foods = await api.get<SchoolFood[]>(
      `/${SCHOOL}?foodIds=${encodeURIComponent(id)}&bypassCache=true`,
    );
    const food = foods.find((item) => item.id === id && item.school === SCHOOL);
    if (!food) throw new Error('Food not found in this school catalog.');
    return food;
  },

  override: async (id: string, patch: SchoolFoodPatch): Promise<void> => {
    if (!Object.keys(patch).length) throw new Error('Change at least one field before saving.');
    const key = getAdminKey();
    if (!key) throw new Error('Set your admin key on the dashboard before saving.');
    const schema = await api.get<{ ok: boolean }>(
      `/${SCHOOL}/ensureSchema?key=${encodeURIComponent(key)}`,
    );
    if (!schema.ok) throw new Error('The school database schema could not be prepared.');
    const result = await api.post<{ status: boolean }>(
      `/${SCHOOL}/foods/overrideFood?foodID=${encodeURIComponent(id)}&key=${encodeURIComponent(key)}`,
      patch,
    );
    if (!result.status) throw new Error('The food override was not saved.');
  },
};
