/**
 * Domain entity types
 */

/**
 * Domain entity - represents an email domain like ourdomain.com
 */
export interface Domain {
  id: string;
  domain: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new domain
 */
export interface CreateDomainDto {
  domain: string;
  name: string;
}

/**
 * DTO for updating a domain
 */
export interface UpdateDomainDto {
  domain?: string;
  name?: string;
}

/**
 * Form data for domain forms
 */
export interface DomainFormData {
  domain: string;
  name: string;
}
