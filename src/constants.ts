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

export class Restaurant {
    id: string;
    name: string;
    location: Location;
    sectionId: string;

    constructor({ id, name, location, sectionId }: Restaurant) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.sectionId = sectionId;
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