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
  addMenuItem: (menuItem: Omit<MenuItem, 'id'>) => Promise<MenuItem>;
  uploadMenuItemPhoto: (restaurantId: string, id: string, file: File) => Promise<void>;
  removeMenuItemPhoto: (restaurantId: string, id: string) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void | Promise<void>;
  deleteMenuItem: (id: string) => void | Promise<void>;
  deleteAllMenuItems: (restaurantId: string) => void | Promise<void>;
  getMenuItemById: (id: string) => MenuItem | undefined;
  getMenuItemsByRestaurant: (restaurantId: string) => MenuItem[];
}

const MenuItemsContext = createContext<MenuItemsContextType | undefined>(undefined);

const LocalMenuItemsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useLocalStorage<MenuItem[]>(
    'uplate_menu_items',
    getSampleMenuItems()
  );

  const addMenuItem = async (data: Omit<MenuItem, 'id'>) => {
    const newItem = new MenuItem({ id: String(generateId()), ...data });
    setMenuItems((prev) => [...prev, newItem]);
    return newItem;
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((m) => (m.id === id ? new MenuItem({ ...m, ...updates }) : m))
    );
  };

  const uploadMenuItemPhoto = async (_restaurantId: string, id: string, file: File) => {
    const imageUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not read that photo.'));
      reader.readAsDataURL(file);
    });
    updateMenuItem(id, { imageUrl });
  };
  const removeMenuItemPhoto = async (_restaurantId: string, id: string) => {
    updateMenuItem(id, { imageUrl: null });
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(menuItems.filter((m) => m.id !== id));
  };

  const deleteAllMenuItems = (restaurantId: string) => {
    setMenuItems(menuItems.filter((m) => m.restaurantId !== restaurantId));
  };

  const getMenuItemById = (id: string) => menuItems.find((m) => m.id === id);

  const getMenuItemsByRestaurant = (restaurantId: string) =>
    menuItems.filter((m) => m.restaurantId === restaurantId);

  return (
    <MenuItemsContext.Provider
      value={{
        menuItems,
        addMenuItem,
        uploadMenuItemPhoto,
        removeMenuItemPhoto,
        updateMenuItem,
        deleteMenuItem,
        deleteAllMenuItems,
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
    const rawItems = await menuItemsApi.getByRestaurant(restaurantId);
    const resolved = rawItems.map((raw) => menuItemsApi.deserializeMenuItem(raw));
    setMenuItems((prev) => [
      ...prev.filter((m) => m.restaurantId !== restaurantId),
      ...resolved,
    ]);
  }, []);

  const addMenuItem = async (data: Omit<MenuItem, 'id'>) => {
    const { restaurantId, ...rest } = data;
    const created = new MenuItem(await menuItemsApi.create(restaurantId, rest));
    setMenuItems((prev) => [...prev, created]);
    return created;
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    const existing = menuItems.find((m) => m.id === id);
    if (!existing) throw new Error('Menu item is still loading. Try again.');
    const raw = await menuItemsApi.update(existing.restaurantId, id, updates);
    const updated = menuItemsApi.deserializeMenuItem(raw);
    setMenuItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const uploadMenuItemPhoto = async (restaurantId: string, id: string, file: File) => {
    const updated = await menuItemsApi.uploadPhoto(restaurantId, id, file);
    setMenuItems((prev) => prev.map((m) => m.id === id ? updated : m));
  };
  const removeMenuItemPhoto = async (restaurantId: string, id: string) => {
    const updated = await menuItemsApi.removePhoto(restaurantId, id);
    setMenuItems((prev) => prev.map((m) => m.id === id ? updated : m));
  };

  const deleteMenuItem = async (id: string) => {
    const existing = menuItems.find((m) => m.id === id);
    if (!existing) return;
    await menuItemsApi.delete(existing.restaurantId, id);
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
  };

  const deleteAllMenuItems = async (restaurantId: string) => {
    await menuItemsApi.deleteAll(restaurantId);
    fetchedRestaurants.current.delete(restaurantId);
    setMenuItems((prev) => prev.filter((m) => m.restaurantId !== restaurantId));
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
        uploadMenuItemPhoto,
        removeMenuItemPhoto,
        updateMenuItem,
        deleteMenuItem,
        deleteAllMenuItems,
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
