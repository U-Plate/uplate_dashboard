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

    constructor({ id, name, location, sectionId, hidden }: Restaurant) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.sectionId = sectionId;
        this.hidden = hidden ?? false;
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

    constructor({ id, schoolId, type, message, timestampString, email, handled }: Feedback) {
        this.id = id;
        this.schoolId = schoolId;
        this.type = type;
        this.message = message;
        this.timestampString = timestampString;
        this.email = email;
        this.handled = handled ?? false;
    }
}
