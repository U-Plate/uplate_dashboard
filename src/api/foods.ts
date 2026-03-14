import { Food } from "../constants";
import { api } from "./client";
import { SCHOOL } from "../config";
import { getAdminKey } from "../utils/adminKey";
import { generateId } from "../utils/idGenerator";
export { fromApiPayload };
export type { ApiFoodPayload };

/**
 * Nutritional fact field keys that get nested inside `nutritionFacts` for API
 * communication.
 */
const NUTRITION_FIELDS = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "sugar",
  "saturatedFat",
  "addedSugars",
  "sodium",
  "dietaryFiber",
  "cholesterol",
  "caloriesFromFat",
  "calcium",
  "iron",
] as const;

type NutritionKey = (typeof NUTRITION_FIELDS)[number];

/** Shape the API sends / expects. */
interface ApiFoodPayload {
  name: string;
  id: string;
  restaurantId?: string;
  quantity: number;
  ingredients: string;
  servingSize: string;
  labels: string | string[];
  nutritionFacts: Record<NutritionKey, number>;
  [key: string]: unknown;
}

/** Convert a flat Food (or partial) into the nested API shape. */
function toApiPayload(data: Partial<Food>): Record<string, unknown> {
  const nutritionFacts: Record<string, number> = {};
  const rest: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if ((NUTRITION_FIELDS as readonly string[]).includes(key)) {
      nutritionFacts[key] = value as number;
    } else {
      rest[key] = value;
    }
  }

  if (rest.labels !== undefined) {
    rest.labels = JSON.stringify(rest.labels ?? []);
  }

  return { ...rest, nutritionFacts };
}

/** Convert a nested API response back into a flat Food-compatible object. */
function fromApiPayload(data: ApiFoodPayload): Food {
  const { nutritionFacts, ...rest } = data;
  return new Food({ ...rest, ...nutritionFacts } as unknown as Food);
}

export const foodsApi = {
  /** GET /:school/restaurants/:restaurantId/menus */
  getByRestaurant: async (restaurantId: string): Promise<Food[]> => {
    const data = await api.get<ApiFoodPayload[]>(
      `/${SCHOOL}/restaurants/${restaurantId}/foods`,
    );
    return data.map(fromApiPayload);
  },

  /** GET /:school/restaurants/:restaurantId/foods/:foodId */
  getById: async (restaurantId: string, foodId: string): Promise<Food> => {
    const data = await api.get<ApiFoodPayload>(
      `/${SCHOOL}/restaurants/${restaurantId}/foods/${foodId}`,
    );
    return fromApiPayload(data);
  },

  /** POST /:school/admin/restaurants/:restaurantId/newFood/:foodId?key=... */
  create: async (
    restaurantId: string,
    data: Omit<Food, "id" | "restaurantId">,
  ): Promise<Food> => {
    const foodId = generateId();
    await api.post<{ status: boolean }>(
      `/${SCHOOL}/admin/restaurants/${restaurantId}/newFood/${foodId}?key=${getAdminKey()}`,
      toApiPayload(data),
    );
    return new Food({ id: foodId, restaurantId, ...data });
  },

  /** POST /:school/admin/restaurants/:restaurantId/updateFood/:foodId?key=... */
  update: async (
    restaurantId: string,
    foodId: string,
    data: Partial<Food>,
  ): Promise<Food> => {
    const raw = await api.post<ApiFoodPayload>(
      `/${SCHOOL}/admin/restaurants/${restaurantId}/updateFood/${foodId}?key=${getAdminKey()}`,
      toApiPayload(data),
    );
    return fromApiPayload(raw);
  },

  /** POST /:school/admin/restaurants/:restaurantId/deleteFood/:foodId?key=... */
  delete: (restaurantId: string, foodId: string) =>
    api.post<{ status: boolean }>(
      `/${SCHOOL}/admin/restaurants/${restaurantId}/deleteFood/${foodId}?key=${getAdminKey()}`,
      {},
    ),
};
