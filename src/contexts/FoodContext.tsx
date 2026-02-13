import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Food } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateId } from '../utils/idGenerator';
import { getSampleFoods } from '../utils/sampleData';
import { USE_API } from '../config';
import { foodsApi } from '../api/foods';

interface FoodContextType {
  foods: Food[];
  addFood: (food: Omit<Food, 'id'>) => void;
  updateFood: (id: string, updates: Partial<Food>) => void;
  deleteFood: (id: string) => void;
  getFoodById: (id: string) => Food | undefined;
  getFoodsByRestaurant: (restaurantId: string) => Food[];
}

const FoodContext = createContext<FoodContextType | undefined>(undefined);

const LocalFoodProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [foods, setFoods] = useLocalStorage<Food[]>('uplate_foods', getSampleFoods());

  const addFood = (foodData: Omit<Food, 'id'>) => {
    const newFood = new Food({ id: generateId(), ...foodData });
    setFoods([...foods, newFood]);
  };

  const updateFood = (id: string, updates: Partial<Food>) => {
    setFoods(foods.map((f) => (f.id === id ? new Food({ ...f, ...updates }) : f)));
  };

  const deleteFood = (id: string) => {
    setFoods(foods.filter((f) => f.id !== id));
  };

  const getFoodById = (id: string) => foods.find((f) => f.id === id);

  const getFoodsByRestaurant = (restaurantId: string) =>
    foods.filter((f) => f.restaurantId === restaurantId);

  return (
    <FoodContext.Provider
      value={{ foods, addFood, updateFood, deleteFood, getFoodById, getFoodsByRestaurant }}
    >
      {children}
    </FoodContext.Provider>
  );
};

const ApiFoodProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [foods, setFoods] = useState<Food[]>([]);

  const fetchFoods = useCallback(async () => {
    const data = await foodsApi.getAll();
    setFoods(data);
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const addFood = async (foodData: Omit<Food, 'id'>) => {
    const created = await foodsApi.create(foodData);
    setFoods((prev) => [...prev, created]);
  };

  const updateFood = async (id: string, updates: Partial<Food>) => {
    const updated = await foodsApi.update(id, updates);
    setFoods((prev) => prev.map((f) => (f.id === id ? updated : f)));
  };

  const deleteFood = async (id: string) => {
    await foodsApi.delete(id);
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  const getFoodById = (id: string) => foods.find((f) => f.id === id);

  const getFoodsByRestaurant = (restaurantId: string) =>
    foods.filter((f) => f.restaurantId === restaurantId);

  return (
    <FoodContext.Provider
      value={{ foods, addFood, updateFood, deleteFood, getFoodById, getFoodsByRestaurant }}
    >
      {children}
    </FoodContext.Provider>
  );
};

export const FoodProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return USE_API ? (
    <ApiFoodProvider>{children}</ApiFoodProvider>
  ) : (
    <LocalFoodProvider>{children}</LocalFoodProvider>
  );
};

export const useFoods = (): FoodContextType => {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error('useFoods must be used within a FoodProvider');
  }
  return context;
};
