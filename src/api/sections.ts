import { Section } from '../constants';
import { api } from './client';
import { SCHOOL } from '../config';
import { getAdminKey } from '../utils/adminKey';

export const sectionsApi = {
  /** GET /:school/sections */
  getAll: () => api.get<Section[]>(`/${SCHOOL}/sections`),

  /** GET /:school/sections/:id */
  getById: (id: string) => api.get<Section>(`/${SCHOOL}/sections/${id}`),

  /** POST /:school/admin/sections/addSection?key=... — body: { name } */
  create: (data: Omit<Section, 'id'>) =>
    api.post<Section>(
      `/${SCHOOL}/admin/sections/addSection?key=${getAdminKey()}`,
      { name: data.name }
    ),

  /** POST /:school/admin/sections/updateSection?key=... — body: { id, name } */
  update: (id: string, data: Partial<Section>) =>
    api.post<Section>(
      `/${SCHOOL}/admin/sections/updateSection?key=${getAdminKey()}`,
      { id, name: data.name }
    ),

  /** POST /:school/admin/sections/deleteSection?key=... — body: { id } */
  delete: (id: string) =>
    api.post<{ status: boolean }>(
      `/${SCHOOL}/admin/sections/deleteSection?key=${getAdminKey()}`,
      { id }
    ),
};
