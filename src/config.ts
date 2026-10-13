/**
 * Application configuration
 *
 * Set USE_API to true to fetch/persist data via REST API.
 * Set USE_API to false to use browser localStorage (default).
 */
export const USE_API = true;
const TEST_LOCAL = false;

export type ApiEnvironment = "production" | "beta";
const ENVIRONMENT_STORAGE_KEY = "uplate_api_environment";
export const API_ENVIRONMENTS: Record<ApiEnvironment, string> = {
    production: "https://boilerbites.com",
    beta: "https://beta.boilerbites.com",
};

// Preserve the existing beta default for browsers without a saved selection.
export const API_ENVIRONMENT: ApiEnvironment =
    localStorage.getItem(ENVIRONMENT_STORAGE_KEY) === "production" ? "production" : "beta";

export function switchApiEnvironment(environment: ApiEnvironment): void {
    if (environment === API_ENVIRONMENT) return;
    localStorage.setItem(ENVIRONMENT_STORAGE_KEY, environment);
    // Recreate API clients and contexts, and leave environment-specific record URLs.
    window.location.assign(import.meta.env.BASE_URL);
}

/**
 * Base URL for the API server.
 * Only used when USE_API is true.
 */ 
export const API_BASE_URL = TEST_LOCAL
    ? "http://localhost:8787"
    : API_ENVIRONMENTS[API_ENVIRONMENT];

/** School identifier used as the path prefix for all API requests. */
export const SCHOOL = "purdue";
