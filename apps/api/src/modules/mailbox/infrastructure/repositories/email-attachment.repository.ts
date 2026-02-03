import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../../../../shared/common/database/database.module';
import type { Database } from '../../../../shared/common/database/database.module';
import { emailAttachments } from '../schema';
import { eq } from 'drizzle-orm';
import type {
  IEmailAttachmentRepository,
  CreateAttachmentData,
  EmailAttachmentRecord,
} from '../../domain/interfaces/email-attachment.repository.interface';

@Injectable()
export class EmailAttachmentRepository implements IEmailAttachmentRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) {}

  async create(data: CreateAttachmentData): Promise<EmailAttachmentRecord> {
    const result = await this.db
      .insert(emailAttachments)
      .values({
        emailId: data.emailId,
        filename: data.filename,
        mimeType: data.mimeType,
        size: data.size,
        fileUrl: data.fileUrl,
        isInline: data.isInline,
      })
      .returning();

    const row = result[0];
    return this.toRecord(row);
  }

  async findById(id: string): Promise<EmailAttachmentRecord | null> {
    const result = await this.db
      .select()
      .from(emailAttachments)
      .where(eq(emailAttachments.id, id))
      .limit(1);
    if (result.length === 0) return null;
    return this.toRecord(result[0]);
  }

  async findByEmailId(emailId: string): Promise<EmailAttachmentRecord[]> {
    const result = await this.db
      .select()
      .from(emailAttachments)
      .where(eq(emailAttachments.emailId, emailId));
    return result.map((row) => this.toRecord(row));
  }

  private toRecord(
    row: typeof emailAttachments.$inferSelect,
  ): EmailAttachmentRecord {
    return {
      id: row.id,
      emailId: row.emailId,
      filename: row.filename,
      mimeType: row.mimeType,
      size: row.size,
      fileUrl: row.fileUrl,
      isInline: row.isInline,
      createdAt: row.createdAt,
    };
  }
}
