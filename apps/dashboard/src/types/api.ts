/**
 * Generic API response types
 *
 * These types match the backend's standardized response format.
 */

/**
 * Single item response wrapper
 */
export interface ApiResponse<T> {
  data: T;
}

/**
 * List response wrapper (non-paginated)
 */
export interface ListResponse<T> {
  data: T[];
}

/**
 * Paginated list response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
