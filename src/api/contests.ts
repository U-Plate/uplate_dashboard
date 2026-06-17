import { Contest, ContestParticipant } from "../constants";
import { api } from "./client";
import { getAdminKey } from "../utils/adminKey";

function parseApiDateStringToLocal(s: string): Date {
  if (!s) return new Date(s);
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    const day = Number(m[3]);
    return new Date(year, month, day);
  }
  return new Date(s);
}

type ApiContest = Omit<Contest, "startDate" | "endDate"> & {
  startDate: string;
  endDate: string;

  // only returned for admin routes
};
type ApiContestParticipant = Omit<ContestParticipant, "dayJoined"> & {
  dayJoined: string;
};

function fromApi(r: ApiContest): Contest {
  const { startDate, endDate, id, ...rest } = r;
  return {
    ...rest,
    id: parseInt(id as unknown as string), // Ensure ID is a number
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  } as Contest;
}

export const contestsApi = {
  /** GET /:school/restaurants */
  getAll: async () => {
    const data = await api.get<ApiContest[]>(
      `/contests?key=${getAdminKey()}`,
    );

    return data.map(fromApi);
  },

  /** GET /:school/restaurants/:id */
  getById: async (id: number) => {
    const data = await api.get<ApiContest>(
      `/contests/${id}?key=${getAdminKey()}`,
    );
    return fromApi(data);
  },


  /** POST /:school/admin/restaurants/createRestaurant?key=... */
  create: async (data: Omit<Contest, "id">) => {
    const { startDate, endDate, ...rest } = data;
    const body = {
      ...rest,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    const created = await api.post<ApiContest>(
      `/contests/create?key=${getAdminKey()}`,
      body,
    );
    created.id = parseInt(created.id as unknown as string); // Ensure ID is a number
    return fromApi(created);
  },

  /** POST /:school/admin/restaurants/updateRestaurant/:id?key=... — body: partial fields */
  update: async (id: number, data: Partial<Contest>) => {
    const { startDate, endDate, ...rest } = data;
    const body = {
      ...rest,
      ...(startDate ? { startDate: startDate.toISOString() } : {}),
      ...(endDate ? { endDate: endDate.toISOString() } : {}),
    };
    const updated = await api.post<ApiContest>(
      `/contests/update/${id}?key=${getAdminKey()}`,
      body,
    );
    return fromApi(updated);
  },

  /** POST /:school/admin/restaurants/deleteRestaurant/:id */
  delete: (id: number) =>
    api.post<void>(
      `/contests/delete/${id}?key=${getAdminKey()}`,
      {},
    ),

  getParticipants: async (contestId: number) => {
    const data = await api.get<ApiContestParticipant[]>(
      `/contests/participants/${contestId}?key=${getAdminKey()}`,
    );
    return data.map((p) => ({
      ...p,
      
      dayJoined: parseApiDateStringToLocal(p.dayJoined),
    } as ContestParticipant));
  }
};
