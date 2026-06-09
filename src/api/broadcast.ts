import { api } from "./client";
import { SCHOOL } from "../config";
import { getAdminKey } from "../utils/adminKey";

export interface BroadcastResult {
  status?: boolean;
  /** Number of recipients the server reports, when available. */
  sent?: number;
}

export const broadcastApi = {
  /**
   * POST /:school/email/send?key=... — body: { subject, body, emails? }
   *
   * When `emails` is omitted (or empty), the email goes to every subscribed
   * user for the school. When provided, it is sent only to those addresses.
   */
  send: (subject: string, body: string, emails?: string[]) =>
    api.post<BroadcastResult>(
      `/${SCHOOL}/email/send?key=${getAdminKey()}`,
      {
        subject,
        body,
        ...(emails && emails.length ? { emails } : {}),
      },
    ),
};
