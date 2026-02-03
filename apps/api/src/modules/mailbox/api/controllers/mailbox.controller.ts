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
import { AddMailboxDto } from '../dto/add-mailbox.dto';
import { UpdateMailboxDto } from '../dto/update-mailbox.dto';
import { MailboxResponseDto } from '../dto/mailbox-response.dto';
import { AddMailboxCommand } from '../../application/commands/add-mailbox.command';
import { UpdateMailboxCommand } from '../../application/commands/update-mailbox.command';
import { DeleteMailboxCommand } from '../../application/commands/delete-mailbox.command';
import { FindAllMailboxesQuery } from '../../application/queries/find-all-mailboxes.query';
import { FindMailboxByIdQuery } from '../../application/queries/find-mailbox-by-id.query';

/**
 * Mailbox controller
 * Handles HTTP requests for mailbox management
 */
@Controller('api/mailboxes')
export class MailboxController {
  constructor(
    private readonly addMailboxCommand: AddMailboxCommand,
    private readonly updateMailboxCommand: UpdateMailboxCommand,
    private readonly deleteMailboxCommand: DeleteMailboxCommand,
    private readonly findAllMailboxesQuery: FindAllMailboxesQuery,
    private readonly findMailboxByIdQuery: FindMailboxByIdQuery,
  ) {}

  /**
   * Get all mailboxes
   * GET /api/mailboxes
   */
  @Get()
  async findAll(): Promise<{ data: MailboxResponseDto[] }> {
    const mailboxes = await this.findAllMailboxesQuery.execute();
    return {
      data: mailboxes.map((m) => new MailboxResponseDto(m)),
    };
  }

  /**
   * Get mailbox by ID
   * GET /api/mailboxes/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<{ data: MailboxResponseDto }> {
    const mailbox = await this.findMailboxByIdQuery.execute({ id });
    return {
      data: new MailboxResponseDto(mailbox),
    };
  }

  /**
   * Add a new mailbox
   * POST /api/mailboxes
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() addMailboxDto: AddMailboxDto,
  ): Promise<{ data: MailboxResponseDto }> {
    const mailbox = await this.addMailboxCommand.execute({
      address: addMailboxDto.address,
      name: addMailboxDto.name,
    });

    return {
      data: new MailboxResponseDto(mailbox),
    };
  }

  /**
   * Update a mailbox
   * PATCH /api/mailboxes/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMailboxDto: UpdateMailboxDto,
  ): Promise<{ data: MailboxResponseDto }> {
    const mailbox = await this.updateMailboxCommand.execute({
      id,
      address: updateMailboxDto.address,
      name: updateMailboxDto.name,
    });

    return {
      data: new MailboxResponseDto(mailbox),
    };
  }

  /**
   * Delete a mailbox
   * DELETE /api/mailboxes/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteMailboxCommand.execute({ id });
  }
}
