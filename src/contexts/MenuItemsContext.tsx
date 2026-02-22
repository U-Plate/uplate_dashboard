import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

// Migrate old data: Food[] → MenuItemFood[], add missing possibleFoods/sizes
const migrateMenuItems = (items: any[]): MenuItem[] =>
  items.map((item) => ({
    ...item,
    foods: item.foods.map((f: any) => (f.food ? f : { food: f, quantity: 1 })),
    possibleFoods: (item.possibleFoods ?? []).map((f: any) =>
      f.food ? f : { food: f, quantity: 1 }
    ),
    sizes: (item.sizes ?? []).map((s: any) => ({
      ...s,
      foods: (s.foods ?? []).map((f: any) => (f.food ? f : { food: f, quantity: 1 })),
      possibleFoods: (s.possibleFoods ?? []).map((f: any) => (f.food ? f : { food: f, quantity: 1 })),
    })),
  }));

const LocalMenuItemsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useLocalStorage<MenuItem[]>(
    'uplate_menu_items',
    getSampleMenuItems(),
    migrateMenuItems
  );

  const addMenuItem = (data: Omit<MenuItem, 'id'>) => {
    const newMenuItem = new MenuItem({ id: generateId(), ...data });
    setMenuItems([...menuItems, newMenuItem]);
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

  const fetchMenuItems = useCallback(async () => {
    const data = await menuItemsApi.getAll();
    setMenuItems(data);
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const addMenuItem = async (data: Omit<MenuItem, 'id'>) => {
    const created = await menuItemsApi.create(data);
    setMenuItems((prev) => [...prev, created]);
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    const updated = await menuItemsApi.update(id, updates);
    setMenuItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const deleteMenuItem = async (id: string) => {
    await menuItemsApi.delete(id);
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
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

export const MenuItemsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return USE_API ? (
    <ApiMenuItemsProvider>{children}</ApiMenuItemsProvider>
  ) : (
    <LocalMenuItemsProvider>{children}</LocalMenuItemsProvider>
  );
};

export const useMenuItems = (): MenuItemsContextType => {
  const context = useContext(MenuItemsContext);
  if (!context) {
    throw new Error('useMenuItems must be used within a MenuItemsProvider');
  }
  return context;
};
