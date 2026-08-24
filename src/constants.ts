export class Location {
    address?: string;
    latitude?: number;
    longitude?: number;

    constructor({ address, latitude, longitude }: { address?: string; latitude?: number; longitude?: number }) {
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}

export type ContestType = 'marketing' | 'referral';

export class Contest {
    id: number;
    title: string;
    startDate: Date;
    endDate: Date;
    description: string;
    type: ContestType;

    constructor({ id, title, startDate, endDate, description, type }: Omit<Contest, 'type'> & { type?: ContestType }) {
        this.id = id;
        this.title = title;
        this.startDate = startDate;
        this.endDate = endDate;
        this.description = description;
        this.type = type ?? 'marketing';
    }
}

export class ContestParticipant {
    contestId: number;
    id: number;
    contestantEmail: string;
    daysUsedApp: number;
    dayJoined: Date;
    school: string;
    joinState: 'JustWebsite' | 'DownloadedApp';
    referredByEmail: string | null;

    constructor({ id, contestantEmail, daysUsedApp, dayJoined, school, contestId, joinState, referredByEmail}: Omit<ContestParticipant, 'referredByEmail'> & { referredByEmail?: string | null }) {
        this.id = id;
        this.contestantEmail = contestantEmail;
        this.daysUsedApp = daysUsedApp;
        this.dayJoined = dayJoined;
        this.school = school;
        this.contestId = contestId;
        this.joinState = joinState;
        this.referredByEmail = referredByEmail ?? null;
    }
}

export class ContestReferrer {
    id?: string;
    contestId: number;
    email: string;
    name: string;
    instagramHandle: string | null;
    createdAt: Date;
    referralCount: number;

    constructor({ contestId, email, name, instagramHandle, createdAt, referralCount }: Omit<ContestReferrer, 'id'>) {
        this.id = email;
        this.contestId = contestId;
        this.email = email;
        this.name = name;
        this.instagramHandle = instagramHandle ?? null;
        this.createdAt = createdAt;
        this.referralCount = referralCount;
    }
}


export class Restaurant {
    id: string;
    name: string;
    location: Location;
    sectionId: string;
    hidden: boolean;
    /**
     * Public CDN url of the restaurant's logo, or null when it has none. Set by
     * uploading an image (`restaurantsApi.uploadLogo`), never typed in — the
     * backend owns the key it's stored under. Carries a `?v=` stamp so a
     * replaced logo isn't served from cache.
     */
    logo: string | null;

    constructor({ id, name, location, sectionId, hidden, logo }: Omit<Restaurant, 'logo'> & { logo?: string | null }) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.sectionId = sectionId;
        this.hidden = hidden ?? false;
        this.logo = logo ?? null;
    }

}

export class Section {
    id: string
    name: string;

    constructor({ id, name }: Section) {
        this.id = id;
        this.name = name;
    }
}

export class Food {
    name: string;
    id: string;
    restaurantId: string;
    quantity: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    ingredients: string;
    servingSize: string;
    saturatedFat: number;
    addedSugars: number;
    sodium: number;
    dietaryFiber: number;
    cholesterol: number;
    caloriesFromFat: number;
    calcium: number;
    iron: number;
    labels: string[];

    constructor({
        name,
        id,
        restaurantId,
        quantity,
        calories,
        protein,
        carbs,
        fat,
        sugar,
        ingredients,
        servingSize,
        saturatedFat,
        addedSugars,
        sodium,
        dietaryFiber,
        cholesterol,
        caloriesFromFat,
        calcium,
        iron,
        labels,
    }: Food) {
        this.name = name;
        this.id = id;
        this.quantity = quantity;
        this.calories = calories;
        this.protein = protein;
        this.carbs = carbs;
        this.fat = fat;
        this.sugar = sugar;
        this.ingredients = ingredients;
        this.servingSize = servingSize;
        this.saturatedFat = saturatedFat;
        this.addedSugars = addedSugars;
        this.sodium = sodium;
        this.dietaryFiber = dietaryFiber;
        this.cholesterol = cholesterol;
        this.caloriesFromFat = caloriesFromFat;
        this.calcium = calcium;
        this.iron = iron;
        this.restaurantId = restaurantId;
        this.labels = typeof labels === 'string' ? JSON.parse(labels) : (labels ?? []);
    }
}

export interface MenuItemFood {
    food: Food;
    quantity: number;
}

export interface MenuItemSize {
    name: string;
    foods: MenuItemFood[];
    possibleFoods: MenuItemFood[];
}

export class MenuItem {
    id: string;
    name: string;
    restaurantId: string;
    foods: MenuItemFood[];
    possibleFoods: MenuItemFood[];
    sizes: MenuItemSize[];

    constructor({ id, name, restaurantId, foods, possibleFoods, sizes }: MenuItem) {
        this.id = id;
        this.name = name;
        this.restaurantId = restaurantId;
        this.foods = foods;
        this.possibleFoods = possibleFoods ?? [];
        this.sizes = sizes ?? [];
    }
}

export const FeedbackType = {
    Bug: "Bug",
    Suggestion: "Suggestion",
    Other: "Other",
    Compliment: "Compliment",
    Question: "Question",
} as const;
export type FeedbackType = typeof FeedbackType[keyof typeof FeedbackType];

export class Feedback {
    id: string;
    schoolId: string;
    type: FeedbackType;
    message: string;
    timestampString: string;
    email: string;
    handled: boolean;
    deviceInfo: string | null;

    constructor({ id, schoolId, type, message, timestampString, email, handled, deviceInfo }: Feedback) {
        this.id = id;
        this.schoolId = schoolId;
        this.type = type;
        this.message = message;
        this.timestampString = timestampString;
        this.email = email;
        this.handled = handled ?? false;
        this.deviceInfo = deviceInfo ?? null;
    }
}

/**
 * "Why did you switch to UPlate" onboarding survey, submitted in-app by a
 * signed-in user. Every field but `id`/`schoolId`/`userId`/`timestampString`
 * is optional — the survey has no required questions.
 */
export class SwitcherSurveyResponse {
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
    reviewed: boolean;
    timestampString: string;

    constructor({
        id,
        schoolId,
        userId,
        email,
        howHeard,
        howHeardOther,
        whySwitched,
        likeBest,
        dislike,
        wishFeature,
        willingToInterview,
        appLaunches,
        macroTrackingEnabled,
        foodItemsLoggedCount,
        foodsRatedCount,
        reviewed,
        timestampString,
    }: SwitcherSurveyResponse) {
        this.id = id;
        this.schoolId = schoolId;
        this.userId = userId;
        this.email = email ?? null;
        this.howHeard = howHeard ?? null;
        this.howHeardOther = howHeardOther ?? null;
        this.whySwitched = whySwitched ?? null;
        this.likeBest = likeBest ?? null;
        this.dislike = dislike ?? null;
        this.wishFeature = wishFeature ?? null;
        this.willingToInterview = willingToInterview ?? false;
        this.appLaunches = appLaunches ?? null;
        this.macroTrackingEnabled = macroTrackingEnabled ?? null;
        this.foodItemsLoggedCount = foodItemsLoggedCount ?? null;
        this.foodsRatedCount = foodsRatedCount ?? null;
        this.reviewed = reviewed ?? false;
        this.timestampString = timestampString;
    }
}

/**
 * Lifecycle of a crowdsourced food photo. `Pending` is the review queue;
 * `Replaced` is an approved photo that a later approval superseded; `Removed`
 * is an approved photo an admin pulled with no replacement queued — kept so
 * the history of a food's photo reads straight rather than vanishing.
 */
export const FoodPhotoStatus = {
    Pending: "pending",
    Approved: "approved",
    Denied: "denied",
    Replaced: "replaced",
    Removed: "removed",
} as const;
export type FoodPhotoStatus = typeof FoodPhotoStatus[keyof typeof FoodPhotoStatus];

/** One photo a student submitted for a dining hall food. */
export class FoodPhoto {
    id: string;
    schoolId: string;
    foodId: string;
    /** Null when the food has left the menu — still reviewable. */
    foodName: string | null;
    url: string;
    submittedBy: string | null;
    /** Epoch millis. */
    submittedAt: number;
    status: FoodPhotoStatus;
    reviewedAt: number | null;
    /** The photo approving this one would overwrite, if the food has one. */
    currentApprovedUrl: string | null;

    constructor({
        id,
        schoolId,
        foodId,
        foodName,
        url,
        submittedBy,
        submittedAt,
        status,
        reviewedAt,
        currentApprovedUrl,
    }: FoodPhoto) {
        this.id = id;
        this.schoolId = schoolId;
        this.foodId = foodId;
        this.foodName = foodName ?? null;
        this.url = url;
        this.submittedBy = submittedBy ?? null;
        this.submittedAt = submittedAt;
        this.status = status ?? FoodPhotoStatus.Pending;
        this.reviewedAt = reviewedAt ?? null;
        this.currentApprovedUrl = currentApprovedUrl ?? null;
    }
}

export class InternApplication {
    id: string;
    name: string;
    email: string;
    age: number;
    gradYear: number;
    whyThem: string;
    whatTheyWant: string;
    whyUplate: string;
    timestampString: string;
    reviewed: boolean;

    constructor({
        id,
        name,
        email,
        age,
        gradYear,
        whyThem,
        whatTheyWant,
        whyUplate,
        timestampString,
        reviewed,
    }: InternApplication) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.age = age;
        this.gradYear = gradYear;
        this.whyThem = whyThem;
        this.whatTheyWant = whatTheyWant;
        this.whyUplate = whyUplate;
        this.timestampString = timestampString;
        this.reviewed = reviewed ?? false;
    }
}
