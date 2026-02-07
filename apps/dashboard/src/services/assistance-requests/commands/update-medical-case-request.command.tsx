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
    requestNumber: values.requestNumber,
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

export const useUpdateMedicalCaseRequestCommand = (requestId: string) => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (
      values: MedicalCaseRequestFormValues
    ): Promise<MedicalCaseAssistanceRequest> => {
      const payload = buildMedicalPayload(values);
      const result = await apiClient
        .patch(`assistance-requests/medical/${requestId}`, { json: payload })
        .json<ApiResponse<AssistanceRequestApiResponse>>();
      return mapApiToAssistanceRequest(result.data) as MedicalCaseAssistanceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistance-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["assistance-requests", requestId],
      });
      message.success("Medical case request updated");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update medical case request");
    },
  });

  return { updateMutation };
};
