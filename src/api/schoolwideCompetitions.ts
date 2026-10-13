import type {
  SchoolwideCompetition,
  SchoolwideCompetitionParticipant,
} from '../constants';
import { SCHOOL } from '../config';
import { getAdminKey } from '../utils/adminKey';
import { api } from './client';

interface ListResponse {
  status: boolean;
  competitions: SchoolwideCompetition[];
}

interface DetailResponse {
  status: boolean;
  competition: SchoolwideCompetition;
  participants: SchoolwideCompetitionParticipant[];
}

interface MutationResponse {
  status: boolean;
  competition: SchoolwideCompetition;
}

const path = (action: string, query = '') =>
  `/${SCHOOL}/competitions/${action}?key=${encodeURIComponent(getAdminKey())}${query}`;

export const schoolwideCompetitionsApi = {
  async getAll() {
    const response = await api.get<ListResponse>(path('adminListSchoolwide'));
    return response.competitions;
  },

  async get(id: string) {
    return api.get<DetailResponse>(
      path('adminGetSchoolwide', `&competitionID=${encodeURIComponent(id)}`),
    );
  },

  async create(input: {
    name: string;
    prize: string;
    joinDate: number;
    startDate: number;
    endDate: number;
  }) {
    const response = await api.post<MutationResponse>(
      path('adminCreateSchoolwide'),
      input,
    );
    return response.competition;
  },

  async update(id: string, input: {
    name: string;
    prize: string;
    joinDate: number;
    startDate: number;
    endDate: number;
  }) {
    const response = await api.post<MutationResponse>(
      path('adminUpdateSchoolwide', `&competitionID=${encodeURIComponent(id)}`),
      input,
    );
    return response.competition;
  },

  async uploadLogo(id: string, file: File) {
    const response = await api.upload<MutationResponse>(
      path('adminUploadSchoolwideLogo', `&competitionID=${encodeURIComponent(id)}`),
      file,
    );
    return response.competition;
  },

  async deleteLogo(id: string) {
    const response = await api.post<MutationResponse>(
      path('adminDeleteSchoolwideLogo', `&competitionID=${encodeURIComponent(id)}`),
      {},
    );
    return response.competition;
  },

  notify(id: string, username: string, title: string, body: string) {
    return api.post<{ status: boolean }>(
      path(
        'adminNotifySchoolwide',
        `&competitionID=${encodeURIComponent(id)}&username=${encodeURIComponent(username)}`,
      ),
      { title, body },
    );
  },
};
