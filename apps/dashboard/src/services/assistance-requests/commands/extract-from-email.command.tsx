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
}

export function useExtractFromEmailCommand() {
  const mutation = useMutation({
    mutationFn: async (emailId: string): Promise<ExtractFromEmailResponse> => {
      const result = await apiClient
        .post("assistance-requests/extract-from-email", {
          json: { emailId },
        })
        .json<ApiResponse<ExtractFromEmailResponse>>();
      return result.data;
    },
    onError: (error: Error) => {
      message.error(error.message || "Could not extract data from email");
    },
  });

  return { extractMutation: mutation };
}
