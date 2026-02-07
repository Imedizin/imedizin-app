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
import { CreateMedicalProviderCommand } from "../../application/commands/create-medical-provider.command";
import { UpdateMedicalProviderCommand } from "../../application/commands/update-medical-provider.command";
import { FindAllMedicalProvidersQuery } from "../../application/queries/find-all-medical-providers.query";
import { FindMedicalProviderByIdQuery } from "../../application/queries/find-medical-provider-by-id.query";
import { CreateMedicalProviderDto } from "../dto/create-medical-provider.dto";
import { UpdateMedicalProviderDto } from "../dto/update-medical-provider.dto";
import { MedicalProviderResponseDto } from "../dto/medical-provider-response.dto";
import { ALL_MEDICAL_SPECIALTIES } from "../../constants/medical-specialties";

@Controller("api/medical-providers")
export class MedicalProviderController {
  constructor(
    private readonly createMedicalProviderCommand: CreateMedicalProviderCommand,
    private readonly updateMedicalProviderCommand: UpdateMedicalProviderCommand,
    private readonly findAllMedicalProvidersQuery: FindAllMedicalProvidersQuery,
    private readonly findMedicalProviderByIdQuery: FindMedicalProviderByIdQuery,
  ) {}

  @Get()
  async findAll(
    @Query("search") search?: string,
    @Query("providerType") providerType?: string,
    @Query("country") country?: string,
    @Query("status") status?: string,
    @Query("specialty") specialty?: string,
  ): Promise<{ data: MedicalProviderResponseDto[] }> {
    const allowedSpecialty =
      specialty?.trim() && ALL_MEDICAL_SPECIALTIES.includes(specialty.trim())
        ? specialty.trim()
        : undefined;
    const providers = await this.findAllMedicalProvidersQuery.execute({
      filters: {
        search: search?.trim() || undefined,
        providerType: providerType?.trim() || undefined,
        country: country?.trim() || undefined,
        status: status?.trim() || undefined,
        specialty: allowedSpecialty,
      },
    });
    return { data: providers.map((p) => new MedicalProviderResponseDto(p)) };
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
  ): Promise<{ data: MedicalProviderResponseDto }> {
    const provider = await this.findMedicalProviderByIdQuery.execute({ id });
    return { data: new MedicalProviderResponseDto(provider) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateMedicalProviderDto,
  ): Promise<{ data: MedicalProviderResponseDto }> {
    const provider = await this.createMedicalProviderCommand.execute({
      legalName: dto.legalName,
      providerType: dto.providerType,
      country: dto.country,
      primaryEmail: dto.primaryEmail,
      primaryPhone: dto.primaryPhone,
      status: dto.status,
      specialties: dto.specialties ?? [],
      services: dto.services ?? [],
      businessHours: dto.businessHours ?? null,
      licenseNumber: dto.licenseNumber ?? null,
      tags: dto.tags ?? [],
      onboardedAt: dto.onboardedAt ? new Date(dto.onboardedAt) : null,
    });

    return { data: new MedicalProviderResponseDto(provider) };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateMedicalProviderDto,
  ): Promise<{ data: MedicalProviderResponseDto }> {
    const provider = await this.updateMedicalProviderCommand.execute({
      id,
      legalName: dto.legalName,
      providerType: dto.providerType,
      country: dto.country,
      primaryEmail: dto.primaryEmail,
      primaryPhone: dto.primaryPhone,
      status: dto.status,
      specialties: dto.specialties,
      services: dto.services,
      businessHours: dto.businessHours,
      licenseNumber: dto.licenseNumber,
      tags: dto.tags,
      onboardedAt:
        dto.onboardedAt !== undefined
          ? dto.onboardedAt
            ? new Date(dto.onboardedAt)
            : null
          : undefined,
    });

    return { data: new MedicalProviderResponseDto(provider) };
  }
}
