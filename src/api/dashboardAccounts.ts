/**
 * Admin API for the restaurant *advertising dashboard* tenant accounts.
 *
 * These live on the worker's self-contained `/dashboard/*` mount (the
 * dash_restaurants / dash_access_codes tables) — separate from the consumer
 * `restaurants` API used elsewhere in this dashboard. The endpoints are guarded
 * by `Authorization: Bearer <ADMIN_API_KEY>`; we reuse the admin key the user
 * already stores (the same value must be the worker's ADMIN_API_KEY).
 */
import { API_BASE_URL } from "../config";
import { getAdminKey } from "../utils/adminKey";

const BASE = `${API_BASE_URL}/dashboard/admin`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAdminKey()}`,
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    // The dashboard API returns { error: { code, message } }.
    const body = await res.json().catch(() => null);
    const message =
      body?.error?.message ??
      `Dashboard admin ${options?.method ?? "GET"} ${path} failed (${res.status})`;
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export type AccessCodeStatus = "active" | "consumed" | "revoked" | "expired";

export interface DashAccessCode {
  code: string;
  createdAt: string;
  expiresAt: string | null;
  consumedAt: string | null;
  consumedByUid: string | null;
  revokedAt: string | null;
  status: AccessCodeStatus;
}

export interface DashRestaurantAccount {
  id: string;
  schoolId: string;
  name: string | null;
  contactEmail: string | null;
  iconUrl: string | null;
  createdAt: string;
  disabledAt: string | null;
  userCount: number;
  codeCount: number;
  activeCodeCount: number;
  /** True once a restaurant has redeemed a code (bound a user). */
  activated: boolean;
  /** ISO timestamp of first activation, or null if never activated. */
  activatedAt: string | null;
}

export const dashboardAccountsApi = {
  /** GET /admin/restaurants[?schoolId=] */
  listRestaurants: async (schoolId?: string): Promise<DashRestaurantAccount[]> => {
    const qs = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : "";
    const data = await request<{ restaurants: DashRestaurantAccount[] }>(`/restaurants${qs}`);
    return data.restaurants;
  },

  /** POST /admin/restaurants */
  createRestaurant: async (input: {
    schoolId: string;
    name?: string;
    contactEmail?: string;
  }): Promise<void> => {
    await request<{ restaurant: unknown }>(`/restaurants`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  /** POST /admin/restaurants/:id/status — disable or re-enable an account. */
  setStatus: async (id: string, disabled: boolean): Promise<{ id: string; disabledAt: string | null }> =>
    request(`/restaurants/${encodeURIComponent(id)}/status`, {
      method: "POST",
      body: JSON.stringify({ disabled }),
    }),

  /** GET /admin/restaurants/:id/access-codes */
  listAccessCodes: async (id: string): Promise<DashAccessCode[]> => {
    const data = await request<{ codes: DashAccessCode[] }>(
      `/restaurants/${encodeURIComponent(id)}/access-codes`,
    );
    return data.codes;
  },

  /** POST /admin/access-codes — mint a single-use code for a restaurant. */
  createAccessCode: async (
    restaurantId: string,
    expiresAt?: string,
  ): Promise<{ code: string }> =>
    request(`/access-codes`, {
      method: "POST",
      body: JSON.stringify({ restaurantId, ...(expiresAt ? { expiresAt } : {}) }),
    }),

  /** POST /admin/access-codes/:code/revoke */
  revokeAccessCode: async (code: string): Promise<{ code: string; revokedAt: string }> =>
    request(`/access-codes/${encodeURIComponent(code)}/revoke`, { method: "POST" }),
};
