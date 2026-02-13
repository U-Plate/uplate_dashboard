import { Section } from '../constants';
import { api } from './client';

export const sectionsApi = {
  /** GET /api/sections */
  getAll: () => api.get<Section[]>('/sections'),

  /** GET /api/sections/:id */
  getById: (id: string) => api.get<Section>(`/sections/${id}`),

  /** POST /api/sections  — body: { name } */
  create: (data: Omit<Section, 'id'>) => api.post<Section>('/sections', data),

  /** PUT /api/sections/:id  — body: { name } */
  update: (id: string, data: Partial<Section>) =>
    api.put<Section>(`/sections/${id}`, data),

  /** DELETE /api/sections/:id */
  delete: (id: string) => api.delete<void>(`/sections/${id}`),
};
