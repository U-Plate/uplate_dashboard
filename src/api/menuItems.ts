import { MenuItem } from '../constants';
import { api } from './client';

export const menuItemsApi = {
  /** GET /api/menu-items */
  getAll: () => api.get<MenuItem[]>('/menu-items'),

  /** GET /api/menu-items/:id */
  getById: (id: string) => api.get<MenuItem>(`/menu-items/${id}`),

  /** GET /api/menu-items?restaurantId=:restaurantId */
  getByRestaurant: (restaurantId: string) =>
    api.get<MenuItem[]>(`/menu-items?restaurantId=${restaurantId}`),

  /** POST /api/menu-items  — body: { name, restaurantId, foods: [{ foodId, quantity }] } */
  create: (data: Omit<MenuItem, 'id'>) =>
    api.post<MenuItem>('/menu-items', data),

  /** PUT /api/menu-items/:id  — body: partial menu item fields */
  update: (id: string, data: Partial<MenuItem>) =>
    api.put<MenuItem>(`/menu-items/${id}`, data),

  /** DELETE /api/menu-items/:id */
  delete: (id: string) => api.delete<void>(`/menu-items/${id}`),
};
