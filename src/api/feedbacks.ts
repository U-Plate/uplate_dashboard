import { Feedback, FeedbackType } from "../constants";
import { api } from "./client";
import { SCHOOL } from "../config";
import { getAdminKey } from "../utils/adminKey";

type ApiFeedback = {
  id: string;
  schoolId: string;
  type: FeedbackType;
  message: string;
  timestampString: string;
  email: string;
  handled?: boolean;
};

function fromApi(f: ApiFeedback): Feedback {
  return new Feedback({
    id: f.id,
    schoolId: f.schoolId ?? SCHOOL,
    type: f.type,
    message: f.message,
    timestampString: f.timestampString,
    email: f.email,
    handled: f.handled ?? false,
  });
}

export const feedbacksApi = {
  /** GET /:school/feedbacks */
  getAll: async (): Promise<Feedback[]> => {
    const data = await api.get<ApiFeedback[]>(
      `/${SCHOOL}/feedbacks?key=${getAdminKey()}`,
    );
    return data.map(fromApi);
  },

  /** POST /:school/admin/feedbacks/markHandled/:id */
  markHandled: async (id: string): Promise<Feedback> => {
    const data = await api.post<ApiFeedback>(
      `/${SCHOOL}/admin/feedbacks/markHandled/${id}?key=${getAdminKey()}`,
      {},
    );
    return fromApi(data);
  },

  /** POST /:school/admin/feedbacks/unmarkHandled/:id */
  unmarkHandled: async (id: string): Promise<Feedback> => {
    const data = await api.post<ApiFeedback>(
      `/${SCHOOL}/admin/feedbacks/unmarkHandled/${id}?key=${getAdminKey()}`,
      {},
    );
    return fromApi(data);
  },
};
