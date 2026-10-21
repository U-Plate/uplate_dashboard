import { MenuItem } from "../constants";
import type { MenuItemFood, MenuItemSize, Food } from "../constants";

import { api } from "./client";
import { SCHOOL } from "../config";
import { getAdminKey } from "../utils/adminKey";
import type { ApiFoodPayload } from "./foods";
import { fromApiPayload } from "./foods";

/** Shape of a food entry in the API response — embedded Food object. */
interface RawMenuItemFoodEntry {
  food: ApiFoodPayload;
  quantity: number;
}

/** Raw shape of a size entry in the API response. */
interface RawMenuItemSize {
  name: string;
  foods: RawMenuItemFoodEntry[];
  possibleFoods: RawMenuItemFoodEntry[];
}

/** Raw shape returned by the API — foods/possibleFoods contain embedded Food objects. */
interface RawMenuItem {
  imageUrl?: string | null;
  station?: string;
  id: string;
  name: string;
  restaurantId: string;
  school?: string;
  foods: RawMenuItemFoodEntry[];
  possibleFoods: RawMenuItemFoodEntry[];
  sizes: RawMenuItemSize[];
}

/** Replaces full Food objects with their IDs for API transport. Server expects `foodId` as the key. */
const serializeFoods = (menuFoods: MenuItemFood[]) =>
  menuFoods.map((mf) => ({ foodId: mf.food.id, quantity: mf.quantity }));

/**
 * Serializes sizes into the dedicated sizes field.
 * foods/possibleFoods are only used at the top level when there are no sizes.
 */
const serializeSizes = (sizes: MenuItemSize[]) =>
  sizes.map((s) => ({
    name: s.name,
    foods: serializeFoods(s.foods),
    possibleFoods: serializeFoods(s.possibleFoods ?? []),
  }));

const serializeMenuItem = (data: Partial<MenuItem>) => ({
  ...data,
  ...(data.foods !== undefined ? { foods: serializeFoods(data.foods) } : {}),
  ...(data.possibleFoods !== undefined ? { possibleFoods: serializeFoods(data.possibleFoods) } : {}),
  ...(data.sizes !== undefined ? { sizes: serializeSizes(data.sizes) } : {}),
});

/** Convert a raw embedded food entry into a MenuItemFood. */
function toMenuItemFood(entry: RawMenuItemFoodEntry): MenuItemFood {
  return {
    food: fromApiPayload(entry.food),
    quantity: entry.quantity,
  };
}

/**
 * Deserializes a raw menu item from the API into a proper MenuItem.
 * Sizes are read from the dedicated sizes field.
 * foods/possibleFoods at the top level are only used when there are no sizes.
 */
export function deserializeMenuItem(raw: RawMenuItem): MenuItem {
  const sizes: MenuItemSize[] = (raw.sizes ?? []).map((s) => ({
    name: s.name,
    foods: (s.foods ?? []).map(toMenuItemFood),
    possibleFoods: (s.possibleFoods ?? []).map(toMenuItemFood),
  }));

  const foods: MenuItemFood[] = (raw.foods ?? []).map(toMenuItemFood);
  const possibleFoods: MenuItemFood[] = (raw.possibleFoods ?? []).map(toMenuItemFood);

  return new MenuItem({
    imageUrl: raw.imageUrl || null,
    id: raw.id,
    name: raw.name,
    station: raw.station?.trim() || "All Items",
    restaurantId: raw.restaurantId,
    foods,
    possibleFoods,
    sizes,
  });
}

/** Extract all unique Food objects from a list of raw menu items. */
export function extractFoodsFromMenuItems(rawItems: RawMenuItem[]): Food[] {
  const foodMap = new Map<string, Food>();
  const addEntry = (entry: RawMenuItemFoodEntry) => {
    if (entry.food && !foodMap.has(entry.food.id)) {
      foodMap.set(entry.food.id, fromApiPayload(entry.food));
    }
  };
  for (const item of rawItems) {
    for (const entry of [...(item.foods ?? []), ...(item.possibleFoods ?? [])]) {
      addEntry(entry);
    }
    for (const size of item.sizes ?? []) {
      for (const entry of [...(size.foods ?? []), ...(size.possibleFoods ?? [])]) {
        addEntry(entry);
      }
    }
  }
  return [...foodMap.values()];
}

export const menuItemsApi = {
  /** GET /:school/restaurants/:restaurantId/menu — returns raw data for the context to resolve. */
  getByRestaurant: (restaurantId: string) =>
    api.get<RawMenuItem[]>(`/${SCHOOL}/restaurants/${restaurantId}/menu`, { cache: "no-store" }),

  /** GET /:school/restaurants/:restaurantId/menu/:menuItemId */
  getById: (restaurantId: string, menuItemId: string) =>
    api.get<RawMenuItem>(
      `/${SCHOOL}/restaurants/${restaurantId}/menu/${menuItemId}`,
      { cache: "no-store" },
    ),

  /** POST /:school/admin/:restaurantId/menu?key=... */
  create: async (
    restaurantId: string,
    data: Omit<MenuItem, "id" | "restaurantId">,
  ): Promise<MenuItem> => {
    const result = await api.post<{ status: boolean; id: string }>(
      `/${SCHOOL}/admin/${restaurantId}/menu?key=${getAdminKey()}`,
      serializeMenuItem(data),
    );
    return { id: result.id, restaurantId, ...data } as MenuItem;
  },

  /** PUT /:school/admin/:restaurantId/menu/:menuItemId?key=... */
  update: (restaurantId: string, menuItemId: string, data: Partial<MenuItem>) =>
    api.put<{ status: boolean }>(
      `/${SCHOOL}/admin/${restaurantId}/menu/${menuItemId}?key=${getAdminKey()}`,
      serializeMenuItem(data),
    ).then(() => menuItemsApi.getById(restaurantId, menuItemId)),

  uploadPhoto: async (restaurantId: string, menuItemId: string, file: File) =>
    deserializeMenuItem(await api.upload<RawMenuItem>(
      `/${SCHOOL}/admin/${restaurantId}/menu/${menuItemId}/photo?key=${getAdminKey()}`,
      file,
    )),

  removePhoto: async (restaurantId: string, menuItemId: string) =>
    deserializeMenuItem(await api.delete<RawMenuItem>(
      `/${SCHOOL}/admin/${restaurantId}/menu/${menuItemId}/photo?key=${getAdminKey()}`,
    )),

  /** DELETE /:school/admin/:restaurantId/menu/:menuItemId?key=... */
  delete: (restaurantId: string, menuItemId: string) =>
    api.delete<{ status: boolean }>(
      `/${SCHOOL}/admin/${restaurantId}/menu/${menuItemId}?key=${getAdminKey()}`,
    ),

  /** DELETE /:school/admin/:restaurantId/menu/all?key=... */
  deleteAll: (restaurantId: string) =>
    api.delete<{ status: boolean }>(
      `/${SCHOOL}/admin/${restaurantId}/menu/all?key=${getAdminKey()}`,
    ),

  /** Exported for the context to use when resolving menu items. */
  deserializeMenuItem,
  /** Extract unique Food objects from raw menu item responses. */
  extractFoodsFromMenuItems,
};
