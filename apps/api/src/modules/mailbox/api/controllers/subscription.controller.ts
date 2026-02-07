import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import type { IMailboxSubscriptionRepository } from "../../domain/interfaces/mailbox-subscription.repository.interface";
import type { IMailboxRepository } from "../../domain/interfaces/mailbox.repository.interface";
import { GraphService } from "../../application/services/graph.service";
import { SubscriptionResponseDto } from "../dto/subscription-response.dto";
import { CreateSubscriptionDto } from "../dto/create-subscription.dto";
import { MailboxSubscription } from "../../domain/entities/mailbox-subscription.entity";

/**
 * Subscription controller
 * Handles HTTP requests for subscription management
 */
@Controller("api/subscriptions")
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(
    @Inject("IMailboxSubscriptionRepository")
    private readonly subscriptionRepository: IMailboxSubscriptionRepository,
    @Inject("IMailboxRepository")
    private readonly mailboxRepository: IMailboxRepository,
    private readonly graphService: GraphService,
  ) {}

  /**
   * Get all subscriptions
   * GET /api/subscriptions?source=graph|local
   * @param source - 'graph' to fetch from Microsoft Graph API, 'local' or undefined to fetch from database
   */
  @Get()
  async findAll(
    @Query("source") source?: string,
  ): Promise<{ data: SubscriptionResponseDto[] }> {
    this.logger.log(
      `Fetching all subscriptions (source: ${source || "local"})`,
    );

    // If source is 'graph', fetch from Microsoft Graph API
    if (source === "graph") {
      try {
        const graphSubscriptions = await this.graphService.listSubscriptions();

        // Convert Graph API subscriptions to response DTOs
        // Note: These won't have database IDs, so we'll use subscriptionId as id
        const subscriptions = graphSubscriptions.map((sub) => {
          // Try to find matching subscription in database to get full details
          return {
            id: sub.id, // Use Graph subscription ID as id
            subscriptionId: sub.id,
            mailboxId: this.extractMailboxIdFromResource(sub.resource),
            resource: sub.resource,
            notificationUrl: sub.notificationUrl,
            expirationDateTime: new Date(sub.expirationDateTime),
            clientState: sub.clientState,
            changeType: sub.changeType,
            createdAt: undefined,
            updatedAt: undefined,
          };
        });

        return {
          data: subscriptions.map((s) => new SubscriptionResponseDto(s)),
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.error(
          `Failed to fetch subscriptions from Graph: ${errorMessage}`,
        );
        throw new BadRequestException(
          `Failed to fetch subscriptions from Graph: ${errorMessage}`,
        );
      }
    }

    // Default: fetch from local database
    const mailboxes = await this.mailboxRepository.findAll();
    const allSubscriptions: MailboxSubscription[] = [];

    for (const mailbox of mailboxes) {
      const subscriptions = await this.subscriptionRepository.findByMailboxId(
        mailbox.address,
      );
      allSubscriptions.push(...subscriptions);
    }

    return {
      data: allSubscriptions.map((s) => new SubscriptionResponseDto(s)),
    };
  }

  /**
   * Extract mailbox ID (email) from Graph resource path
   * Example: /users/support@example.com/mailFolders('inbox')/messages -> support@example.com
   */
  private extractMailboxIdFromResource(resource: string): string {
    const match = resource.match(/\/users\/([^/]+)/);
    return match ? match[1] : "unknown";
  }

  /**
   * Delete all subscriptions from Microsoft Graph
   * DELETE /api/subscriptions/graph/all
   */
  @Delete("graph/all")
  @HttpCode(HttpStatus.OK)
  async deleteAllFromGraph(): Promise<{
    deleted: number;
    failed: number;
    errors: string[];
  }> {
    this.logger.log("Deleting all subscriptions from Microsoft Graph");

    try {
      // Fetch all subscriptions from Graph
      const graphSubscriptions = await this.graphService.listSubscriptions();
      this.logger.log(
        `Found ${graphSubscriptions.length} subscriptions in Microsoft Graph`,
      );

      const results = {
        deleted: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Delete each subscription
      for (const subscription of graphSubscriptions) {
        try {
          await this.graphService.deleteSubscription(subscription.id);
          results.deleted++;
          this.logger.log(
            `Successfully deleted subscription ${subscription.id} from Microsoft Graph`,
          );
        } catch (error) {
          results.failed++;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          results.errors.push(
            `Failed to delete subscription ${subscription.id}: ${errorMessage}`,
          );
          this.logger.error(
            `Failed to delete subscription ${subscription.id}: ${errorMessage}`,
          );
        }
      }

      this.logger.log(
        `Completed deletion: ${results.deleted} deleted, ${results.failed} failed`,
      );

      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to fetch subscriptions from Graph: ${errorMessage}`,
      );
      throw new BadRequestException(
        `Failed to fetch subscriptions from Graph: ${errorMessage}`,
      );
    }
  }

  /**
   * Get subscription by subscription ID
   * GET /api/subscriptions/:subscriptionId
   */
  @Get(":subscriptionId")
  async findOne(
    @Param("subscriptionId") subscriptionId: string,
  ): Promise<{ data: SubscriptionResponseDto }> {
    this.logger.log(`Fetching subscription with id: ${subscriptionId}`);
    const subscription =
      await this.subscriptionRepository.findBySubscriptionId(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with id ${subscriptionId} not found`,
      );
    }

    return {
      data: new SubscriptionResponseDto(subscription),
    };
  }

  /**
   * Get all subscriptions for a mailbox
   * GET /api/subscriptions/mailbox/:mailboxId?source=graph|local
   * @param source - 'graph' to fetch from Microsoft Graph API, 'local' or undefined to fetch from database
   */
  @Get("mailbox/:mailboxId")
  async findByMailboxId(
    @Param("mailboxId") mailboxId: string,
    @Query("source") source?: string,
  ): Promise<{ data: SubscriptionResponseDto[] }> {
    this.logger.log(
      `Fetching subscriptions for mailbox: ${mailboxId} (source: ${source || "local"})`,
    );

    // If source is 'graph', fetch from Microsoft Graph API and filter by mailbox
    if (source === "graph") {
      try {
        const graphSubscriptions = await this.graphService.listSubscriptions();

        // Filter subscriptions for this mailbox
        const mailboxSubscriptions = graphSubscriptions.filter((sub) => {
          const extractedMailboxId = this.extractMailboxIdFromResource(
            sub.resource,
          );
          return extractedMailboxId.toLowerCase() === mailboxId.toLowerCase();
        });

        const subscriptions = mailboxSubscriptions.map((sub) => {
          return {
            id: sub.id,
            subscriptionId: sub.id,
            mailboxId: mailboxId,
            resource: sub.resource,
            notificationUrl: sub.notificationUrl,
            expirationDateTime: new Date(sub.expirationDateTime),
            clientState: sub.clientState,
            changeType: sub.changeType,
            createdAt: undefined,
            updatedAt: undefined,
          };
        });

        return {
          data: subscriptions.map((s) => new SubscriptionResponseDto(s)),
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.error(
          `Failed to fetch subscriptions from Graph: ${errorMessage}`,
        );
        throw new BadRequestException(
          `Failed to fetch subscriptions from Graph: ${errorMessage}`,
        );
      }
    }

    // Default: fetch from local database
    const subscriptions =
      await this.subscriptionRepository.findByMailboxId(mailboxId);

    return {
      data: subscriptions.map((s) => new SubscriptionResponseDto(s)),
    };
  }

  /**
   * Create a new subscription for a mailbox
   * POST /api/subscriptions
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<{ data: SubscriptionResponseDto }> {
    this.logger.log(
      `Creating subscription for mailbox: ${createSubscriptionDto.mailboxId}`,
    );

    // Verify mailbox exists
    const mailbox = await this.mailboxRepository.findByAddress(
      createSubscriptionDto.mailboxId,
    );
    if (!mailbox) {
      throw new NotFoundException(
        `Mailbox with address ${createSubscriptionDto.mailboxId} not found`,
      );
    }

    // Determine resource path
    let resource: string;
    if (createSubscriptionDto.folder === "spam") {
      resource = `/users/${createSubscriptionDto.mailboxId}/mailFolders('junkemail')/messages`;
    } else if (createSubscriptionDto.folder === "custom") {
      if (!createSubscriptionDto.resource) {
        throw new BadRequestException(
          'Resource is required when folder is set to "custom"',
        );
      }
      resource = createSubscriptionDto.resource;
    } else {
      // Default to inbox
      resource = `/users/${createSubscriptionDto.mailboxId}/mailFolders('inbox')/messages`;
    }

    // Check if subscription already exists
    const existing =
      await this.subscriptionRepository.findByMailboxIdAndResource(
        createSubscriptionDto.mailboxId,
        resource,
      );
    if (existing) {
      throw new BadRequestException(
        `Subscription already exists for mailbox ${createSubscriptionDto.mailboxId} and resource ${resource}`,
      );
    }

    // Create subscription in Microsoft Graph
    let subscriptionResponse: {
      id: string;
      notificationUrl: string;
      expirationDateTime: string;
      clientState?: string;
      changeType: string;
    };
    try {
      if (createSubscriptionDto.folder === "spam") {
        subscriptionResponse = await this.graphService.subscribeToSpamMessages(
          undefined,
          createSubscriptionDto.mailboxId,
        );
      } else if (
        createSubscriptionDto.folder === "custom" &&
        createSubscriptionDto.resource
      ) {
        subscriptionResponse = await this.graphService.createSubscription(
          createSubscriptionDto.resource,
          undefined,
          createSubscriptionDto.mailboxId,
        );
      } else {
        // Default to inbox
        subscriptionResponse = await this.graphService.subscribeToMessages(
          undefined,
          createSubscriptionDto.mailboxId,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to create subscription for mailbox ${createSubscriptionDto.mailboxId}: ${errorMessage}`,
      );
      throw new BadRequestException(
        `Failed to create subscription: ${errorMessage}`,
      );
    }

    // Save subscription to database
    const subscription = new MailboxSubscription(
      "", // Will be generated by database
      subscriptionResponse.id,
      createSubscriptionDto.mailboxId,
      resource,
      subscriptionResponse.notificationUrl,
      new Date(subscriptionResponse.expirationDateTime),
      subscriptionResponse.clientState,
      subscriptionResponse.changeType,
    );

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    // Bootstrap delta link for inbox so first webhook/sync is already incremental (no history)
    const isInbox =
      resource.includes("inbox") && !resource.includes("junkemail");
    if (isInbox && mailbox.id) {
      try {
        const { deltaLink } = await this.graphService.bootstrapDeltaLink(
          mailbox.address,
        );
        await this.mailboxRepository.updateDeltaLink(mailbox.id, deltaLink);
        this.logger.log(
          `Delta link bootstrapped for mailbox ${mailbox.address} during subscription creation`,
        );
      } catch (bootstrapError) {
        const msg =
          bootstrapError instanceof Error
            ? bootstrapError.message
            : "Unknown error";
        this.logger.warn(
          `Could not bootstrap delta link for ${mailbox.address}: ${msg}. First sync will bootstrap.`,
        );
      }
    }

    this.logger.log(
      `Successfully created subscription ${savedSubscription.subscriptionId} for mailbox ${createSubscriptionDto.mailboxId}`,
    );

    return {
      data: new SubscriptionResponseDto(savedSubscription),
    };
  }

  /**
   * Delete a subscription
   * DELETE /api/subscriptions/:subscriptionId
   */
  @Delete(":subscriptionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("subscriptionId") subscriptionId: string): Promise<void> {
    this.logger.log(`Deleting subscription with id: ${subscriptionId}`);

    // Check if subscription exists
    const subscription =
      await this.subscriptionRepository.findBySubscriptionId(subscriptionId);
    if (!subscription) {
      throw new NotFoundException(
        `Subscription with id ${subscriptionId} not found`,
      );
    }

    // Delete from Microsoft Graph API
    try {
      await this.graphService.deleteSubscription(subscriptionId);
      this.logger.log(
        `Successfully deleted subscription ${subscriptionId} from Microsoft Graph`,
      );
    } catch (error) {
      // Log error but continue with database deletion
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.warn(
        `Failed to delete subscription ${subscriptionId} from Microsoft Graph: ${errorMessage}. Continuing with database deletion.`,
      );
    }

    // Delete from database
    await this.subscriptionRepository.delete(subscriptionId);
    this.logger.log(`Successfully deleted subscription ${subscriptionId}`);
  }
}
