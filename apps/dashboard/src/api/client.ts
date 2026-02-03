/**
 * Shared API client configuration
 *
 * This module provides:
 * - Pre-configured HTTP client (ky) for all API calls
 * - Centralized error handling with ApiError
 *
 * Usage:
 * ```typescript
 * import { apiClient } from "./client";
 *
 * const result = await apiClient.get("domains").json();
 * ```
 */

import ky from "ky";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * API Error class for handling HTTP errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Pre-configured API client
 *
 * - Base URL: VITE_API_BASE_URL or http://localhost:3000
 * - Prefix: /api
 * - Content-Type: application/json
 * - Automatically throws ApiError for non-ok responses
 */
export const apiClient = ky.create({
  prefixUrl: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    afterResponse: [
      async (_request, _options, response) => {
        if (!response.ok) {
          let message = response.statusText;
          let payload: any;

          try {
            payload = await response.clone().json();
            message =
              typeof payload?.message === "string"
                ? payload.message
                : (payload?.error ?? message);
          } catch {
            // ignore parse errors
          }

          throw new ApiError(message, response.status, payload);
        }
      },
    ],
  },
});
