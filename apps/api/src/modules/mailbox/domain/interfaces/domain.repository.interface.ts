import { Domain } from "../entities/domain.entity";

/**
 * Domain repository interface
 * Defined in domain layer to maintain dependency inversion
 */
export interface IDomainRepository {
  /**
   * Find all domains
   */
  findAll(): Promise<Domain[]>;

  /**
   * Find domain by ID
   */
  findById(id: string): Promise<Domain | null>;

  /**
   * Find domain by domain name
   */
  findByDomain(domain: string): Promise<Domain | null>;

  /**
   * Create a new domain
   */
  create(domain: { domain: string; name: string }): Promise<Domain>;

  /**
   * Update an existing domain
   */
  update(id: string, data: { domain?: string; name?: string }): Promise<Domain>;

  /**
   * Delete a domain by ID
   */
  delete(id: string): Promise<void>;
}
