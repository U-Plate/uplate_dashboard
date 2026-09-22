import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Restaurant } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateId } from '../utils/idGenerator';
import { getSampleRestaurants } from '../utils/sampleData';
import { USE_API } from '../config';
import { restaurantsApi } from '../api/restaurants';

interface RestaurantsContextType {
  restaurants: Restaurant[];
  /**
   * Returns the created restaurant, whose server-assigned id a logo upload
   * needs — which is also why `logo` isn't part of the input: there's no id to
   * store an image against until this resolves
   */
  addRestaurant: (restaurant: Omit<Restaurant, 'id' | 'logo'>) => Promise<Restaurant>;
  updateRestaurant: (id: string, updates: Partial<Restaurant>) => void | Promise<void>;
  deleteRestaurant: (id: string) => void | Promise<void>;
  getRestaurantById: (id: string) => Restaurant | undefined;
  getRestaurantsBySection: (sectionId: string) => Restaurant[];
  moveRestaurantToSection: (restaurantId: string, newSectionId: string) => void | Promise<void>;
  /** Publishes `file` as the restaurant's logo, replacing any existing one. */
  uploadRestaurantLogo: (id: string, file: File) => Promise<void>;
  /** Removes the restaurant's logo. The image is deleted, not just unlinked. */
  removeRestaurantLogo: (id: string) => Promise<void>;
}

const RestaurantsContext = createContext<RestaurantsContextType | undefined>(undefined);

/** Only used by the no-API sample mode — see `uploadRestaurantLogo` there. */
const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const LocalRestaurantsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = useLocalStorage<Restaurant[]>(
    'uplate_restaurants',
    getSampleRestaurants()
  );

  const addRestaurant = async (data: Omit<Restaurant, 'id' | 'logo'>) => {
    const newRestaurant = new Restaurant({ id: generateId().toString(), ...data });
    setRestaurants([...restaurants, newRestaurant]);
    return newRestaurant;
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

  // No bucket to upload to without the API, so the logo is inlined as a data
  // URL. That keeps sample mode a faithful preview of the real layout — it just
  // lives in localStorage instead of on the CDN.
  const uploadRestaurantLogo = async (id: string, file: File) => {
    const dataUrl = await readAsDataUrl(file);
    updateRestaurant(id, { logo: dataUrl });
  };

  const removeRestaurantLogo = async (id: string) => {
    updateRestaurant(id, { logo: null });
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
        uploadRestaurantLogo,
        removeRestaurantLogo,
      }}
    >
      {children}
    </RestaurantsContext.Provider>
  );
};

const ApiRestaurantsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    restaurantsApi.getAll().then(setRestaurants);
  }, []);

  const addRestaurant = async (data: Omit<Restaurant, 'id' | 'logo'>) => {
    const created = await restaurantsApi.create(data);
    setRestaurants((prev) => [...prev, created]);
    return created;
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

  const uploadRestaurantLogo = async (id: string, file: File) => {
    const updated = await restaurantsApi.uploadLogo(id, file);
    setRestaurants((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const removeRestaurantLogo = async (id: string) => {
    const updated = await restaurantsApi.deleteLogo(id);
    setRestaurants((prev) => prev.map((r) => (r.id === id ? updated : r)));
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
        uploadRestaurantLogo,
        removeRestaurantLogo,
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
