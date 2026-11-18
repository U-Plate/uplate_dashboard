import { api } from './client';
import { API_BASE_URL } from '../config';

/**
 * Debug-only reader for any school's dining menus. Mirrors the app's calls in
 * uplate_frontend lib/api/cloudflare/services/menus.dart (CFMenusService).
 */

export const MEAL_TIMES = ['Breakfast', 'Brunch', 'Lunch', 'Late Lunch', 'Dinner'] as const;

export interface SchoolListEntry {
  schoolCode: string;
  diningHalls: string[];
  govCode: number;
}

export interface MenuRow {
  dining_hall: string;
  meal_time: string;
  date: string;
  meal_data: string;
  hours: string | null;
  last_updated: number;
  unix_update_time: number;
}

export interface MiniFood {
  id: string;
  station?: string;
}

export interface MenuFood {
  id: string;
  name: string;
  calories?: number;
  servingSize?: string;
}

/** The app sends dates as MM-DD-YYYY. */
function toAppDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${m}-${d}-${y}`;
}

export const schoolMenusApi = {
  /** GET /getSchoolList */
  getSchools: () => api.get<SchoolListEntry[]>('/getSchoolList', { cache: 'no-store' }),

  /** Same URL as getFoodIDsMealV2 (version 0 = full menu), minus mealTime so all meals come back. */
  getHallMenus: (school: string, hall: string, isoDate: string) => {
    const h = encodeURIComponent(hall);
    return api.get<MenuRow[]>(
      `/${encodeURIComponent(school)}/menus/${h}?menus&diningHall=${h}&version=0&date=${toAppDate(isoDate)}`,
      { cache: 'no-store' },
    );
  },

  /** Same as getFoodData: POST /:school/foodIds?foodIds=POST with a CSV body of ids. */
  getFoods: async (school: string, ids: string[]): Promise<MenuFood[]> => {
    if (!ids.length) return [];
    const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(school)}/foodIds?foodIds=POST`, {
      method: 'POST',
      body: ids.join(','),
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Food lookup failed (${res.status}): ${await res.text().catch(() => '')}`);
    }
    return res.json();
  },
};
