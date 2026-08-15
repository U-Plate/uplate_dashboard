import { InternApplication } from "../constants";
import { api } from "./client";
import { getAdminKey } from "../utils/adminKey";

type ApiInternApplication = {
  id: string;
  name: string;
  email: string;
  age: number;
  gradYear: number;
  whyThem: string;
  whatTheyWant: string;
  whyUplate: string;
  timestampString: string;
  reviewed?: boolean;
};

function fromApi(a: ApiInternApplication): InternApplication {
  return new InternApplication({
    id: a.id,
    name: a.name,
    email: a.email,
    age: a.age,
    gradYear: a.gradYear,
    whyThem: a.whyThem,
    whatTheyWant: a.whatTheyWant,
    whyUplate: a.whyUplate,
    timestampString: a.timestampString,
    reviewed: a.reviewed ?? false,
  });
}

export const internApplicationsApi = {
  /** GET /landing/internApplications */
  getAll: async (): Promise<InternApplication[]> => {
    const data = await api.get<ApiInternApplication[]>(
      `/landing/internApplications?key=${getAdminKey()}`,
    );
    return data.map(fromApi);
  },

  /** POST /landing/internApplications/markReviewed/:id */
  markReviewed: async (id: string): Promise<InternApplication> => {
    const data = await api.post<ApiInternApplication>(
      `/landing/internApplications/markReviewed/${id}?key=${getAdminKey()}`,
      {},
    );
    return fromApi(data);
  },

  /** POST /landing/internApplications/unmarkReviewed/:id */
  unmarkReviewed: async (id: string): Promise<InternApplication> => {
    const data = await api.post<ApiInternApplication>(
      `/landing/internApplications/unmarkReviewed/${id}?key=${getAdminKey()}`,
      {},
    );
    return fromApi(data);
  },
};
