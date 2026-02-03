import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";

export interface EmailRecipient {
  emailAddress: string;
  displayName?: string;
}

export interface SendEmailRequest {
  mailboxId: string;
  subject: string;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  bodyText?: string;
  bodyHtml?: string;
  inReplyTo?: string;
  references?: string;
}

export interface SendEmailResponse {
  id: string;
  mailboxId: string;
  messageId: string;
  threadId: string | null;
  subject: string;
  sentAt: Date;
  direction: "outgoing";
}

export const useSendEmailCommand = () => {
  const queryClient = useQueryClient();

  const sendEmailMutation = useMutation({
    mutationFn: async (
      request: SendEmailRequest,
    ): Promise<SendEmailResponse> => {
      return await apiClient
        .post("emails/send", { json: request })
        .json<SendEmailResponse>();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      message.success("Email sent successfully");
    },

    onError: (error: Error) => {
      message.error(error.message || "Failed to send email");
    },
  });

  return { sendEmailMutation };
};
