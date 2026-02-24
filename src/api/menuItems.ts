import { MenuItem } from "../constants";
import type { MenuItemFood, MenuItemSize, Food } from "../constants";

import { api } from "./client";
import { SCHOOL } from "../config";
import { getAdminKey } from "../utils/adminKey";
import { generateId } from "../utils/idGenerator";

/** Raw shape returned by the API — possibleFoods entries may carry an optional size tag. */
interface RawMenuItemFood {
  food: Food;
  quantity: number;
  size?: string;
  optional?: boolean;
}

interface RawMenuItem {
  id: string;
  name: string;
  restaurantId: string;
  foods: RawMenuItemFood[];
  possibleFoods: RawMenuItemFood[];
}

/** Replaces full Food objects with their IDs for API transport. Server expects `foodId` as the key. */
const serializeFoods = (foods: MenuItemFood[]) =>
  foods.map((mf) => ({ foodId: mf.food.id, quantity: mf.quantity }));

/**
 * Flattens sizes into possibleFoods entries, each tagged with a `size` string.
 * The DB has no sizes column, so sizes are represented as possibleFoods with a size field.
 */
const flattenSizes = (sizes: MenuItemSize[]) =>
  sizes.flatMap((s) => [
    ...s.foods.map((mf) => ({ foodId: mf.food.id, quantity: mf.quantity, size: s.name })),
    ...(s.possibleFoods ?? []).map((mf) => ({ foodId: mf.food.id, quantity: mf.quantity, size: s.name, optional: true })),
  ]);

const serializeMenuItem = (data: Partial<MenuItem>) => {
  const basePossibleFoods = data.possibleFoods
    ? data.possibleFoods.map((mf) => ({ foodId: mf.food.id, quantity: mf.quantity, optional: true }))
    : [];
  const sizeEntries = data.sizes?.length ? flattenSizes(data.sizes) : [];

  return {
    ...data,
    ...(data.foods && { foods: serializeFoods(data.foods) }),
    possibleFoods: [...basePossibleFoods, ...sizeEntries],
    sizes: undefined,
  };
};

/**
 * Reverse of serializeMenuItem: groups size-tagged possibleFoods back into
 * the sizes array so the rest of the app sees a proper MenuItem.
 */
const deserializeMenuItem = (raw: RawMenuItem): MenuItem => {
  const allPossibleFoods = raw.possibleFoods ?? [];
  const regularPossibleFoods: MenuItemFood[] = allPossibleFoods
    .filter((pf) => !pf.size)
    .map((pf) => ({ food: pf.food, quantity: pf.quantity }));

  const sizeTagged = allPossibleFoods.filter((pf): pf is RawMenuItemFood & { size: string } => !!pf.size);
  const sizeFoodsMap = new Map<string, MenuItemFood[]>();
  const sizePossibleFoodsMap = new Map<string, MenuItemFood[]>();
  for (const pf of sizeTagged) {
    const targetMap = pf.optional ? sizePossibleFoodsMap : sizeFoodsMap;
    if (!targetMap.has(pf.size)) targetMap.set(pf.size, []);
    targetMap.get(pf.size)!.push({ food: pf.food, quantity: pf.quantity });
  }

  const allSizeNames = new Set([...sizeFoodsMap.keys(), ...sizePossibleFoodsMap.keys()]);
  const sizes: MenuItemSize[] = [...allSizeNames].map((name) => ({
    name,
    foods: sizeFoodsMap.get(name) ?? [],
    possibleFoods: sizePossibleFoodsMap.get(name) ?? [],
  }));

  return new MenuItem({
    id: raw.id,
    name: raw.name,
    restaurantId: raw.restaurantId,
    foods: raw.foods ?? [],
    possibleFoods: regularPossibleFoods,
    sizes,
  });
};

export const menuItemsApi = {
  /** GET /:school/restaurants/:restaurantId/menuItems */
  getByRestaurant: async (restaurantId: string): Promise<MenuItem[]> => {
    const raw = await api.get<RawMenuItem[]>(`/${SCHOOL}/restaurants/${restaurantId}/menuItems`);
    return raw.map(deserializeMenuItem);
  },

  /** GET /:school/restaurants/:restaurantId/menuItems/:menuItemId */
  getById: async (restaurantId: string, menuItemId: string): Promise<MenuItem> => {
    const raw = await api.get<RawMenuItem>(
      `/${SCHOOL}/restaurants/${restaurantId}/menuItems/${menuItemId}`,
    );
    return deserializeMenuItem(raw);
  },

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
  update: async (restaurantId: string, menuItemId: string, data: Partial<MenuItem>): Promise<MenuItem> => {
    const raw = await api.post<RawMenuItem>(
      `/${SCHOOL}/admin/restaurants/${restaurantId}/updateMenuItem/${menuItemId}?key=${getAdminKey()}`,
      serializeMenuItem(data),
    );
    return deserializeMenuItem(raw);
  },

  /** POST /:school/admin/restaurants/:restaurantId/deleteMenuItem/:menuItemId?key=... */
  delete: (restaurantId: string, menuItemId: string) =>
    api.post<{ status: boolean }>(
      `/${SCHOOL}/admin/restaurants/${restaurantId}/deleteMenuItem/${menuItemId}?key=${getAdminKey()}`,
      {},
    ),
};
