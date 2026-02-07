import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CreateCaseProviderCommand } from "../../application/commands/create-case-provider.command";
import { UpdateCaseProviderCommand } from "../../application/commands/update-case-provider.command";
import { FindAllCaseProvidersQuery } from "../../application/queries/find-all-case-providers.query";
import { FindCaseProviderByIdQuery } from "../../application/queries/find-case-provider-by-id.query";
import { CreateCaseProviderDto } from "../dto/create-case-provider.dto";
import { UpdateCaseProviderDto } from "../dto/update-case-provider.dto";
import { CaseProviderResponseDto } from "../dto/case-provider-response.dto";
import { OPERATING_REGIONS } from "../../constants/operating-regions";

@Controller("api/case-providers")
export class CaseProviderController {
  constructor(
    private readonly createCaseProviderCommand: CreateCaseProviderCommand,
    private readonly updateCaseProviderCommand: UpdateCaseProviderCommand,
    private readonly findAllCaseProvidersQuery: FindAllCaseProvidersQuery,
    private readonly findCaseProviderByIdQuery: FindCaseProviderByIdQuery
  ) {}

  @Get()
  async findAll(
    @Query("search") search?: string,
    @Query("providerType") providerType?: string,
    @Query("operatingRegion") operatingRegion?: string,
    @Query("status") status?: string
  ): Promise<{ data: CaseProviderResponseDto[] }> {
    const allowedRegion =
      operatingRegion?.trim() &&
      (OPERATING_REGIONS as readonly string[]).includes(operatingRegion.trim())
        ? operatingRegion.trim()
        : undefined;
    const providers = await this.findAllCaseProvidersQuery.execute({
      filters: {
        search: search?.trim() || undefined,
        providerType: providerType?.trim() || undefined,
        operatingRegion: allowedRegion,
        status: status?.trim() || undefined,
      },
    });
    return { data: providers.map((p) => new CaseProviderResponseDto(p)) };
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string
  ): Promise<{ data: CaseProviderResponseDto }> {
    const provider = await this.findCaseProviderByIdQuery.execute({ id });
    return { data: new CaseProviderResponseDto(provider) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateCaseProviderDto
  ): Promise<{ data: CaseProviderResponseDto }> {
    const provider = await this.createCaseProviderCommand.execute({
      companyName: dto.companyName,
      providerType: dto.providerType,
      operatingRegions: dto.operatingRegions,
      primaryEmail: dto.primaryEmail,
      primaryPhone: dto.primaryPhone,
      status: dto.status,
      contractStartDate: dto.contractStartDate
        ? new Date(dto.contractStartDate)
        : null,
      contractEndDate: dto.contractEndDate
        ? new Date(dto.contractEndDate)
        : null,
      pricingModel: dto.pricingModel ?? null,
      slaTier: dto.slaTier ?? null,
      tags: dto.tags ?? [],
    });

    return { data: new CaseProviderResponseDto(provider) };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateCaseProviderDto
  ): Promise<{ data: CaseProviderResponseDto }> {
    const provider = await this.updateCaseProviderCommand.execute({
      id,
      companyName: dto.companyName,
      providerType: dto.providerType,
      operatingRegions: dto.operatingRegions,
      primaryEmail: dto.primaryEmail,
      primaryPhone: dto.primaryPhone,
      status: dto.status,
      contractStartDate:
        dto.contractStartDate !== undefined
          ? dto.contractStartDate
            ? new Date(dto.contractStartDate)
            : null
          : undefined,
      contractEndDate:
        dto.contractEndDate !== undefined
          ? dto.contractEndDate
            ? new Date(dto.contractEndDate)
            : null
          : undefined,
      pricingModel: dto.pricingModel,
      slaTier: dto.slaTier,
      tags: dto.tags,
    });

    return { data: new CaseProviderResponseDto(provider) };
  }
}
