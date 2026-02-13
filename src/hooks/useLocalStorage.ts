import { useState, useEffect } from 'react';

/**
 * Custom hook to sync state with localStorage
 * @param key - localStorage key
 * @param initialValue - initial value if localStorage is empty
 * @returns [storedValue, setValue] - current value and setter function
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  migrate?: (data: any) => T
): [T, (value: T | ((val: T) => T)) => void] {
  // Get initial value from localStorage or use provided initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        return migrate ? migrate(parsed) : parsed;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // Update localStorage whenever storedValue changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  // Wrapper for setValue that handles function updates
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
    } catch (error) {
      console.error(`Error setting value for ${key}:`, error);
    }
  };

  return [storedValue, setValue];
}
