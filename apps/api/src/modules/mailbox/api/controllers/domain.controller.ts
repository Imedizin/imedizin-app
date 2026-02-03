import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateDomainDto } from '../dto/create-domain.dto';
import { UpdateDomainDto } from '../dto/update-domain.dto';
import { DomainResponseDto } from '../dto/domain-response.dto';
import { CreateDomainCommand } from '../../application/commands/create-domain.command';
import { UpdateDomainCommand } from '../../application/commands/update-domain.command';
import { DeleteDomainCommand } from '../../application/commands/delete-domain.command';
import { FindAllDomainsQuery } from '../../application/queries/find-all-domains.query';
import { FindDomainByIdQuery } from '../../application/queries/find-domain-by-id.query';

/**
 * Domain controller
 * Handles HTTP requests for domain management
 */
@Controller('api/domains')
export class DomainController {
  constructor(
    private readonly createDomainCommand: CreateDomainCommand,
    private readonly updateDomainCommand: UpdateDomainCommand,
    private readonly deleteDomainCommand: DeleteDomainCommand,
    private readonly findAllDomainsQuery: FindAllDomainsQuery,
    private readonly findDomainByIdQuery: FindDomainByIdQuery,
  ) {}

  /**
   * Get all domains
   * GET /api/domains
   */
  @Get()
  async findAll(): Promise<{ data: DomainResponseDto[] }> {
    const domains = await this.findAllDomainsQuery.execute();
    return {
      data: domains.map((d) => new DomainResponseDto(d)),
    };
  }

  /**
   * Get domain by ID
   * GET /api/domains/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{ data: DomainResponseDto }> {
    const domain = await this.findDomainByIdQuery.execute({ id });
    return {
      data: new DomainResponseDto(domain),
    };
  }

  /**
   * Create a new domain
   * POST /api/domains
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDomainDto: CreateDomainDto,
  ): Promise<{ data: DomainResponseDto }> {
    const domain = await this.createDomainCommand.execute({
      domain: createDomainDto.domain,
      name: createDomainDto.name,
    });

    return {
      data: new DomainResponseDto(domain),
    };
  }

  /**
   * Update a domain
   * PATCH /api/domains/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDomainDto: UpdateDomainDto,
  ): Promise<{ data: DomainResponseDto }> {
    const domain = await this.updateDomainCommand.execute({
      id,
      domain: updateDomainDto.domain,
      name: updateDomainDto.name,
    });

    return {
      data: new DomainResponseDto(domain),
    };
  }

  /**
   * Delete a domain
   * DELETE /api/domains/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteDomainCommand.execute({ id });
  }
}
