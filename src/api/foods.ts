import { Food } from '../constants';
import { api } from './client';
import { SCHOOL, ADMIN_KEY } from '../config';
import { generateId } from '../utils/idGenerator';

export const foodsApi = {
  /** GET /:school/restaurants/:restaurantId/menus */
  getByRestaurant: (restaurantId: string) =>
    api.get<Food[]>(`/${SCHOOL}/restaurants/${restaurantId}/menus`),

  /** GET /:school/restaurants/:restaurantId/foods/:foodId */
  getById: (restaurantId: string, foodId: string) =>
    api.get<Food>(`/${SCHOOL}/restaurants/${restaurantId}/foods/${foodId}`),

  /** POST /:school/admin/restaurants/:restaurantId/newFood/:foodId?key=... */
  create: async (
    restaurantId: string,
    data: Omit<Food, 'id' | 'restaurantId'>
  ): Promise<Food> => {
    const foodId = generateId();
    await api.post<{ status: boolean }>(
      `/${SCHOOL}/admin/restaurants/${restaurantId}/newFood/${foodId}?key=${ADMIN_KEY}`,
      { ...data }
    );
    return { id: foodId, restaurantId, ...data } as Food;
  },

  /** POST /:school/admin/restaurants/:restaurantId/updateFood/:foodId?key=... */
  update: (restaurantId: string, foodId: string, data: Partial<Food>) =>
    api.post<Food>(
      `/${SCHOOL}/admin/restaurants/${restaurantId}/updateFood/${foodId}?key=${ADMIN_KEY}`,
      { ...data }
    ),

  /** POST /:school/admin/restaurants/:restaurantId/deleteFood/:foodId?key=... */
  delete: (restaurantId: string, foodId: string) =>
    api.post<{ status: boolean }>(
      `/${SCHOOL}/admin/restaurants/${restaurantId}/deleteFood/${foodId}?key=${ADMIN_KEY}`,
      {}
    ),
};
