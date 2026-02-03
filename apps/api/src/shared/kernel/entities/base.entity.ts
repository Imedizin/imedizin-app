/**
 * Base entity class for all domain entities
 * Provides common properties and behavior
 */
export abstract class BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt?: Date;

  constructor(id?: number, createdAt?: Date, updatedAt?: Date) {
    this.id = id || 0;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt;
  }

  /**
   * Mark entity as updated
   */
  markAsUpdated(): void {
    this.updatedAt = new Date();
  }

  /**
   * Check if entity is new (not persisted)
   */
  isNew(): boolean {
    return this.id === 0;
  }
}
