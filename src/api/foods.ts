import { Food } from '../constants';
import { api } from './client';

export const foodsApi = {
  /** GET /api/foods */
  getAll: () => api.get<Food[]>('/foods'),

  /** GET /api/foods/:id */
  getById: (id: string) => api.get<Food>(`/foods/${id}`),

  /** GET /api/foods?restaurantId=:restaurantId */
  getByRestaurant: (restaurantId: string) =>
    api.get<Food[]>(`/foods?restaurantId=${restaurantId}`),

  /** POST /api/foods  — body: { name, restaurantId, calories, protein, ... } */
  create: (data: Omit<Food, 'id'>) => api.post<Food>('/foods', data),

  /** PUT /api/foods/:id  — body: partial food fields */
  update: (id: string, data: Partial<Food>) =>
    api.put<Food>(`/foods/${id}`, data),

  /** DELETE /api/foods/:id */
  delete: (id: string) => api.delete<void>(`/foods/${id}`),
};
