import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Restaurant } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateId } from '../utils/idGenerator';
import { getSampleRestaurants } from '../utils/sampleData';
import { USE_API } from '../config';
import { restaurantsApi } from '../api/restaurants';

interface RestaurantsContextType {
  restaurants: Restaurant[];
  addRestaurant: (restaurant: Omit<Restaurant, 'id'>) => void;
  updateRestaurant: (id: string, updates: Partial<Restaurant>) => void;
  deleteRestaurant: (id: string) => void;
  getRestaurantById: (id: string) => Restaurant | undefined;
  getRestaurantsBySection: (sectionId: string) => Restaurant[];
  moveRestaurantToSection: (restaurantId: string, newSectionId: string) => void;
}

const RestaurantsContext = createContext<RestaurantsContextType | undefined>(undefined);

const LocalRestaurantsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = useLocalStorage<Restaurant[]>(
    'uplate_restaurants',
    getSampleRestaurants()
  );

  const addRestaurant = (data: Omit<Restaurant, 'id'>) => {
    const newRestaurant = new Restaurant({ id: generateId(), ...data });
    setRestaurants([...restaurants, newRestaurant]);
  };

  const updateRestaurant = (id: string, updates: Partial<Restaurant>) => {
    setRestaurants(
      restaurants.map((r) =>
        r.id === id ? new Restaurant({ ...r, ...updates }) : r
      )
    );
  };

  const deleteRestaurant = (id: string) => {
    setRestaurants(restaurants.filter((r) => r.id !== id));
  };

  const getRestaurantById = (id: string) => restaurants.find((r) => r.id === id);

  const getRestaurantsBySection = (sectionId: string) =>
    restaurants.filter((r) => r.sectionId === sectionId);

  const moveRestaurantToSection = (restaurantId: string, newSectionId: string) => {
    updateRestaurant(restaurantId, { sectionId: newSectionId });
  };

  return (
    <RestaurantsContext.Provider
      value={{
        restaurants,
        addRestaurant,
        updateRestaurant,
        deleteRestaurant,
        getRestaurantById,
        getRestaurantsBySection,
        moveRestaurantToSection,
      }}
    >
      {children}
    </RestaurantsContext.Provider>
  );
};

const ApiRestaurantsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  const fetchRestaurants = useCallback(async () => {
    const data = await restaurantsApi.getAll();
    setRestaurants(data);
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const addRestaurant = async (data: Omit<Restaurant, 'id'>) => {
    const created = await restaurantsApi.create(data);
    setRestaurants((prev) => [...prev, created]);
  };

  const updateRestaurant = async (id: string, updates: Partial<Restaurant>) => {
    const updated = await restaurantsApi.update(id, updates);
    setRestaurants((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const deleteRestaurant = async (id: string) => {
    await restaurantsApi.delete(id);
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
  };

  const getRestaurantById = (id: string) => restaurants.find((r) => r.id === id);

  const getRestaurantsBySection = (sectionId: string) =>
    restaurants.filter((r) => r.sectionId === sectionId);

  const moveRestaurantToSection = async (restaurantId: string, newSectionId: string) => {
    const updated = await restaurantsApi.move(restaurantId, newSectionId);
    setRestaurants((prev) => prev.map((r) => (r.id === restaurantId ? updated : r)));
  };

  return (
    <RestaurantsContext.Provider
      value={{
        restaurants,
        addRestaurant,
        updateRestaurant,
        deleteRestaurant,
        getRestaurantById,
        getRestaurantsBySection,
        moveRestaurantToSection,
      }}
    >
      {children}
    </RestaurantsContext.Provider>
  );
};

export const RestaurantsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return USE_API ? (
    <ApiRestaurantsProvider>{children}</ApiRestaurantsProvider>
  ) : (
    <LocalRestaurantsProvider>{children}</LocalRestaurantsProvider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRestaurants = (): RestaurantsContextType => {
  const context = useContext(RestaurantsContext);
  if (!context) {
    throw new Error('useRestaurants must be used within a RestaurantsProvider');
  }
  return context;
};
