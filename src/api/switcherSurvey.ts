import { SwitcherSurveyResponse } from "../constants";
import { api } from "./client";
import { SCHOOL } from "../config";
import { getAdminKey } from "../utils/adminKey";

type ApiSwitcherSurvey = {
  id: string;
  schoolId: string;
  userId: string;
  email: string | null;
  howHeard: string | null;
  howHeardOther: string | null;
  whySwitched: string | null;
  likeBest: string | null;
  dislike: string | null;
  wishFeature: string | null;
  willingToInterview: boolean;
  appLaunches: number | null;
  macroTrackingEnabled: boolean | null;
  foodItemsLoggedCount: number | null;
  foodsRatedCount: number | null;
  reviewed?: boolean;
  timestampString: string;
};

function fromApi(s: ApiSwitcherSurvey): SwitcherSurveyResponse {
  return new SwitcherSurveyResponse({
    id: s.id,
    schoolId: s.schoolId ?? SCHOOL,
    userId: s.userId,
    email: s.email,
    howHeard: s.howHeard,
    howHeardOther: s.howHeardOther,
    whySwitched: s.whySwitched,
    likeBest: s.likeBest,
    dislike: s.dislike,
    wishFeature: s.wishFeature,
    willingToInterview: s.willingToInterview,
    appLaunches: s.appLaunches,
    macroTrackingEnabled: s.macroTrackingEnabled,
    foodItemsLoggedCount: s.foodItemsLoggedCount,
    foodsRatedCount: s.foodsRatedCount,
    reviewed: s.reviewed ?? false,
    timestampString: s.timestampString,
  });
}

export const switcherSurveyApi = {
  /** GET /:school/switcherSurveys */
  getAll: async (): Promise<SwitcherSurveyResponse[]> => {
    const data = await api.get<ApiSwitcherSurvey[]>(
      `/${SCHOOL}/switcherSurveys?key=${getAdminKey()}`,
    );
    return data.map(fromApi);
  },

  /** POST /:school/admin/switcherSurveys/markReviewed/:id */
  markReviewed: async (id: string): Promise<SwitcherSurveyResponse> => {
    const data = await api.post<ApiSwitcherSurvey>(
      `/${SCHOOL}/admin/switcherSurveys/markReviewed/${id}?key=${getAdminKey()}`,
      {},
    );
    return fromApi(data);
  },

  /** POST /:school/admin/switcherSurveys/unmarkReviewed/:id */
  unmarkReviewed: async (id: string): Promise<SwitcherSurveyResponse> => {
    const data = await api.post<ApiSwitcherSurvey>(
      `/${SCHOOL}/admin/switcherSurveys/unmarkReviewed/${id}?key=${getAdminKey()}`,
      {},
    );
    return fromApi(data);
  },
};
