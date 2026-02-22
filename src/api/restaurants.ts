import { Restaurant, Location } from "../constants";
import { api } from "./client";
import { SCHOOL, ADMIN_KEY } from "../config";

// The API uses 'section' for sectionId.
type ApiLocation = { longitude?: number; latitude?: number; address?: string };
type ApiRestaurant = Omit<Restaurant, "sectionId" | "location"> & {
  section: string;
  location: ApiLocation;
};

function fromApi(r: ApiRestaurant): Restaurant {
  const { section, location, ...rest } = r;
  return {
    ...rest,
    sectionId: section,
    location: new Location({
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    }),
  } as Restaurant;
}

function toApiLocation(loc: Location): ApiLocation {
  if (loc.latitude != null && loc.longitude != null) {
    return { latitude: loc.latitude, longitude: loc.longitude };
  }
  return { address: loc.address };
}

export const restaurantsApi = {
  /** GET /:school/restaurants */
  getAll: async () => {
    const data = await api.get<ApiRestaurant[]>(`/${SCHOOL}/restaurants`);
    return data.map(fromApi);
  },

  /** GET /:school/restaurants/:id */
  getById: async (id: string) => {
    const data = await api.get<ApiRestaurant>(`/${SCHOOL}/restaurants/${id}`);
    return fromApi(data);
  },

  /** GET /:school/restaurants?sectionId=:sectionId */
  getBySection: async (sectionId: string) => {
    const data = await api.get<ApiRestaurant[]>(
      `/${SCHOOL}/restaurants?sectionId=${sectionId}`,
    );
    return data.map(fromApi);
  },

  /** POST /:school/admin/restaurants/createRestaurant?key=... */
  create: async (data: Omit<Restaurant, "id">) => {
    const created = await api.post<ApiRestaurant>(
      `/${SCHOOL}/admin/restaurants/createRestaurant?key=${ADMIN_KEY}`,
      {
        name: data.name,
        section: data.sectionId,
        location: toApiLocation(data.location),
      },
    );
    return fromApi(created);
  },

  /** POST /:school/admin/restaurants/:id?key=... — body: partial fields */
  update: async (id: string, data: Partial<Restaurant>) => {
    const { sectionId, location, ...rest } = data;
    const body = {
      ...rest,
      ...(sectionId ? { section: sectionId } : {}),
      ...(location ? { location: toApiLocation(location) } : {}),
    };
    const updated = await api.post<ApiRestaurant>(
      `/${SCHOOL}/admin/restaurants/${id}?key=${ADMIN_KEY}`,
      body,
    );
    return fromApi(updated);
  },

  /** POST /:school/admin/restaurants/move/:id?key=... — body: { toSection } */
  move: async (id: string, sectionId: string) => {
    const updated = await api.post<ApiRestaurant>(
      `/${SCHOOL}/admin/restaurants/move/${id}?key=${ADMIN_KEY}`,
      { toSection: sectionId },
    );
    return fromApi(updated);
  },

  /** POST /:school/admin/restaurants/deleteRestaurant/:id */
  delete: (id: string) =>
    api.post<void>(
      `/${SCHOOL}/admin/restaurants/deleteRestaurant/${id}?key=${ADMIN_KEY}`,
      {},
    ),
};
