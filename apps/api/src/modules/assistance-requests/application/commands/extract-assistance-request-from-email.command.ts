import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { IEmailRepository } from "../../../mailbox/domain/interfaces/email.repository.interface";
import { AIModelService } from "../../../ai/aimodel.service";
import type { ExtractFromEmailResponseDto } from "../../api/dto/extract-from-email.dto";

const MAX_BODY_LENGTH = 6000;

const SYSTEM_PROMPT = `You extract structured assistance request data from emails (medical transport or medical case requests).
Return ONLY valid JSON, no markdown and no explanation, with these keys (omit if not found):
- requestNumber (string): e.g. IM-TR-2025-0123 or IM-MD-2025-0132
- insuranceCompanyReferenceNumber (string, optional)
- patientName (string)
- patientBirthdate (string, optional): YYYY-MM-DD
- patientNationality (string, optional)
- diagnosis (string, optional)
- notes (string, optional)
- requestType (string, optional): "transport" or "medical_case" if clear from content`;

@Injectable()
export class ExtractAssistanceRequestFromEmailCommand {
  constructor(
    @Inject("IEmailRepository")
    private readonly emailRepository: IEmailRepository,
    private readonly aiModelService: AIModelService,
  ) {}

  async execute(emailId: string): Promise<ExtractFromEmailResponseDto> {
    const email = await this.emailRepository.findById(emailId);
    if (!email) {
      throw new NotFoundException(`Email with ID ${emailId} not found`);
    }

    const bodyText = this.getBodyText(email.bodyText, email.bodyHtml);
    const receivedStr = email.receivedAt
      ? email.receivedAt.toISOString()
      : "unknown";

    const userMessage = `Subject: ${email.subject}\nReceived: ${receivedStr}\n\nBody:\n${bodyText.slice(0, MAX_BODY_LENGTH)}`;

    const raw = await this.aiModelService.complete(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      { maxTokens: 2048, temperature: 0.2 },
    );

    const parsed = this.parseJsonResponse(raw);
    return this.normalizeResponse(parsed, email.receivedAt);
  }

  private getBodyText(
    bodyText: string | null,
    bodyHtml: string | null,
  ): string {
    if (bodyText && bodyText.trim()) {
      return bodyText.trim();
    }
    if (bodyHtml && bodyHtml.trim()) {
      return bodyHtml
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
    return "";
  }

  private parseJsonResponse(raw: string): Record<string, unknown> {
    let str = raw.trim();
    const codeBlock = str.match(/^```(?:json)?\s*([\s\S]*?)```$/);
    if (codeBlock) {
      str = codeBlock[1].trim();
    }
    try {
      const parsed: unknown = JSON.parse(str);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  private normalizeResponse(
    parsed: Record<string, unknown>,
    emailReceivedAt: Date | null,
  ): ExtractFromEmailResponseDto {
    const requestType = parsed.requestType as string | undefined;
    const validType =
      requestType === "transport" || requestType === "medical_case"
        ? requestType
        : undefined;

    const receivedAt = emailReceivedAt
      ? emailReceivedAt.toISOString()
      : undefined;

    return {
      requestNumber:
        typeof parsed.requestNumber === "string"
          ? parsed.requestNumber
          : undefined,
      receivedAt,
      insuranceCompanyReferenceNumber:
        typeof parsed.insuranceCompanyReferenceNumber === "string"
          ? parsed.insuranceCompanyReferenceNumber
          : undefined,
      patientName:
        typeof parsed.patientName === "string" ? parsed.patientName : undefined,
      patientBirthdate:
        typeof parsed.patientBirthdate === "string"
          ? parsed.patientBirthdate
          : undefined,
      patientNationality:
        typeof parsed.patientNationality === "string"
          ? parsed.patientNationality
          : undefined,
      diagnosis:
        typeof parsed.diagnosis === "string" ? parsed.diagnosis : undefined,
      notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
      requestType: validType,
    };
  }
}
