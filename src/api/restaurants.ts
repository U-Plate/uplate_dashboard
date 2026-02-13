import { Restaurant } from '../constants';
import { api } from './client';

export const restaurantsApi = {
  /** GET /api/restaurants */
  getAll: () => api.get<Restaurant[]>('/restaurants'),

  /** GET /api/restaurants/:id */
  getById: (id: string) => api.get<Restaurant>(`/restaurants/${id}`),

  /** GET /api/restaurants?sectionId=:sectionId */
  getBySection: (sectionId: string) =>
    api.get<Restaurant[]>(`/restaurants?sectionId=${sectionId}`),

  /** POST /api/restaurants  — body: { name, sectionId, location: { longitude, latitude } } */
  create: (data: Omit<Restaurant, 'id'>) =>
    api.post<Restaurant>('/restaurants', data),

  /** PUT /api/restaurants/:id  — body: partial restaurant fields */
  update: (id: string, data: Partial<Restaurant>) =>
    api.put<Restaurant>(`/restaurants/${id}`, data),

  /** PATCH /api/restaurants/:id/move  — body: { sectionId } */
  move: (id: string, sectionId: string) =>
    api.patch<Restaurant>(`/restaurants/${id}/move`, { sectionId }),

  /** DELETE /api/restaurants/:id */
  delete: (id: string) => api.delete<void>(`/restaurants/${id}`),
};
