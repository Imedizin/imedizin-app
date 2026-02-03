/**
 * Generic repository interface
 * Defines common data access operations
 */
export interface IRepository<T, ID = number> {
  /**
   * Find entity by ID
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Find all entities
   */
  findAll(): Promise<T[]>;

  /**
   * Create a new entity
   */
  create(entity: Partial<T>): Promise<T>;

  /**
   * Update an existing entity
   */
  update(id: ID, entity: Partial<T>): Promise<T>;

  /**
   * Delete an entity by ID
   */
  delete(id: ID): Promise<void>;

  /**
   * Check if entity exists
   */
  exists(id: ID): Promise<boolean>;
}
