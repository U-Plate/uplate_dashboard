import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { Food } from "../constants";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { generateId } from "../utils/idGenerator";
import { getSampleFoods } from "../utils/sampleData";
import { USE_API } from "../config";
import { foodsApi } from "../api/foods";

interface FoodContextType {
  foods: Food[];
  addFood: (food: Omit<Food, "id">) => void;
  addFoods: (foods: Omit<Food, "id">[]) => Promise<void>;
  updateFood: (id: string, updates: Partial<Food>) => void;
  deleteFood: (id: string) => void;
  getFoodById: (id: string) => Food | undefined;
  getFoodsByRestaurant: (restaurantId: string) => Food[];
  /** Fetch and cache foods for a restaurant. Returns the foods once loaded. */
  ensureFoodsLoaded: (restaurantId: string) => Promise<Food[]>;
}

const FoodContext = createContext<FoodContextType | undefined>(undefined);

const LocalFoodProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [foods, setFoods] = useLocalStorage<Food[]>(
    "uplate_foods",
    getSampleFoods(),
  );

  const addFood = (foodData: Omit<Food, "id">) => {
    const newFood = new Food({ id: generateId(), ...foodData });
    setFoods([...foods, newFood]);
  };

  const addFoods = async (foodsData: Omit<Food, "id">[]) => {
    const newFoods = foodsData.map((fd) => new Food({ id: generateId(), ...fd }));
    setFoods([...foods, ...newFoods]);
  };

  const updateFood = (id: string, updates: Partial<Food>) => {
    setFoods(
      foods.map((f) => (f.id === id ? new Food({ ...f, ...updates }) : f)),
    );
  };

  const deleteFood = (id: string) => {
    setFoods(foods.filter((f) => f.id !== id));
  };

  const getFoodById = (id: string) => foods.find((f) => f.id === id);

  const getFoodsByRestaurant = (restaurantId: string) =>
    foods.filter((f) => f.restaurantId === restaurantId);

  const ensureFoodsLoaded = async (restaurantId: string) =>
    foods.filter((f) => f.restaurantId === restaurantId);

  return (
    <FoodContext.Provider
      value={{
        foods,
        addFood,
        addFoods,
        updateFood,
        deleteFood,
        getFoodById,
        getFoodsByRestaurant,
        ensureFoodsLoaded,
      }}
    >
      {children}
    </FoodContext.Provider>
  );
};

const ApiFoodProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [foods, setFoods] = useState<Food[]>([]);
  const fetchedRestaurants = useRef<Set<string>>(new Set());
  const inFlightFetches = useRef<Map<string, Promise<Food[]>>>(new Map());

  const fetchFoodsForRestaurant = useCallback(async (restaurantId: string): Promise<Food[]> => {
    if (fetchedRestaurants.current.has(restaurantId)) {
      return foods.filter((f) => f.restaurantId === restaurantId);
    }
    // Deduplicate concurrent requests for the same restaurant
    const existing = inFlightFetches.current.get(restaurantId);
    if (existing) return existing;

    const promise = foodsApi.getByRestaurant(restaurantId).then((data) => {
      fetchedRestaurants.current.add(restaurantId);
      inFlightFetches.current.delete(restaurantId);
      setFoods((prev) => [
        ...prev.filter((f) => f.restaurantId !== restaurantId),
        ...data,
      ]);
      return data;
    });
    inFlightFetches.current.set(restaurantId, promise);
    return promise;
  }, [foods]);

  const addFood = async (foodData: Omit<Food, "id">) => {
    const { restaurantId, ...rest } = foodData;
    await foodsApi.create(restaurantId, rest);
    // Refetch so local state has the server-assigned ID, not the client-generated one.
    fetchedRestaurants.current.delete(restaurantId);
    await fetchFoodsForRestaurant(restaurantId);
  };

  const addFoods = async (foodsData: Omit<Food, "id">[]) => {
    if (foodsData.length === 0) return;
    const restaurantId = foodsData[0].restaurantId;
    await Promise.all(
      foodsData.map(({ restaurantId: rid, ...rest }) => foodsApi.create(rid, rest))
    );
    fetchedRestaurants.current.delete(restaurantId);
    await fetchFoodsForRestaurant(restaurantId);
  };

  const updateFood = async (id: string, updates: Partial<Food>) => {
    const existing = foods.find((f) => f.id === id);
    if (!existing) return;
    const updated = await foodsApi.update(existing.restaurantId, id, updates);
    setFoods((prev) => prev.map((f) => (f.id === id ? updated : f)));
  };

  const deleteFood = async (id: string) => {
    const existing = foods.find((f) => f.id === id);
    if (!existing) return;
    await foodsApi.delete(existing.restaurantId, id);
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  const getFoodById = (id: string) => foods.find((f) => f.id === id);

  const getFoodsByRestaurant = useCallback(
    (restaurantId: string) => {
      // Trigger a lazy fetch if this restaurant's foods haven't been loaded yet.
      // Deferred to avoid state updates during render.
      if (!fetchedRestaurants.current.has(restaurantId)) {
        setTimeout(() => fetchFoodsForRestaurant(restaurantId), 0);
      }
      return foods.filter((f) => f.restaurantId === restaurantId);
    },
    [foods, fetchFoodsForRestaurant],
  );

  const ensureFoodsLoaded = useCallback(
    (restaurantId: string) => fetchFoodsForRestaurant(restaurantId),
    [fetchFoodsForRestaurant],
  );

  return (
    <FoodContext.Provider
      value={{
        foods,
        addFood,
        addFoods,
        updateFood,
        deleteFood,
        getFoodById,
        getFoodsByRestaurant,
        ensureFoodsLoaded,
      }}
    >
      {children}
    </FoodContext.Provider>
  );
};

export const FoodProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return USE_API ? (
    <ApiFoodProvider>{children}</ApiFoodProvider>
  ) : (
    <LocalFoodProvider>{children}</LocalFoodProvider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFoods = (): FoodContextType => {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error("useFoods must be used within a FoodProvider");
  }
  return context;
};
