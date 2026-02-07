import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { TransportAssistanceRequest } from "@/types/assistance-request";
import {
  type AssistanceRequestApiResponse,
  mapApiToAssistanceRequest,
} from "../api-types";
import type { TransportAssistanceRequestFormValues } from "@/components/forms/TransportAssistanceRequestForm";

function buildTransportPayload(
  values: TransportAssistanceRequestFormValues
): Record<string, unknown> {
  return {
    requestNumber: values.requestNumber,
    status: values.status ?? "pending",
    receivedAt: values.receivedAt,
    patientFullName: values.patientName,
    patientBirthDate: values.patientBirthdate ?? undefined,
    patientNationalityCode: values.patientNationality ?? undefined,
    pickupPoint: values.pickupPoint,
    dropoffPoint: values.dropOffPoint,
    providerReferenceNumber: values.insuranceCompanyReferenceNumber ?? undefined,
    requestedTransportAt: values.dateOfRequestedTransportation ?? undefined,
    modeOfTransport: values.modeOfTransportation ?? undefined,
    medicalCrewRequired: values.withEscortingMedicalCrew ?? false,
    hasCompanion: values.hasCompanion ?? false,
    estimatedPickupTime: values.estimatedPickupTime ?? undefined,
    estimatedDropoffTime: values.estimatedDropOffTime ?? undefined,
    diagnosis: values.diagnosis ?? undefined,
  };
}

export const useUpdateTransportRequestCommand = (requestId: string) => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (
      values: TransportAssistanceRequestFormValues
    ): Promise<TransportAssistanceRequest> => {
      const payload = buildTransportPayload(values);
      const result = await apiClient
        .patch(`assistance-requests/transport/${requestId}`, { json: payload })
        .json<ApiResponse<AssistanceRequestApiResponse>>();
      return mapApiToAssistanceRequest(result.data) as TransportAssistanceRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistance-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["assistance-requests", requestId],
      });
      message.success("Transportation request updated");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update transportation request");
    },
  });

  return { updateMutation };
};
