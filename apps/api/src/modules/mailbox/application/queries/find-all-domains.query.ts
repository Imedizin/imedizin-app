import { Inject, Injectable } from "@nestjs/common";
import type { IDomainRepository } from "../../domain/interfaces/domain.repository.interface";
import { Domain } from "../../domain/entities/domain.entity";

@Injectable()
export class FindAllDomainsQuery {
  constructor(
    @Inject("IDomainRepository")
    private readonly domainRepository: IDomainRepository,
  ) {}

  async execute(): Promise<Domain[]> {
    return this.domainRepository.findAll();
  }
}
