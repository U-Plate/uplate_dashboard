import { MenuItem } from "../constants";
import type { MenuItemFood, MenuItemSize, Food } from "../constants";

import { api } from "./client";
import { SCHOOL } from "../config";
import { getAdminKey } from "../utils/adminKey";
import { generateId } from "../utils/idGenerator";
import type { ApiFoodPayload } from "./foods";
import { fromApiPayload } from "./foods";

/** Shape of a food entry in the API response — embedded Food object. */
interface RawMenuItemFoodEntry {
  food: ApiFoodPayload;
  quantity: number;
  size?: string;
  optional?: boolean;
}

/** Raw shape returned by the API — foods/possibleFoods contain embedded Food objects. */
interface RawMenuItem {
  id: string;
  name: string;
  restaurantId: string;
  school?: string;
  foods: RawMenuItemFoodEntry[];
  possibleFoods: RawMenuItemFoodEntry[];
}

/** Replaces full Food objects with their IDs for API transport. Server expects `foodId` as the key. */
const serializeFoods = (menuFoods: MenuItemFood[]) =>
  menuFoods.map((mf) => ({ foodId: mf.food.id, quantity: mf.quantity }));

/**
 * Flattens sizes into possibleFoods entries, each tagged with a `size` string.
 * The DB has no sizes column, so sizes are represented as possibleFoods with a size field.
 */
const flattenSizes = (sizes: MenuItemSize[]) =>
  sizes.flatMap((s) => [
    ...s.foods.map((mf) => ({
      foodId: mf.food.id,
      quantity: mf.quantity,
      size: s.name,
    })),
    ...(s.possibleFoods ?? []).map((mf) => ({
      foodId: mf.food.id,
      quantity: mf.quantity,
      size: s.name,
      optional: true,
    })),
  ]);

const serializeMenuItem = (data: Partial<MenuItem>) => {
  const basePossibleFoods = data.possibleFoods
    ? data.possibleFoods.map((mf) => ({
        foodId: mf.food.id,
        quantity: mf.quantity,
        optional: true,
      }))
    : [];
  const sizeEntries = data.sizes?.length ? flattenSizes(data.sizes) : [];

  return {
    ...data,
    ...(data.foods && { foods: serializeFoods(data.foods) }),
    possibleFoods: [...basePossibleFoods, ...sizeEntries],
    sizes: undefined,
  };
};

/** Convert a raw embedded food entry into a MenuItemFood. */
function toMenuItemFood(entry: RawMenuItemFoodEntry): MenuItemFood {
  return {
    food: fromApiPayload(entry.food),
    quantity: entry.quantity,
  };
}

/**
 * Deserializes a raw menu item from the API into a proper MenuItem.
 * Foods are embedded directly in the response, so no separate food map is needed.
 * Size-tagged possibleFoods are grouped back into the sizes array.
 */
export function deserializeMenuItem(raw: RawMenuItem): MenuItem {
  const foods: MenuItemFood[] = (raw.foods ?? []).map(toMenuItemFood);

  const regularPossibleFoods: MenuItemFood[] = [];
  const sizeFoodsMap = new Map<string, MenuItemFood[]>();
  const sizePossibleFoodsMap = new Map<string, MenuItemFood[]>();

  for (const entry of raw.possibleFoods ?? []) {
    const resolved = toMenuItemFood(entry);

    if (!entry.size) {
      regularPossibleFoods.push(resolved);
    } else {
      const targetMap = entry.optional ? sizePossibleFoodsMap : sizeFoodsMap;
      if (!targetMap.has(entry.size)) targetMap.set(entry.size, []);
      targetMap.get(entry.size)!.push(resolved);
    }
  }

  const allSizeNames = new Set([
    ...sizeFoodsMap.keys(),
    ...sizePossibleFoodsMap.keys(),
  ]);
  const sizes: MenuItemSize[] = [...allSizeNames].map((name) => ({
    name,
    foods: sizeFoodsMap.get(name) ?? [],
    possibleFoods: sizePossibleFoodsMap.get(name) ?? [],
  }));

  return new MenuItem({
    id: raw.id,
    name: raw.name,
    restaurantId: raw.restaurantId,
    foods,
    possibleFoods: regularPossibleFoods,
    sizes,
  });
}

/** Extract all unique Food objects from a list of raw menu items. */
export function extractFoodsFromMenuItems(rawItems: RawMenuItem[]): Food[] {
  const foodMap = new Map<string, Food>();
  for (const item of rawItems) {
    for (const entry of [
      ...(item.foods ?? []),
      ...(item.possibleFoods ?? []),
    ]) {
      if (entry.food && !foodMap.has(entry.food.id)) {
        foodMap.set(entry.food.id, fromApiPayload(entry.food));
      }
    }
  }
  return [...foodMap.values()];
}

export const menuItemsApi = {
  /** GET /:school/restaurants/:restaurantId/menuItems — returns raw data for the context to resolve. */
  getByRestaurant: (restaurantId: string) =>
    api.get<RawMenuItem[]>(`/${SCHOOL}/restaurants/${restaurantId}/menu`),

  /** GET /:school/restaurants/:restaurantId/menuItems/:menuItemId */
  getById: (restaurantId: string, menuItemId: string) =>
    api.get<RawMenuItem>(
      `/${SCHOOL}/restaurants/${restaurantId}/menu/${menuItemId}`,
    ),

  /** POST /:school/admin/restaurants/:restaurantId/newMenuItem?key=... */
  create: async (
    restaurantId: string,
    data: Omit<MenuItem, "id" | "restaurantId">,
  ): Promise<MenuItem> => {
    const menuItemId = generateId();
    await api.post<{ status: boolean }>(
      `/${SCHOOL}/admin/restaurants/${restaurantId}/newMenuItem?key=${getAdminKey()}`,
      { ...serializeMenuItem(data), id: menuItemId },
    );
    return { id: menuItemId, restaurantId, ...data } as MenuItem;
  },

  /** POST /:school/admin/restaurants/:restaurantId/updateMenuItem/:menuItemId?key=... */
  update: (restaurantId: string, menuItemId: string, data: Partial<MenuItem>) =>
    api.post<RawMenuItem>(
      `/${SCHOOL}/admin/restaurants/${restaurantId}/updateMenuItem/${menuItemId}?key=${getAdminKey()}`,
      serializeMenuItem(data),
    ),

  /** POST /:school/admin/restaurants/:restaurantId/deleteMenuItem/:menuItemId?key=... */
  delete: (restaurantId: string, menuItemId: string) =>
    api.post<{ status: boolean }>(
      `/${SCHOOL}/admin/restaurants/${restaurantId}/deleteMenuItem/${menuItemId}?key=${getAdminKey()}`,
      {},
    ),

  /** Exported for the context to use when resolving menu items. */
  deserializeMenuItem,
  /** Extract unique Food objects from raw menu item responses. */
  extractFoodsFromMenuItems,
};
