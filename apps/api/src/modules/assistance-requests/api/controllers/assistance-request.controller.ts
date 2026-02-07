import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateTransportRequestCommand } from '../../application/commands/create-transport-request.command';
import { CreateMedicalRequestCommand } from '../../application/commands/create-medical-request.command';
import { LinkThreadCommand } from '../../application/commands/link-thread.command';
import { UnlinkThreadCommand } from '../../application/commands/unlink-thread.command';
import { FindAllAssistanceRequestsQuery } from '../../application/queries/find-all-assistance-requests.query';
import { FindAssistanceRequestByIdQuery } from '../../application/queries/find-assistance-request-by-id.query';
import { CreateTransportRequestDto } from '../dto/create-transport-request.dto';
import { CreateMedicalRequestDto } from '../dto/create-medical-request.dto';
import { LinkThreadDto } from '../dto/link-thread.dto';
import { AssistanceRequestResponseDto } from '../dto/assistance-request-response.dto';
import { GetThreadSummariesByIdsQuery } from '../../../mailbox/application/queries/get-thread-summaries-by-ids.query';

@Controller('api/assistance-requests')
export class AssistanceRequestController {
  constructor(
    private readonly createTransportCommand: CreateTransportRequestCommand,
    private readonly createMedicalCommand: CreateMedicalRequestCommand,
    private readonly linkThreadCommand: LinkThreadCommand,
    private readonly unlinkThreadCommand: UnlinkThreadCommand,
    private readonly findAllQuery: FindAllAssistanceRequestsQuery,
    private readonly findByIdQuery: FindAssistanceRequestByIdQuery,
    private readonly getThreadSummariesByIdsQuery: GetThreadSummariesByIdsQuery,
  ) {}

  @Get()
  async findAll(
    @Query('serviceType') serviceType?: 'TRANSPORT' | 'MEDICAL',
    @Query('status') status?: string,
  ): Promise<{ data: AssistanceRequestResponseDto[] }> {
    const list = await this.findAllQuery.execute({
      serviceType: serviceType ?? undefined,
      status: status?.trim() || undefined,
    });
    return { data: list.map((r) => new AssistanceRequestResponseDto(r)) };
  }

  @Post(':id/threads')
  async linkThread(
    @Param('id') id: string,
    @Body() dto: LinkThreadDto,
  ): Promise<{ data: AssistanceRequestResponseDto }> {
    const req = await this.linkThreadCommand.execute(id, dto.threadId.trim());
    const summaries = await this.getThreadSummariesByIdsQuery.execute(req.threadIds);
    return { data: new AssistanceRequestResponseDto(req, summaries) };
  }

  @Delete(':id/threads/:threadId')
  async unlinkThread(
    @Param('id') id: string,
    @Param('threadId') threadId: string,
  ): Promise<{ data: AssistanceRequestResponseDto }> {
    const req = await this.unlinkThreadCommand.execute(id, threadId);
    const summaries = await this.getThreadSummariesByIdsQuery.execute(req.threadIds);
    return { data: new AssistanceRequestResponseDto(req, summaries) };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<{ data: AssistanceRequestResponseDto }> {
    const req = await this.findByIdQuery.execute(id);
    if (!req) {
      throw new NotFoundException('Assistance request not found');
    }
    const summaries = await this.getThreadSummariesByIdsQuery.execute(req.threadIds);
    return { data: new AssistanceRequestResponseDto(req, summaries) };
  }

  @Post('transport')
  @HttpCode(HttpStatus.CREATED)
  async createTransport(
    @Body() dto: CreateTransportRequestDto,
  ): Promise<{ data: AssistanceRequestResponseDto }> {
    const req = await this.createTransportCommand.execute({
      requestNumber: dto.requestNumber,
      status: dto.status ?? 'NEW',
      priority: dto.priority ?? null,
      providerReferenceNumber: dto.providerReferenceNumber ?? null,
      receivedAt: new Date(dto.receivedAt),
      caseProviderId: dto.caseProviderId ?? null,
      patientFullName: dto.patientFullName,
      patientBirthDate: dto.patientBirthDate ?? null,
      patientNationalityCode: dto.patientNationalityCode ?? null,
      pickupPoint: dto.pickupPoint,
      dropoffPoint: dto.dropoffPoint,
      requestedTransportAt: dto.requestedTransportAt
        ? new Date(dto.requestedTransportAt)
        : null,
      modeOfTransport: dto.modeOfTransport ?? null,
      medicalCrewRequired: dto.medicalCrewRequired ?? false,
      hasCompanion: dto.hasCompanion ?? false,
      estimatedPickupTime: dto.estimatedPickupTime
        ? new Date(dto.estimatedPickupTime)
        : null,
      estimatedDropoffTime: dto.estimatedDropoffTime
        ? new Date(dto.estimatedDropoffTime)
        : null,
      diagnosis: dto.diagnosis ?? null,
    });
    return { data: new AssistanceRequestResponseDto(req) };
  }

  @Post('medical')
  @HttpCode(HttpStatus.CREATED)
  async createMedical(
    @Body() dto: CreateMedicalRequestDto,
  ): Promise<{ data: AssistanceRequestResponseDto }> {
    const req = await this.createMedicalCommand.execute({
      requestNumber: dto.requestNumber,
      status: dto.status ?? 'NEW',
      priority: dto.priority ?? null,
      providerReferenceNumber: dto.providerReferenceNumber ?? null,
      receivedAt: new Date(dto.receivedAt),
      caseProviderId: dto.caseProviderId ?? null,
      patientFullName: dto.patientFullName,
      patientBirthDate: dto.patientBirthDate ?? null,
      patientNationalityCode: dto.patientNationalityCode ?? null,
      caseProviderReferenceNumber: dto.caseProviderReferenceNumber ?? null,
      admissionDate: dto.admissionDate ?? null,
      dischargeDate: dto.dischargeDate ?? null,
      country: dto.country ?? null,
      city: dto.city ?? null,
      medicalProviderId: dto.medicalProviderId ?? null,
      diagnosis: dto.diagnosis ?? null,
    });
    return { data: new AssistanceRequestResponseDto(req) };
  }
}
