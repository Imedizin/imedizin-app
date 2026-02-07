import { Domain } from "../../domain/entities/domain.entity";

/**
 * DTO for domain response
 */
export class DomainResponseDto {
  id: string;
  domain: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(domain: Domain) {
    this.id = domain.id;
    this.domain = domain.domain;
    this.name = domain.name;
    this.createdAt = domain.createdAt || new Date();
    this.updatedAt = domain.updatedAt || new Date();
  }
}
