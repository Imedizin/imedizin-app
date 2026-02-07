import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { IEmailRepository } from "../../../mailbox/domain/interfaces/email.repository.interface";
import { AIModelService } from "../../../ai/aimodel.service";
import type { ExtractFromEmailResponseDto } from "../../api/dto/extract-from-email.dto";

const MAX_BODY_LENGTH = 6000;

const PROMPT_TRANSPORT = `You extract structured data from an email that describes a MEDICAL TRANSPORT request. The email may be written in narrative form (paragraphs). Extract all mentioned information.

Rules:
- Return ONLY a single JSON object. No markdown, no code fence, no explanation.
- Use exactly these camelCase keys. Omit a key only if the information is not in the email. Do not use placeholder values (e.g. "unknown", "n/a"); omit the key instead.
- Dates: always use YYYY-MM-DD (e.g. "10 February 2025" → "2025-02-10", "15 March 1978" → "1978-03-15").
- Times: use ISO 8601 with date and time (e.g. "10 February 2025 08:00" → "2025-02-10T08:00:00").
- modeOfTransport: use only "lemozen", "als", or "bls" (e.g. "ALS ambulance" → "als").
- medicalCrewRequired: true if medical crew, escort, or qualified crew is mentioned.
- hasCompanion: true if accompanying person, companion, or family member traveling with patient is mentioned.

Keys:
- requestNumber (string): reference number e.g. IM-TR-2025-0123
- insuranceCompanyReferenceNumber (string): insurer/file reference e.g. ACME-2025-0891
- patientName (string)
- patientBirthdate (string): YYYY-MM-DD
- patientNationality (string)
- diagnosis (string): condition or procedure
- notes (string): any extra clinical or coordination details
- pickupPoint (string): full address or facility name and location
- dropoffPoint (string): full address or facility name and location
- dateOfRequestedTransportation (string): YYYY-MM-DD
- estimatedPickupTime (string): ISO 8601
- estimatedDropoffTime (string): ISO 8601
- modeOfTransport (string): "lemozen" | "als" | "bls"
- medicalCrewRequired (boolean)
- hasCompanion (boolean)`;

const PROMPT_MEDICAL_CASE = `You extract structured data from an email that describes a MEDICAL CASE request (e.g. treatment, admission, discharge, case management).
Return ONLY valid JSON, no markdown and no explanation, with these keys (omit if not found; do not use "unknown" or "n/a", omit the key instead):

- requestNumber (string): e.g. IM-TR-2025-0123 or IM-MD-2025-0132
- insuranceCompanyReferenceNumber (string, optional)
- patientName (string)
- patientBirthdate (string, optional): YYYY-MM-DD
- patientNationality (string, optional)
- diagnosis (string, optional)
- notes (string, optional)
- caseProviderReferenceNumber (string, optional): reference from case provider
- admissionDate (string, optional): YYYY-MM-DD
- dischargeDate (string, optional): YYYY-MM-DD
- country (string, optional)
- city (string, optional)
- medicalProviderName (string, optional): hospital or clinic name
- motherInsuranceCompany (string, optional): insurer or mother company name`;

const PROMPT_COMBINED = `You extract structured assistance request data from emails (medical transport or medical case requests).
Return ONLY valid JSON, no markdown and no explanation, with these keys (omit if not found; do not use "unknown" or "n/a", omit the key instead):

- requestNumber (string): e.g. IM-TR-2025-0123 or IM-MD-2025-0132
- insuranceCompanyReferenceNumber (string, optional)
- patientName (string)
- patientBirthdate (string, optional): YYYY-MM-DD
- patientNationality (string, optional)
- diagnosis (string, optional)
- notes (string, optional)
- requestType (string, optional): "transport" or "medical_case" if clear from content
- pickupPoint (string, optional): full pickup address
- dropoffPoint (string, optional): full drop-off address
- dateOfRequestedTransportation (string, optional): YYYY-MM-DD
- estimatedPickupTime (string, optional): ISO 8601 date-time
- estimatedDropoffTime (string, optional): ISO 8601 date-time
- modeOfTransport (string, optional): one of "lemozen", "als", "bls"
- medicalCrewRequired (boolean, optional): true if escorting medical crew is mentioned
- hasCompanion (boolean, optional): true if companion is mentioned
- caseProviderReferenceNumber (string, optional): reference from case provider
- admissionDate (string, optional): YYYY-MM-DD
- dischargeDate (string, optional): YYYY-MM-DD
- country (string, optional)
- city (string, optional)
- medicalProviderName (string, optional): hospital or clinic name
- motherInsuranceCompany (string, optional): insurer or mother company name`;

@Injectable()
export class ExtractAssistanceRequestFromEmailCommand {
  private readonly logger = new Logger(
    ExtractAssistanceRequestFromEmailCommand.name,
  );

  constructor(
    @Inject("IEmailRepository")
    private readonly emailRepository: IEmailRepository,
    private readonly aiModelService: AIModelService,
  ) {}

  async execute(
    emailId: string,
    type?: "transport" | "medical_case",
  ): Promise<{ data: ExtractFromEmailResponseDto }> {
    const email = await this.emailRepository.findById(emailId);
    if (!email) {
      throw new NotFoundException(`Email with ID ${emailId} not found`);
    }

    const systemPrompt =
      type === "transport"
        ? PROMPT_TRANSPORT
        : type === "medical_case"
          ? PROMPT_MEDICAL_CASE
          : PROMPT_COMBINED;

    const bodyText = this.getBodyText(email.bodyText, email.bodyHtml);
    const receivedStr = email.receivedAt
      ? email.receivedAt.toISOString()
      : "unknown";

    const userMessage = `Subject: ${email.subject}\nReceived: ${receivedStr}\n\nBody:\n${bodyText.slice(0, MAX_BODY_LENGTH)}`;

    // AIModelService.complete returns Promise<string>; type can be unresolved when ai module is not in lint scope
    const raw: string = await (
      this.aiModelService as {
        complete(
          messages: Array<{ role: string; content: string }>,
          options?: { maxTokens?: number; temperature?: number },
        ): Promise<string>;
      }
    ).complete(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      { maxTokens: 2048, temperature: 0.2 },
    );

    const parsed = this.parseJsonResponse(raw);
    const keyCount = Object.keys(parsed).length;
    if (keyCount === 0) {
      this.logger.warn(
        `Extract from email: AI response did not parse as JSON. Raw (first 1000 chars): ${raw.slice(0, 1000)}`,
      );
    }
    const data = this.normalizeResponse(parsed, email.receivedAt, type);
    return {
      data: {
        ...data,
        ...(email.threadId && { threadId: email.threadId }),
      },
    };
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
    const str = raw.replace(/^\uFEFF/, "").trim();
    if (!str) return {};

    const candidates: string[] = [];

    const codeBlock = str.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) candidates.push(codeBlock[1].trim());

    const first = str.indexOf("{");
    if (first !== -1) {
      const sliceFromFirst = str.slice(first);
      const end = this.findMatchingBraceEnd(sliceFromFirst);
      if (end > 0) candidates.push(sliceFromFirst.slice(0, end + 1));
      else {
        const last = str.lastIndexOf("}");
        if (last > first) candidates.push(str.slice(first, last + 1));
      }
    }

    if (candidates.length === 0) candidates.push(str);

    for (const candidate of candidates) {
      const normalized = this.normalizeJsonString(candidate);
      try {
        const parsed: unknown = JSON.parse(normalized);
        if (typeof parsed === "object" && parsed !== null) {
          return this.normalizeParsedKeys(parsed as Record<string, unknown>);
        }
      } catch {
        continue;
      }
    }
    return {};
  }

  private normalizeJsonString(s: string): string {
    return s
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/\r\n/g, "\n")
      .trim();
  }

  private findMatchingBraceEnd(str: string): number {
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "{") depth++;
      else if (str[i] === "}") {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  private normalizeParsedKeys(
    parsed: Record<string, unknown>,
  ): Record<string, unknown> {
    const alias: Record<string, string> = {
      request_number: "requestNumber",
      insurance_company_reference_number: "insuranceCompanyReferenceNumber",
      patient_name: "patientName",
      patient_birthdate: "patientBirthdate",
      patient_birth_date: "patientBirthdate",
      patient_nationality: "patientNationality",
      pickup_point: "pickupPoint",
      dropoff_point: "dropoffPoint",
      drop_off_point: "dropoffPoint",
      date_of_requested_transportation: "dateOfRequestedTransportation",
      estimated_pickup_time: "estimatedPickupTime",
      estimated_dropoff_time: "estimatedDropoffTime",
      estimated_drop_off_time: "estimatedDropoffTime",
      mode_of_transport: "modeOfTransport",
      medical_crew_required: "medicalCrewRequired",
      has_companion: "hasCompanion",
    };
    const out: Record<string, unknown> = { ...parsed };
    for (const [from, to] of Object.entries(alias)) {
      if (parsed[from] !== undefined && out[to] === undefined)
        out[to] = parsed[from];
    }
    return out;
  }

  private toStr(value: unknown): string | undefined {
    if (value == null) return undefined;
    if (typeof value === "string") return value.trim() || undefined;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    return undefined;
  }

  /**
   * Include in response only if value is a valid date/time string (e.g. ISO 8601).
   * Omit placeholders ("unknown", "n/a", etc.) and unparseable strings so the API never returns invalid dates.
   */
  private toValidDateOrTime(value: unknown): string | undefined {
    const s = this.toStr(value);
    if (s == null) return undefined;
    const lower = s.toLowerCase();
    if (
      lower === "unknown" ||
      lower === "n/a" ||
      lower === "na" ||
      lower === "tbd" ||
      lower === "tba" ||
      lower === "-"
    ) {
      return undefined;
    }
    const date = new Date(s);
    return Number.isNaN(date.getTime()) ? undefined : s;
  }

  private toBool(value: unknown): boolean | undefined {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return undefined;
  }

  private normalizeResponse(
    parsed: Record<string, unknown>,
    emailReceivedAt: Date | null,
    type?: "transport" | "medical_case",
  ): ExtractFromEmailResponseDto {
    const requestType = parsed.requestType as string | undefined;
    const validType =
      requestType === "transport" || requestType === "medical_case"
        ? requestType
        : (type ?? undefined);

    const receivedAt = emailReceivedAt
      ? emailReceivedAt.toISOString()
      : undefined;

    const modeRaw = this.toStr(parsed.modeOfTransport)?.toLowerCase();
    const validMode =
      modeRaw === "lemozen" || modeRaw === "als" || modeRaw === "bls"
        ? modeRaw
        : undefined;

    const includeTransport = type === undefined || type === "transport";
    const includeMedical = type === undefined || type === "medical_case";

    return {
      requestNumber: this.toStr(parsed.requestNumber),
      receivedAt,
      insuranceCompanyReferenceNumber: this.toStr(
        parsed.insuranceCompanyReferenceNumber,
      ),
      patientName: this.toStr(parsed.patientName),
      patientBirthdate: this.toValidDateOrTime(parsed.patientBirthdate),
      patientNationality: this.toStr(parsed.patientNationality),
      diagnosis: this.toStr(parsed.diagnosis),
      notes: this.toStr(parsed.notes),
      requestType: validType,
      ...(includeTransport && {
        pickupPoint: this.toStr(parsed.pickupPoint),
        dropoffPoint: this.toStr(parsed.dropoffPoint),
        dateOfRequestedTransportation: this.toValidDateOrTime(
          parsed.dateOfRequestedTransportation,
        ),
        estimatedPickupTime: this.toValidDateOrTime(parsed.estimatedPickupTime),
        estimatedDropoffTime: this.toValidDateOrTime(
          parsed.estimatedDropoffTime,
        ),
        modeOfTransport: validMode,
        medicalCrewRequired: this.toBool(parsed.medicalCrewRequired),
        hasCompanion: this.toBool(parsed.hasCompanion),
      }),
      ...(includeMedical && {
        caseProviderReferenceNumber: this.toStr(
          parsed.caseProviderReferenceNumber,
        ),
        admissionDate: this.toValidDateOrTime(parsed.admissionDate),
        dischargeDate: this.toValidDateOrTime(parsed.dischargeDate),
        country: this.toStr(parsed.country),
        city: this.toStr(parsed.city),
        medicalProviderName: this.toStr(parsed.medicalProviderName),
        motherInsuranceCompany: this.toStr(parsed.motherInsuranceCompany),
      }),
    };
  }
}
