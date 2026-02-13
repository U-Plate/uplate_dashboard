/**
 * Application configuration
 *
 * Set USE_API to true to fetch/persist data via REST API.
 * Set USE_API to false to use browser localStorage (default).
 */
export const USE_API = false;

/**
 * Base URL for the API server.
 * Only used when USE_API is true.
 */
export const API_BASE_URL = 'http://localhost:3000/api';
