/**
 * Generates a unique ID for new entities
 * Combines timestamp with random string for uniqueness
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};
