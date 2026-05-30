/**
 * Generates a unique ID for new entities
 * Combines timestamp with random string for uniqueness
 */
export const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};
