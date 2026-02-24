import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { MenuItem } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateId } from '../utils/idGenerator';
import { getSampleMenuItems } from '../utils/sampleData';
import { USE_API } from '../config';
import { menuItemsApi } from '../api/menuItems';

interface MenuItemsContextType {
  menuItems: MenuItem[];
  addMenuItem: (menuItem: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  getMenuItemById: (id: string) => MenuItem | undefined;
  getMenuItemsByRestaurant: (restaurantId: string) => MenuItem[];
}

const MenuItemsContext = createContext<MenuItemsContextType | undefined>(undefined);

const LocalMenuItemsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useLocalStorage<MenuItem[]>(
    'uplate_menu_items',
    getSampleMenuItems()
  );

  const addMenuItem = (data: Omit<MenuItem, 'id'>) => {
    const newItem = new MenuItem({ id: generateId(), ...data });
    setMenuItems([...menuItems, newItem]);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(
      menuItems.map((m) => (m.id === id ? new MenuItem({ ...m, ...updates }) : m))
    );
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(menuItems.filter((m) => m.id !== id));
  };

  const getMenuItemById = (id: string) => menuItems.find((m) => m.id === id);

  const getMenuItemsByRestaurant = (restaurantId: string) =>
    menuItems.filter((m) => m.restaurantId === restaurantId);

  return (
    <MenuItemsContext.Provider
      value={{
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        getMenuItemById,
        getMenuItemsByRestaurant,
      }}
    >
      {children}
    </MenuItemsContext.Provider>
  );
};

const ApiMenuItemsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const fetchedRestaurants = useRef<Set<string>>(new Set());

  const fetchMenuItemsForRestaurant = useCallback(async (restaurantId: string) => {
    if (fetchedRestaurants.current.has(restaurantId)) return;
    fetchedRestaurants.current.add(restaurantId);
    const data = await menuItemsApi.getByRestaurant(restaurantId);
    setMenuItems((prev) => [
      ...prev.filter((m) => m.restaurantId !== restaurantId),
      ...data,
    ]);
  }, []);

  const addMenuItem = async (data: Omit<MenuItem, 'id'>) => {
    const { restaurantId, ...rest } = data;
    await menuItemsApi.create(restaurantId, rest);
    // Refetch so local state has the server-assigned ID, not the client-generated one.
    fetchedRestaurants.current.delete(restaurantId);
    await fetchMenuItemsForRestaurant(restaurantId);
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    const existing = menuItems.find((m) => m.id === id);
    if (!existing) return;
    const updated = await menuItemsApi.update(existing.restaurantId, id, updates);
    setMenuItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const deleteMenuItem = async (id: string) => {
    const existing = menuItems.find((m) => m.id === id);
    if (!existing) return;
    await menuItemsApi.delete(existing.restaurantId, id);
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
  };

  const getMenuItemById = (id: string) => menuItems.find((m) => m.id === id);

  const getMenuItemsByRestaurant = useCallback(
    (restaurantId: string) => {
      // Trigger a lazy fetch if this restaurant's menu items haven't been loaded yet.
      // Deferred to avoid state updates during render.
      if (!fetchedRestaurants.current.has(restaurantId)) {
        setTimeout(() => fetchMenuItemsForRestaurant(restaurantId), 0);
      }
      return menuItems.filter((m) => m.restaurantId === restaurantId);
    },
    [menuItems, fetchMenuItemsForRestaurant]
  );

  return (
    <MenuItemsContext.Provider
      value={{
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        getMenuItemById,
        getMenuItemsByRestaurant,
      }}
    >
      {children}
    </MenuItemsContext.Provider>
  );
};

export const MenuItemsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return USE_API ? (
    <ApiMenuItemsProvider>{children}</ApiMenuItemsProvider>
  ) : (
    <LocalMenuItemsProvider>{children}</LocalMenuItemsProvider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMenuItems = (): MenuItemsContextType => {
  const context = useContext(MenuItemsContext);
  if (!context) {
    throw new Error('useMenuItems must be used within a MenuItemsProvider');
  }
  return context;
};
