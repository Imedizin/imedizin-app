import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateTransportationRequestDto } from '../dto/create-transportation-request.dto';
import { UpdateTransportationRequestDto } from '../dto/update-transportation-request.dto';
import { TransportationRequestResponseDto } from '../dto/transportation-request-response.dto';
import { CreateTransportationRequestCommand } from '../../application/commands/create-transportation-request.command';
import { UpdateTransportationRequestCommand } from '../../application/commands/update-transportation-request.command';
import { FindAllTransportationRequestsQuery } from '../../application/queries/find-all-transportation-requests.query';
import { FindTransportationRequestByIdQuery } from '../../application/queries/find-transportation-request-by-id.query';

/**
 * Transportation Request controller
 * Handles HTTP requests for transportation request management
 */
@Controller('api/transportation-requests')
export class TransportationRequestController {
  constructor(
    private readonly createTransportationRequestCommand: CreateTransportationRequestCommand,
    private readonly updateTransportationRequestCommand: UpdateTransportationRequestCommand,
    private readonly findAllTransportationRequestsQuery: FindAllTransportationRequestsQuery,
    private readonly findTransportationRequestByIdQuery: FindTransportationRequestByIdQuery,
  ) {}

  /**
   * Get all transportation requests
   * GET /api/transportation-requests
   */
  @Get()
  async findAll(): Promise<{ data: TransportationRequestResponseDto[] }> {
    const requests = await this.findAllTransportationRequestsQuery.execute();
    return {
      data: requests.map((r) => new TransportationRequestResponseDto(r)),
    };
  }

  /**
   * Get transportation request by ID
   * GET /api/transportation-requests/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<{ data: TransportationRequestResponseDto }> {
    const request = await this.findTransportationRequestByIdQuery.execute({
      id,
    });
    return {
      data: new TransportationRequestResponseDto(request),
    };
  }

  /**
   * Create a new transportation request
   * POST /api/transportation-requests
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateTransportationRequestDto,
  ): Promise<{ data: TransportationRequestResponseDto }> {
    const request = await this.createTransportationRequestCommand.execute({
      pickupAddress: createDto.pickupAddress,
      dropoffAddress: createDto.dropoffAddress,
      threadIds: createDto.threadIds,
    });

    return {
      data: new TransportationRequestResponseDto(request),
    };
  }

  /**
   * Update a transportation request
   * PATCH /api/transportation-requests/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTransportationRequestDto,
  ): Promise<{ data: TransportationRequestResponseDto }> {
    const request = await this.updateTransportationRequestCommand.execute({
      id,
      pickupAddress: updateDto.pickupAddress,
      dropoffAddress: updateDto.dropoffAddress,
      threadIds: updateDto.threadIds,
      status: updateDto.status,
    });

    return {
      data: new TransportationRequestResponseDto(request),
    };
  }
}
