import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import type { IMailboxSubscriptionRepository } from "../../domain/interfaces/mailbox-subscription.repository.interface";
import { MailboxSubscription } from "../../domain/entities/mailbox-subscription.entity";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

interface SubscriptionResponse {
  id: string;
  resource: string;
  changeType: string;
  notificationUrl: string;
  expirationDateTime: string;
  clientState?: string;
}

/** Safely get error details for logging (avoids unsafe any). */
function getErrorDetails(error: unknown): {
  message: string;
  responseData?: unknown;
  responseStatus?: number;
  statusCode?: number;
} {
  const e = error as Record<string, unknown>;
  const response = e?.response as Record<string, unknown> | undefined;
  const message =
    error instanceof Error
      ? error.message
      : typeof e?.message === "string"
        ? e.message
        : "Unknown error";
  const responseData = response?.data ?? e?.response;
  const responseStatus =
    typeof response?.status === "number" ? response.status : undefined;
  const statusCode =
    typeof e?.statusCode === "number" ? e.statusCode : responseStatus;
  return { message, responseData, responseStatus, statusCode };
}

/**
 * Delta response from Microsoft Graph
 */
export interface DeltaResponse<T> {
  "@odata.context"?: string;
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
  value: T[];
}

/**
 * Microsoft Graph attachment metadata (list response, no contentBytes)
 */
export interface GraphAttachmentMeta {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
  "@odata.type"?: string;
}

/**
 * Microsoft Graph Message response
 */
export interface GraphMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  body: {
    contentType: "text" | "html";
    content: string;
  };
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  ccRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  bccRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  replyTo: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  sentDateTime: string;
  receivedDateTime: string;
  hasAttachments: boolean;
  internetMessageId: string;
  conversationId: string;
  importance: "low" | "normal" | "high";
  isRead: boolean;
}

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);
  private cachedToken: CachedToken | undefined;

  constructor(
    private readonly http: HttpService,
    private readonly configService: ConfigService,
    @Inject("IMailboxSubscriptionRepository")
    private readonly subscriptionRepository: IMailboxSubscriptionRepository,
  ) {}

  /**
   * Gets an access token for Microsoft Graph API using client credentials flow
   * Uses MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET from environment variables
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (with 30 second buffer)
    if (this.cachedToken && this.cachedToken.expiresAt - 30_000 > now) {
      return this.cachedToken.accessToken;
    }

    const tenantId = this.configService.get<string>("MS_TENANT_ID");
    const clientId = this.configService.get<string>("MS_CLIENT_ID");
    const clientSecret = this.configService.get<string>("MS_CLIENT_SECRET");

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        "Missing Microsoft Graph credentials (MS_TENANT_ID/MS_CLIENT_ID/MS_CLIENT_SECRET)",
      );
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams();
    body.set("client_id", clientId);
    body.set("client_secret", clientSecret);
    body.set("grant_type", "client_credentials");
    body.set("scope", "https://graph.microsoft.com/.default");

    const response = await firstValueFrom(
      this.http.post<{
        access_token: string;
        expires_in: number;
      }>(tokenUrl, body.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    );

    this.cachedToken = {
      accessToken: response.data.access_token,
      expiresAt: now + response.data.expires_in * 1000,
    };

    return this.cachedToken.accessToken;
  }

  async subscribeToMessages(
    accessToken?: string,
    mailboxEmail?: string,
  ): Promise<SubscriptionResponse> {
    const token = accessToken || (await this.getAccessToken());
    const url = "https://graph.microsoft.com/v1.0/subscriptions";

    const expirationDate = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days (safe for messages)
    ).toISOString();

    const webhookBaseUrl = this.configService.get<string>(
      "WEBHOOK_BASE_URL",
      "https://yourdomain.com",
    );

    // Get mailbox email from parameter or environment variable
    const email =
      mailboxEmail ||
      this.configService.get<string>("MAILBOX_EMAIL", "support@imedizin.com");

    // Use /users/{email} format for application permissions (client credentials)
    const resource = `/users/${email}/mailFolders('inbox')/messages`;

    const body = {
      changeType: "created", // Only track new messages arriving
      notificationUrl: `${webhookBaseUrl}/mailbox/webhooks/graph`,
      resource,
      expirationDateTime: expirationDate,
      clientState: this.configService.get<string>(
        "WEBHOOK_CLIENT_STATE",
        "my-super-secret",
      ),
    };

    try {
      const response = await firstValueFrom(
        this.http.post<SubscriptionResponse>(url, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      );

      return response.data;
    } catch (error: unknown) {
      const { message, responseData } = getErrorDetails(error);
      const errorDetails = responseData ?? message;
      this.logger.error(
        `Failed to create inbox subscription for ${email}. Request body: ${JSON.stringify(body)}. Error: ${JSON.stringify(errorDetails)}`,
      );
      throw error;
    }
  }

  async subscribeToSpamMessages(
    accessToken?: string,
    mailboxEmail?: string,
  ): Promise<SubscriptionResponse> {
    const token = accessToken || (await this.getAccessToken());
    const url = "https://graph.microsoft.com/v1.0/subscriptions";

    const expirationDate = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days (safe for messages)
    ).toISOString();

    const webhookBaseUrl = this.configService.get<string>(
      "WEBHOOK_BASE_URL",
      "https://yourdomain.com",
    );

    // Get mailbox email from parameter or environment variable
    const email =
      mailboxEmail ||
      this.configService.get<string>("MAILBOX_EMAIL", "support@imedizin.com");

    // Use /users/{email} format for application permissions (client credentials)
    const resource = `/users/${email}/mailFolders('junkemail')/messages`;

    const body = {
      changeType: "created", // Only track new spam messages arriving
      notificationUrl: `${webhookBaseUrl}/mailbox/webhooks/graph`,
      resource, // Spam/Junk Email folder
      expirationDateTime: expirationDate,
      clientState: this.configService.get<string>(
        "WEBHOOK_CLIENT_STATE",
        "my-super-secret",
      ),
    };

    try {
      const response = await firstValueFrom(
        this.http.post<SubscriptionResponse>(url, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      );

      return response.data;
    } catch (error: unknown) {
      const { message, responseData } = getErrorDetails(error);
      const errorDetails = responseData as Record<string, unknown> | undefined;
      const errorMessage =
        (typeof errorDetails?.error === "object" &&
        errorDetails?.error !== null &&
        "message" in errorDetails.error
          ? String((errorDetails.error as Record<string, unknown>).message)
          : null) ?? message;

      // Check if it's a webhook URL resolution error
      if (
        (typeof errorMessage === "string" &&
          errorMessage.includes("could not be resolved")) ||
        (typeof errorMessage === "string" &&
          errorMessage.includes("remote name"))
      ) {
        this.logger.error(
          `Failed to create spam subscription: Webhook URL is not accessible. Please ensure your Cloudflare tunnel is running and WEBHOOK_BASE_URL is correct. Current URL: ${webhookBaseUrl}`,
        );
      } else {
        this.logger.error(
          `Failed to create spam subscription for ${email}. Request body: ${JSON.stringify(body)}. Error: ${JSON.stringify(errorDetails)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Create a subscription with a custom resource path
   * @param resource - Resource path (e.g., /users/{email}/mailFolders('inbox')/messages)
   * @param accessToken - Optional access token
   * @param mailboxEmail - Optional mailbox email (used for logging)
   */
  async createSubscription(
    resource: string,
    accessToken?: string,
    mailboxEmail?: string,
  ): Promise<SubscriptionResponse> {
    const token = accessToken || (await this.getAccessToken());
    const url = "https://graph.microsoft.com/v1.0/subscriptions";

    const expirationDate = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days (safe for messages)
    ).toISOString();

    const webhookBaseUrl = this.configService.get<string>(
      "WEBHOOK_BASE_URL",
      "https://yourdomain.com",
    );

    const body = {
      changeType: "created",
      notificationUrl: `${webhookBaseUrl}/mailbox/webhooks/graph`,
      resource,
      expirationDateTime: expirationDate,
      clientState: this.configService.get<string>(
        "WEBHOOK_CLIENT_STATE",
        "my-super-secret",
      ),
    };

    try {
      const response = await firstValueFrom(
        this.http.post<SubscriptionResponse>(url, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      );

      return response.data;
    } catch (error: unknown) {
      const { responseData, message } = getErrorDetails(error);
      const errorDetails = responseData ?? message;
      const email = mailboxEmail || "unknown";
      this.logger.error(
        `Failed to create subscription for ${email} with resource ${resource}. Request body: ${JSON.stringify(body)}. Error: ${JSON.stringify(errorDetails)}`,
      );
      throw error;
    }
  }

  async listSubscriptions(): Promise<SubscriptionResponse[]> {
    const token = await this.getAccessToken();
    const url = "https://graph.microsoft.com/v1.0/subscriptions";

    try {
      const response = await firstValueFrom(
        this.http.get<{ value: SubscriptionResponse[] }>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      );

      return response.data.value || [];
    } catch (error) {
      this.logger.error(
        "Failed to list subscriptions from Microsoft Graph",
        error,
      );
      throw error;
    }
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      const url = `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`;

      await firstValueFrom(
        this.http.delete(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      this.logger.log(
        `Successfully deleted subscription ${subscriptionId} from Microsoft Graph`,
      );
    } catch (error: unknown) {
      const { message, responseStatus } = getErrorDetails(error);
      if (responseStatus === 404) {
        this.logger.warn(
          `Subscription ${subscriptionId} not found in Microsoft Graph (may already be deleted)`,
        );
        return;
      }
      this.logger.error(
        `Failed to delete subscription ${subscriptionId} from Microsoft Graph: ${message}`,
      );
      throw error;
    }
  }

  async verifyMailboxExists(email: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}`;

      await firstValueFrom(
        this.http.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    } catch (error: unknown) {
      const { message, responseStatus } = getErrorDetails(error);
      if (responseStatus === 404) {
        throw new BadRequestException(
          `Mailbox ${email} does not exist in Microsoft 365. Please ensure the user/mailbox exists in your tenant.`,
        );
      }
      this.logger.error(`Error verifying mailbox ${email}: ${message}`);
      throw error;
    }
  }

  /**
   * Verify that a domain exists in the Microsoft 365 tenant
   * @param domain - Domain name (e.g., "example.com")
   */
  async verifyDomainExists(domain: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      // Microsoft Graph uses the domain name as the ID
      const url = `https://graph.microsoft.com/v1.0/domains/${encodeURIComponent(domain)}`;

      await firstValueFrom(
        this.http.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    } catch (error: unknown) {
      const { message, responseStatus } = getErrorDetails(error);
      if (responseStatus === 404) {
        throw new BadRequestException(
          `Domain ${domain} does not exist in your Microsoft 365 tenant. Please ensure the domain is added and verified in your Azure AD/Microsoft 365 admin center.`,
        );
      }
      this.logger.error(`Error verifying domain ${domain}: ${message}`);
      throw error;
    }
  }

  async createSubscriptionsForMailbox(mailboxEmail: string): Promise<{
    inboxSubscriptionId: string | null;
    spamSubscriptionId: string | null;
  }> {
    const result = {
      inboxSubscriptionId: null as string | null,
      spamSubscriptionId: null as string | null,
    };

    const inboxResource = `/users/${mailboxEmail}/mailFolders('inbox')/messages`;
    const spamResource = `/users/${mailboxEmail}/mailFolders('junkemail')/messages`;

    // Check if subscriptions already exist
    const existingInboxSub =
      await this.subscriptionRepository.findByMailboxIdAndResource(
        mailboxEmail,
        inboxResource,
      );
    const existingSpamSub =
      await this.subscriptionRepository.findByMailboxIdAndResource(
        mailboxEmail,
        spamResource,
      );

    // Create inbox subscription if it doesn't exist
    if (!existingInboxSub) {
      try {
        const inboxSubscription = await this.subscribeToMessages(
          undefined,
          mailboxEmail,
        );
        this.logger.log(
          `Successfully subscribed to inbox messages for ${mailboxEmail}. Subscription ID: ${inboxSubscription.id}`,
        );

        // Save to database
        const inboxSubEntity = new MailboxSubscription(
          "", // Will be generated by database
          inboxSubscription.id,
          mailboxEmail,
          inboxResource,
          inboxSubscription.notificationUrl,
          new Date(inboxSubscription.expirationDateTime),
          inboxSubscription.clientState,
          inboxSubscription.changeType,
        );
        await this.subscriptionRepository.save(inboxSubEntity);
        result.inboxSubscriptionId = inboxSubscription.id;
      } catch (error: unknown) {
        const { message } = getErrorDetails(error);
        this.logger.error(
          `Failed to create inbox subscription for ${mailboxEmail}: ${message}`,
        );
        // Don't throw - allow mailbox creation to succeed even if subscription fails
      }
    } else {
      this.logger.log(
        `Inbox subscription already exists for ${mailboxEmail} (ID: ${existingInboxSub.subscriptionId})`,
      );
      result.inboxSubscriptionId = existingInboxSub.subscriptionId;
    }

    // Create spam subscription if it doesn't exist
    if (!existingSpamSub) {
      try {
        const spamSubscription = await this.subscribeToSpamMessages(
          undefined,
          mailboxEmail,
        );
        this.logger.log(
          `Successfully subscribed to spam messages for ${mailboxEmail}. Subscription ID: ${spamSubscription.id}`,
        );

        // Save to database
        const spamSubEntity = new MailboxSubscription(
          "", // Will be generated by database
          spamSubscription.id,
          mailboxEmail,
          spamResource,
          spamSubscription.notificationUrl,
          new Date(spamSubscription.expirationDateTime),
          spamSubscription.clientState,
          spamSubscription.changeType,
        );
        await this.subscriptionRepository.save(spamSubEntity);
        result.spamSubscriptionId = spamSubscription.id;
      } catch (error: unknown) {
        const { message } = getErrorDetails(error);
        this.logger.error(
          `Failed to create spam subscription for ${mailboxEmail}: ${message}`,
        );
        // Don't throw - allow mailbox creation to succeed even if subscription fails
      }
    } else {
      this.logger.log(
        `Spam subscription already exists for ${mailboxEmail} (ID: ${existingSpamSub.subscriptionId})`,
      );
      result.spamSubscriptionId = existingSpamSub.subscriptionId;
    }

    return result;
  }

  /**
   * Get a specific message from Microsoft Graph
   * @param userId - User ID or email address
   * @param messageId - Microsoft Graph message ID
   */
  async getMessage(userId: string, messageId: string): Promise<GraphMessage> {
    const token = await this.getAccessToken();
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}/messages/${encodeURIComponent(messageId)}`;

    try {
      const response = await firstValueFrom(
        this.http.get<GraphMessage>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      );

      return response.data;
    } catch (error: unknown) {
      const { responseData, message } = getErrorDetails(error);
      const errorDetails = responseData ?? message;
      this.logger.error(
        `Failed to get message ${messageId} for user ${userId}. Error: ${JSON.stringify(errorDetails)}`,
      );
      throw error;
    }
  }

  /**
   * Get raw MIME content of a message
   * @param userId - User ID or email address
   * @param messageId - Microsoft Graph message ID
   */
  async getMessageRawContent(
    userId: string,
    messageId: string,
  ): Promise<string> {
    const token = await this.getAccessToken();
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}/messages/${encodeURIComponent(messageId)}/$value`;

    try {
      const response = await firstValueFrom(
        this.http.get<string>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "text" as const,
        }),
      );

      return response.data;
    } catch (error: unknown) {
      const { responseData, message } = getErrorDetails(error);
      const errorDetails = responseData ?? message;
      this.logger.error(
        `Failed to get raw content for message ${messageId}. Error: ${JSON.stringify(errorDetails)}`,
      );
      throw error;
    }
  }

  /**
   * List message attachments (metadata only; use getAttachmentContent for bytes)
   */
  async listMessageAttachments(
    userId: string,
    messageId: string,
  ): Promise<GraphAttachmentMeta[]> {
    const token = await this.getAccessToken();
    const params = new URLSearchParams({
      $select: "id,name,contentType,size,isInline",
    });
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}/messages/${encodeURIComponent(messageId)}/attachments?${params.toString()}`;

    try {
      const response = await firstValueFrom(
        this.http.get<DeltaResponse<GraphAttachmentMeta>>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      );
      return response.data.value ?? [];
    } catch (error: unknown) {
      const { responseData, message } = getErrorDetails(error);
      const errorDetails = responseData ?? message;
      this.logger.error(
        `Failed to list attachments for message ${messageId}: ${JSON.stringify(errorDetails)}`,
      );
      throw error;
    }
  }

  /**
   * Get attachment raw content (binary)
   */
  async getAttachmentContent(
    userId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<Buffer> {
    const token = await this.getAccessToken();
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}/$value`;

    try {
      const response = await firstValueFrom(
        this.http.get<ArrayBuffer>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "arraybuffer",
        }),
      );
      return Buffer.from(response.data);
    } catch (error: unknown) {
      const { responseData, message } = getErrorDetails(error);
      const errorDetails = responseData ?? message;
      this.logger.error(
        `Failed to get attachment ${attachmentId} for message ${messageId}: ${JSON.stringify(errorDetails)}`,
      );
      throw error;
    }
  }

  /**
   * Bootstrap a delta link with no history: use a "from-now" filter so the initial
   * result set is empty or tiny. Store the returned deltaLink for future syncs.
   * Future syncs use that link and receive only changes from this moment.
   * Uses receivedDateTime ge (now - 1 min) to avoid missing messages that arrive during setup.
   */
  async bootstrapDeltaLink(
    mailboxEmail: string,
  ): Promise<{ deltaLink: string }> {
    const token = await this.getAccessToken();
    const baseline = new Date(Date.now() - 60_000);
    const baselineIso = baseline.toISOString();
    const baseUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxEmail)}/mailFolders/inbox/messages/delta`;
    const params = new URLSearchParams({
      $select: "id,receivedDateTime",
      $filter: `receivedDateTime ge ${baselineIso}`,
      $top: "100",
    });
    let nextUrl = `${baseUrl}?${params.toString()}`;
    let newDeltaLink: string | undefined;

    try {
      while (nextUrl) {
        this.logger.log(
          `Bootstrap delta (from-now): ${nextUrl.substring(0, 100)}...`,
        );
        const response = await firstValueFrom(
          this.http.get<DeltaResponse<unknown>>(nextUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Prefer: "odata.maxpagesize=50",
            },
          }),
        );
        const data = response.data;
        if (data["@odata.nextLink"]) {
          nextUrl = data["@odata.nextLink"];
        } else if (data["@odata.deltaLink"]) {
          newDeltaLink = data["@odata.deltaLink"];
          break;
        } else {
          break;
        }
      }

      if (!newDeltaLink) {
        throw new Error("Bootstrap delta did not return a deltaLink");
      }
      this.logger.log(
        `Bootstrap delta complete for ${mailboxEmail}, deltaLink obtained`,
      );
      return { deltaLink: newDeltaLink };
    } catch (error: unknown) {
      const { responseData, message } = getErrorDetails(error);
      const errorDetails = responseData ?? message;
      this.logger.error(
        `Bootstrap delta failed for ${mailboxEmail}. Error: ${JSON.stringify(errorDetails)}`,
      );
      throw error;
    }
  }

  /**
   * Get messages using delta query (initial or incremental sync)
   * @param mailboxEmail - Mailbox email address
   * @param deltaLink - Previous delta link (null for initial sync)
   * @returns Messages and the new delta link
   */
  async getMessagesDelta(
    mailboxEmail: string,
    deltaLink: string | null = null,
  ): Promise<{ messages: GraphMessage[]; deltaLink: string }> {
    const token = await this.getAccessToken();
    const allMessages: GraphMessage[] = [];
    let nextUrl: string;

    if (deltaLink) {
      // Use existing delta link for incremental sync
      nextUrl = deltaLink;
    } else {
      // Initial sync - start fresh
      nextUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxEmail)}/mailFolders/inbox/messages/delta?$select=id,subject,bodyPreview,body,from,toRecipients,ccRecipients,bccRecipients,replyTo,sentDateTime,receivedDateTime,hasAttachments,internetMessageId,conversationId,importance,isRead`;
    }

    let newDeltaLink: string | undefined;

    try {
      // Follow pagination until we get a deltaLink
      while (nextUrl) {
        this.logger.log(`Fetching delta: ${nextUrl.substring(0, 100)}...`);

        const response = await firstValueFrom(
          this.http.get<DeltaResponse<GraphMessage>>(nextUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Prefer: "odata.maxpagesize=50",
            },
          }),
        );

        const data = response.data;

        // Add messages from this page
        if (data.value && data.value.length > 0) {
          allMessages.push(...data.value);
          this.logger.log(
            `Fetched ${data.value.length} messages (total: ${allMessages.length})`,
          );
        }

        // Check for next page or delta link
        if (data["@odata.nextLink"]) {
          nextUrl = data["@odata.nextLink"];
        } else if (data["@odata.deltaLink"]) {
          newDeltaLink = data["@odata.deltaLink"];
          break;
        } else {
          break;
        }
      }

      if (!newDeltaLink) {
        throw new Error("Delta query did not return a deltaLink");
      }

      this.logger.log(
        `Delta sync complete for ${mailboxEmail}: ${allMessages.length} messages`,
      );

      return {
        messages: allMessages,
        deltaLink: newDeltaLink,
      };
    } catch (error: unknown) {
      const { responseData, message } = getErrorDetails(error);
      const errorDetails = responseData ?? message;
      this.logger.error(
        `Failed to get messages delta for ${mailboxEmail}. Error: ${JSON.stringify(errorDetails)}`,
      );
      throw error;
    }
  }

  /**
   * Format a recipient for MIME headers (RFC 5322)
   */
  private formatMimeAddress(
    email: string,
    displayName?: string | null,
  ): string {
    const addr = `<${email}>`;
    if (displayName && displayName.trim()) {
      const escaped = displayName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `"${escaped}" ${addr}`;
    }
    return addr;
  }

  /**
   * Build MIME message string for a reply (includes In-Reply-To and References;
   * Graph JSON sendMail only allows x-* custom headers, so we use MIME for replies)
   */
  private buildMimeReplyMessage(
    mailboxEmail: string,
    to: Array<{ emailAddress: string; displayName?: string }>,
    subject: string,
    bodyText: string,
    bodyHtml: string | undefined,
    cc: Array<{ emailAddress: string; displayName?: string }> | undefined,
    bcc: Array<{ emailAddress: string; displayName?: string }> | undefined,
    inReplyTo: string,
    references: string | undefined,
  ): string {
    const crlf = "\r\n";
    const lines: string[] = [];

    lines.push(`From: ${this.formatMimeAddress(mailboxEmail, null)}`);
    lines.push(
      `To: ${to.map((r) => this.formatMimeAddress(r.emailAddress, r.displayName)).join(", ")}`,
    );
    if (cc && cc.length > 0) {
      lines.push(
        `Cc: ${cc.map((r) => this.formatMimeAddress(r.emailAddress, r.displayName)).join(", ")}`,
      );
    }
    if (bcc && bcc.length > 0) {
      lines.push(
        `Bcc: ${bcc.map((r) => this.formatMimeAddress(r.emailAddress, r.displayName)).join(", ")}`,
      );
    }
    lines.push(`Subject: ${subject}`);
    lines.push(`Date: ${new Date().toUTCString()}`);
    lines.push(`In-Reply-To: ${inReplyTo}`);
    if (references) {
      lines.push(`References: ${references}`);
    }
    lines.push("MIME-Version: 1.0");
    const contentType = bodyHtml
      ? 'text/html; charset="utf-8"'
      : 'text/plain; charset="utf-8"';
    lines.push(`Content-Type: ${contentType}`);
    lines.push("");
    lines.push(bodyHtml || bodyText);

    return lines.join(crlf);
  }

  /**
   * Send an email via Microsoft Graph API
   * @param mailboxEmail - Email address of the mailbox sending from
   * @param to - Array of recipients (to)
   * @param subject - Email subject
   * @param bodyText - Plain text body (optional)
   * @param bodyHtml - HTML body (optional)
   * @param cc - CC recipients (optional)
   * @param bcc - BCC recipients (optional)
   * @param inReplyTo - Message-ID of email being replied to (optional)
   * @param references - Space-separated Message-IDs for threading (optional)
   * @returns The message ID of the sent email
   */
  async sendEmail(
    mailboxEmail: string,
    to: Array<{ emailAddress: string; displayName?: string }>,
    subject: string,
    bodyText?: string,
    bodyHtml?: string,
    cc?: Array<{ emailAddress: string; displayName?: string }>,
    bcc?: Array<{ emailAddress: string; displayName?: string }>,
    inReplyTo?: string,
    references?: string,
  ): Promise<string> {
    const token = await this.getAccessToken();
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxEmail)}/sendMail`;

    const bodyContent = bodyHtml || bodyText || "";

    try {
      if (inReplyTo) {
        // Graph JSON sendMail only allows internetMessageHeaders with names starting with x-.
        // Use MIME format so we can include In-Reply-To and References for proper threading.
        const mimeMessage = this.buildMimeReplyMessage(
          mailboxEmail,
          to,
          subject,
          bodyContent,
          bodyHtml,
          cc,
          bcc,
          inReplyTo,
          references,
        );
        const mimeBase64 = Buffer.from(mimeMessage, "utf-8").toString("base64");
        await firstValueFrom(
          this.http.post(url, mimeBase64, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "text/plain",
            },
          }),
        );
      } else {
        // JSON format for new (non-reply) messages
        type GraphSendMailPayload = {
          message: {
            subject: string;
            body: { contentType: string; content: string };
            toRecipients: Array<{
              emailAddress: { address: string; name: string | null };
            }>;
            ccRecipients?: Array<{
              emailAddress: { address: string; name: string | null };
            }>;
            bccRecipients?: Array<{
              emailAddress: { address: string; name: string | null };
            }>;
          };
        };
        const payload: GraphSendMailPayload = {
          message: {
            subject,
            body: {
              contentType: bodyHtml ? "html" : "text",
              content: bodyContent,
            },
            toRecipients: to.map((r) => ({
              emailAddress: {
                address: r.emailAddress,
                name: r.displayName || null,
              },
            })),
          },
        };
        if (cc && cc.length > 0) {
          payload.message.ccRecipients = cc.map((r) => ({
            emailAddress: {
              address: r.emailAddress,
              name: r.displayName || null,
            },
          }));
        }
        if (bcc && bcc.length > 0) {
          payload.message.bccRecipients = bcc.map((r) => ({
            emailAddress: {
              address: r.emailAddress,
              name: r.displayName || null,
            },
          }));
        }
        await firstValueFrom(
          this.http.post(url, payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        );
      }

      this.logger.log(`Email sent successfully from ${mailboxEmail}`);

      // Wait a moment for the email to appear in sentitems
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fetch recent sent messages (simplified query - no complex filter)
      // We'll filter by subject in memory
      const sentItemsUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxEmail)}/mailFolders('sentitems')/messages?$top=10&$orderby=sentDateTime desc&$select=id,subject,internetMessageId,sentDateTime`;

      const sentResponse = await firstValueFrom(
        this.http.get<DeltaResponse<GraphMessage>>(sentItemsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      );

      if (sentResponse.data.value && sentResponse.data.value.length > 0) {
        // Find the message with matching subject (most recent first)
        const sentMessage = sentResponse.data.value.find(
          (msg) => msg.subject === subject,
        );

        if (sentMessage) {
          this.logger.log(
            `Retrieved sent message with ID: ${sentMessage.id} (internetMessageId: ${sentMessage.internetMessageId})`,
          );
          return sentMessage.internetMessageId || sentMessage.id;
        }
      }

      // Fallback: if we can't find it, return placeholder
      // The command will retry with getRecentSentMessages
      this.logger.warn(
        `Could not find sent message in sentitems by subject, will retry in command`,
      );
      return "pending";
    } catch (error: unknown) {
      const { responseData, message, responseStatus, statusCode } =
        getErrorDetails(error);
      const errorDetails = responseData as Record<string, unknown> | undefined;
      const errorMessage =
        (errorDetails?.error != null &&
        typeof errorDetails.error === "object" &&
        "message" in errorDetails.error
          ? String((errorDetails.error as Record<string, unknown>).message)
          : null) ??
        (typeof errorDetails?.message === "string"
          ? errorDetails.message
          : null) ??
        message;

      const code = statusCode ?? responseStatus;
      this.logger.error(
        `Failed to send email from ${mailboxEmail}. Status: ${code}, Error: ${JSON.stringify(responseData ?? message)}`,
      );

      const descriptiveError = new Error(
        `Failed to send email: ${errorMessage}${code != null ? ` (HTTP ${code})` : ""}`,
      ) as Error & { statusCode?: number; originalError?: unknown };
      descriptiveError.statusCode = code;
      descriptiveError.originalError = responseData ?? errorDetails;
      throw descriptiveError;
    }
  }

  /**
   * Get a message from sentitems folder by internetMessageId
   * @param mailboxEmail - Email address of the mailbox
   * @param internetMessageId - Internet Message-ID to search for
   * @returns The Graph message object
   */
  async getSentMessageByInternetMessageId(
    mailboxEmail: string,
    internetMessageId: string,
  ): Promise<GraphMessage | null> {
    const token = await this.getAccessToken();
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxEmail)}/mailFolders('sentitems')/messages?$filter=internetMessageId eq '${encodeURIComponent(internetMessageId)}'&$top=1`;

    try {
      const response = await firstValueFrom(
        this.http.get<DeltaResponse<GraphMessage>>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      );

      if (response.data.value && response.data.value.length > 0) {
        return response.data.value[0];
      }

      return null;
    } catch (error: unknown) {
      const { responseData, message } = getErrorDetails(error);
      const errorDetails = responseData ?? message;
      this.logger.error(
        `Failed to get sent message by internetMessageId ${internetMessageId}. Error: ${JSON.stringify(errorDetails)}`,
      );
      throw error;
    }
  }

  /**
   * Get recent sent messages from sentitems folder
   * @param mailboxEmail - Email address of the mailbox
   * @param top - Number of recent messages to retrieve (default: 10)
   * @returns Array of Graph message objects
   */
  async getRecentSentMessages(
    mailboxEmail: string,
    top: number = 10,
  ): Promise<GraphMessage[]> {
    const token = await this.getAccessToken();
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxEmail)}/mailFolders('sentitems')/messages?$top=${top}&$orderby=sentDateTime desc&$select=id,subject,bodyPreview,body,from,toRecipients,ccRecipients,bccRecipients,replyTo,sentDateTime,receivedDateTime,hasAttachments,internetMessageId,conversationId,importance,isRead`;

    try {
      const response = await firstValueFrom(
        this.http.get<DeltaResponse<GraphMessage>>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      );

      return response.data.value || [];
    } catch (error: unknown) {
      const { responseData, message } = getErrorDetails(error);
      const errorDetails = responseData ?? message;
      this.logger.error(
        `Failed to get recent sent messages. Error: ${JSON.stringify(errorDetails)}`,
      );
      throw error;
    }
  }
}
