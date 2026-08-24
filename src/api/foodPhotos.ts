import { FoodPhoto, FoodPhotoStatus } from "../constants";
import { api } from "./client";
import { SCHOOL } from "../config";
import { getAdminKey } from "../utils/adminKey";

type ApiFoodPhoto = {
  id: string;
  schoolId: string;
  foodId: string;
  foodName: string | null;
  url: string;
  submittedBy: string | null;
  submittedAt: number;
  status: FoodPhotoStatus;
  reviewedAt: number | null;
  currentApprovedUrl: string | null;
};

function fromApi(p: ApiFoodPhoto): FoodPhoto {
  return new FoodPhoto({
    id: p.id,
    schoolId: p.schoolId ?? SCHOOL,
    foodId: p.foodId,
    foodName: p.foodName ?? null,
    url: p.url,
    submittedBy: p.submittedBy ?? null,
    submittedAt: p.submittedAt,
    status: p.status ?? FoodPhotoStatus.Pending,
    reviewedAt: p.reviewedAt ?? null,
    currentApprovedUrl: p.currentApprovedUrl ?? null,
  });
}

/** `'all'` fetches every status; anything else fetches that one status. */
export type FoodPhotoQuery = FoodPhotoStatus | "all";

export const foodPhotosApi = {
  /** GET /:school/admin/foodPhotos?status=... */
  getAll: async (status: FoodPhotoQuery = "all"): Promise<FoodPhoto[]> => {
    const data = await api.get<ApiFoodPhoto[]>(
      `/${SCHOOL}/admin/foodPhotos?status=${status}&key=${getAdminKey()}`,
    );
    return data.map(fromApi);
  },

  /** POST /:school/admin/foodPhotos/approve/:id */
  approve: async (id: string): Promise<FoodPhoto> => {
    const data = await api.post<ApiFoodPhoto>(
      `/${SCHOOL}/admin/foodPhotos/approve/${id}?key=${getAdminKey()}`,
      {},
    );
    return fromApi(data);
  },

  /** POST /:school/admin/foodPhotos/deny/:id — permanently deletes the image. */
  deny: async (id: string): Promise<FoodPhoto> => {
    const data = await api.post<ApiFoodPhoto>(
      `/${SCHOOL}/admin/foodPhotos/deny/${id}?key=${getAdminKey()}`,
      {},
    );
    return fromApi(data);
  },

  /**
   * POST /:school/admin/foodPhotos/remove/:id — pulls a live (approved) photo
   * off the app and deletes the image. Only valid on an approved photo.
   */
  remove: async (id: string): Promise<FoodPhoto> => {
    const data = await api.post<ApiFoodPhoto>(
      `/${SCHOOL}/admin/foodPhotos/remove/${id}?key=${getAdminKey()}`,
      {},
    );
    return fromApi(data);
  },
};
