import { Inject, Injectable, Logger } from "@nestjs/common";
import type { IEmailRepository } from "../../domain/interfaces/email.repository.interface";

/**
 * Parsed threading headers from raw email source
 */
export interface ThreadingHeaders {
  messageId: string | null;
  inReplyTo: string | null;
  references: string | null;
}

/**
 * Result of thread ID computation
 */
export interface ThreadingResult {
  threadId: string;
  inReplyTo: string | null;
  references: string | null;
}

/**
 * Threading service
 * Handles RFC 5322 compliant email threading using In-Reply-To and References headers
 *
 * Threading algorithm:
 * 1. Parse In-Reply-To and References headers from raw MIME source
 * 2. If In-Reply-To exists, find parent email by that Message-ID
 * 3. If parent exists and has a threadId, use that threadId
 * 4. If no parent found, check References for any known Message-IDs
 * 5. Fallback to Microsoft conversationId if provided
 * 6. If all else fails, use this email's Message-ID as the threadId (new thread)
 */
@Injectable()
export class ThreadingService {
  private readonly logger = new Logger(ThreadingService.name);

  constructor(
    @Inject("IEmailRepository")
    private readonly emailRepository: IEmailRepository,
  ) {}

  /**
   * Parse threading headers from raw RFC email source
   * Handles multiline header values and various formats
   */
  parseHeaders(rawSource: string): ThreadingHeaders {
    if (!rawSource) {
      return { messageId: null, inReplyTo: null, references: null };
    }

    // Split headers from body (headers end at first empty line)
    const headerSection = rawSource.split(/\r?\n\r?\n/)[0] || "";

    // Unfold headers (RFC 5322: long headers can be folded with CRLF + whitespace)
    const unfoldedHeaders = headerSection.replace(/\r?\n[ \t]+/g, " ");

    return {
      messageId: this.extractHeader(unfoldedHeaders, "Message-ID"),
      inReplyTo: this.extractHeader(unfoldedHeaders, "In-Reply-To"),
      references: this.extractReferences(unfoldedHeaders),
    };
  }

  /**
   * Extract a single header value
   * Handles angle brackets around Message-IDs
   */
  private extractHeader(headers: string, name: string): string | null {
    // Case-insensitive header matching
    const regex = new RegExp(`^${name}:\\s*<?([^>\\r\\n]+)>?`, "mi");
    const match = headers.match(regex);

    if (match && match[1]) {
      // Clean up the value - remove any angle brackets and trim
      return match[1].trim().replace(/^<|>$/g, "");
    }

    return null;
  }

  /**
   * Extract References header (may contain multiple Message-IDs)
   * Returns space-separated list of Message-IDs
   */
  private extractReferences(headers: string): string | null {
    const regex = /^References:\s*(.+)$/im;
    const match = headers.match(regex);

    if (match && match[1]) {
      // References can contain multiple Message-IDs in angle brackets
      // Extract all of them and return as space-separated string
      const messageIds = match[1].match(/<[^>]+>/g);
      if (messageIds) {
        return messageIds.map((id) => id.replace(/^<|>$/g, "")).join(" ");
      }
      // If no angle brackets, just return cleaned value
      return match[1].trim();
    }

    return null;
  }

  /**
   * Compute thread ID for an email using hybrid approach:
   * 1. RFC headers (In-Reply-To, References)
   * 2. Microsoft conversationId as fallback
   * 3. Own Message-ID for new threads
   */
  async computeThreadId(
    messageId: string,
    rawSource: string,
    microsoftConversationId: string | null,
  ): Promise<ThreadingResult> {
    const headers = this.parseHeaders(rawSource);

    // Use parsed Message-ID if available, otherwise use provided messageId
    const effectiveMessageId = headers.messageId || messageId;

    // Strategy 1: Try to find parent via In-Reply-To
    if (headers.inReplyTo) {
      const parentEmail = await this.emailRepository.findByMessageId(
        headers.inReplyTo,
      );

      if (parentEmail) {
        this.logger.debug(
          `Found parent email via In-Reply-To: ${parentEmail.id}`,
        );
        return {
          threadId: parentEmail.threadId || parentEmail.messageId,
          inReplyTo: headers.inReplyTo,
          references: headers.references,
        };
      }

      this.logger.debug(
        `In-Reply-To ${headers.inReplyTo} not found in database`,
      );
    }

    // Strategy 2: Try to find any ancestor via References
    if (headers.references) {
      const referenceIds = headers.references.split(/\s+/);

      // Search from most recent to oldest
      for (const refId of referenceIds.reverse()) {
        const ancestorEmail = await this.emailRepository.findByMessageId(refId);

        if (ancestorEmail) {
          this.logger.debug(
            `Found ancestor email via References: ${ancestorEmail.id}`,
          );
          return {
            threadId: ancestorEmail.threadId || ancestorEmail.messageId,
            inReplyTo: headers.inReplyTo,
            references: headers.references,
          };
        }
      }

      this.logger.debug("No ancestors found via References");
    }

    // Strategy 3: Fallback to Microsoft conversationId
    // This helps when we receive replies before the original email
    if (microsoftConversationId) {
      // Check if any email already uses this conversationId as threadId
      // This handles the case where Microsoft grouped them but we haven't seen the parent
      this.logger.debug(
        `Using Microsoft conversationId as threadId: ${microsoftConversationId}`,
      );
      return {
        threadId: microsoftConversationId,
        inReplyTo: headers.inReplyTo,
        references: headers.references,
      };
    }

    // Strategy 4: New thread - use this email's Message-ID
    this.logger.debug(
      `Creating new thread with Message-ID: ${effectiveMessageId}`,
    );
    return {
      threadId: effectiveMessageId,
      inReplyTo: headers.inReplyTo,
      references: headers.references,
    };
  }

  /**
   * Normalize a Message-ID by removing angle brackets and whitespace
   */
  normalizeMessageId(messageId: string): string {
    return messageId.trim().replace(/^<|>$/g, "");
  }

  /**
   * Check if two Message-IDs are equivalent
   */
  messageIdsMatch(id1: string | null, id2: string | null): boolean {
    if (!id1 || !id2) return false;
    return this.normalizeMessageId(id1) === this.normalizeMessageId(id2);
  }
}
