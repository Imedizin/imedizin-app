import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { MedicalCaseAssistanceRequest } from "@/types/assistance-request";
import {
  type AssistanceRequestApiResponse,
  mapApiToAssistanceRequest,
} from "../api-types";
import type { MedicalCaseRequestFormValues } from "@/components/forms/MedicalCaseRequestForm";

function buildMedicalPayload(
  values: MedicalCaseRequestFormValues
): Record<string, unknown> {
  return {
    requestNumber: values.requestNumber ?? `MC-${Date.now()}`,
    status: values.status ?? "investigation",
    receivedAt: values.receivedAt,
    patientFullName: values.patientName,
    patientBirthDate: values.patientBirthdate || undefined,
    patientNationalityCode: values.patientNationality || undefined,
    providerReferenceNumber: values.insuranceCompanyReferenceNumber ?? undefined,
    caseProviderReferenceNumber: values.caseProviderReferenceNumber ?? undefined,
    admissionDate: values.admissionDate ?? undefined,
    dischargeDate: values.dischargeDate ?? undefined,
    country: values.country ?? undefined,
    city: values.city ?? undefined,
    diagnosis: values.diagnosis ?? undefined,
  };
}

export const useAddMedicalCaseRequestCommand = () => {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (
      values: MedicalCaseRequestFormValues
    ): Promise<MedicalCaseAssistanceRequest> => {
      const payload = buildMedicalPayload(values);
      const result = await apiClient
        .post("assistance-requests/medical", { json: payload })
        .json<ApiResponse<AssistanceRequestApiResponse>>();
      return mapApiToAssistanceRequest(result.data) as MedicalCaseAssistanceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistance-requests"] });
      message.success("Medical case request added");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to add medical case request");
    },
  });

  return { addMutation };
};
