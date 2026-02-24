/**
 * Application configuration
 *
 * Set USE_API to true to fetch/persist data via REST API.
 * Set USE_API to false to use browser localStorage (default).
 */
export const USE_API = true;

/**
 * Base URL for the API server.
 * Only used when USE_API is true.
 */
export const API_BASE_URL = "http://localhost:8787";

/** School identifier used as the path prefix for all API requests. */
export const SCHOOL = "purdue";

/** Admin key required by all write/mutation endpoints. */
export const ADMIN_KEY = "boilerfueladmin";
