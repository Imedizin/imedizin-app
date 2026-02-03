/**
 * API Response utilities for standardized response formatting
 *
 * All API responses should use these utilities to ensure consistent format:
 * - Single items: { data: T }
 * - Lists: { data: T[] }
 * - Paginated lists: { data: T[], total, page, limit, hasMore }
 */

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

/**
 * Single item response wrapper
 */
export interface ItemResponse<T> {
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

/**
 * API Response utility class
 *
 * Usage:
 * ```typescript
 * // Single item
 * return ApiResponse.item(new DomainResponseDto(domain));
 *
 * // List
 * return ApiResponse.list(domains.map(d => new DomainResponseDto(d)));
 *
 * // Paginated list
 * return ApiResponse.paginated(emails, { total: 100, page: 1, limit: 20 });
 * ```
 */
export class ApiResponse {
  /**
   * Wrap a single item in the standard response format
   * @param data - The item to wrap
   * @returns { data: T }
   */
  static item<T>(data: T): ItemResponse<T> {
    return { data };
  }

  /**
   * Wrap a list in the standard response format
   * @param data - The array of items to wrap
   * @returns { data: T[] }
   */
  static list<T>(data: T[]): ListResponse<T> {
    return { data };
  }

  /**
   * Wrap a paginated list in the standard response format
   * @param data - The array of items for the current page
   * @param meta - Pagination metadata (total, page, limit)
   * @returns { data: T[], total, page, limit, hasMore }
   */
  static paginated<T>(data: T[], meta: PaginationMeta): PaginatedResponse<T> {
    const { total, page, limit } = meta;
    const hasMore = page * limit < total;

    return {
      data,
      total,
      page,
      limit,
      hasMore,
    };
  }
}
