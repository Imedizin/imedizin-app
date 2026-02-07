import { useMutation } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types/api";

export interface ExtractFromEmailResponse {
  requestNumber?: string;
  receivedAt?: string;
  insuranceCompanyReferenceNumber?: string;
  patientName?: string;
  patientBirthdate?: string;
  patientNationality?: string;
  diagnosis?: string;
  notes?: string;
  requestType?: "transport" | "medical_case";
  /** Transportation details (when requestType is transport) */
  pickupPoint?: string;
  dropoffPoint?: string;
  dateOfRequestedTransportation?: string;
  estimatedPickupTime?: string;
  estimatedDropoffTime?: string;
  modeOfTransport?: "lemozen" | "als" | "bls";
  medicalCrewRequired?: boolean;
  hasCompanion?: boolean;
  /** Medical case details (when requestType is medical_case) */
  caseProviderReferenceNumber?: string;
  admissionDate?: string;
  dischargeDate?: string;
  country?: string;
  city?: string;
  medicalProviderName?: string;
  motherInsuranceCompany?: string;
}

export interface ExtractFromEmailParams {
  emailId: string;
  type?: "transport" | "medical_case";
}

/** API response: extracted data plus raw AI output for debugging. */
export type ExtractFromEmailApiResponse = ExtractFromEmailResponse & {
  /** Raw string returned by the AI model (for debugging). */
  rawAiResponse?: string;
};

export function useExtractFromEmailCommand() {
  const mutation = useMutation({
    mutationFn: async (
      params: ExtractFromEmailParams | string
    ): Promise<ExtractFromEmailApiResponse> => {
      const { emailId, type } =
        typeof params === "string" ? { emailId: params, type: undefined } : params;
      const result = await apiClient
        .post("assistance-requests/extract-from-email", {
          json: { emailId, ...(type && { type }) },
        })
        .json<ApiResponse<ExtractFromEmailApiResponse>>();
      return result.data;
    },
    onError: (error: Error) => {
      message.error(error.message || "Could not extract data from email");
    },
  });

  return { extractMutation: mutation };
}
