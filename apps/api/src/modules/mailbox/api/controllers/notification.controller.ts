import {
  Controller,
  Get,
  Query,
  Res,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import { NotificationService } from '../../application/services/notification.service';

/**
 * NotificationController - SSE endpoint for real-time notifications
 *
 * Clients connect to /api/notifications/stream to receive real-time updates.
 * Future: Can add WebSocket endpoint here as well.
 */
@Controller('api/notifications')
export class NotificationController implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationController.name);
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private readonly notificationService: NotificationService) {
    // Start heartbeat interval to keep SSE connections alive
    this.heartbeatInterval = setInterval(() => {
      this.notificationService.sendHeartbeat();
    }, 30000); // Send heartbeat every 30 seconds
  }

  onModuleDestroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  /**
   * SSE endpoint for real-time notifications
   *
   * GET /api/notifications/stream
   * Query params:
   *   - mailboxIds: comma-separated list of mailbox IDs to filter (optional)
   *
   * Example:
   *   /api/notifications/stream (all notifications)
   *   /api/notifications/stream?mailboxIds=uuid1,uuid2 (specific mailboxes)
   */
  @Get('stream')
  stream(
    @Query('mailboxIds') mailboxIdsParam: string | undefined,
    @Res() res: Response,
  ): void {
    const clientId = randomUUID();

    // Parse mailbox filter
    const mailboxIds = mailboxIdsParam
      ? mailboxIdsParam.split(',').filter((id) => id.trim())
      : null;

    this.logger.log(
      `SSE client connecting: ${clientId}, filter: ${mailboxIds ? mailboxIds.join(',') : 'all'}`,
    );

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Prevent timeout
    res.setTimeout(0);

    // Send initial connection event
    res.write(
      `data: ${JSON.stringify({
        type: 'connected',
        clientId,
        timestamp: new Date().toISOString(),
      })}\n\n`,
    );

    // Register client
    this.notificationService.addSSEClient(clientId, res, mailboxIds);

    // Handle client disconnect
    res.on('close', () => {
      this.logger.log(`SSE client disconnected: ${clientId}`);
      this.notificationService.removeSSEClient(clientId);
    });

    res.on('error', (error) => {
      this.logger.error(`SSE client error ${clientId}: ${error}`);
      this.notificationService.removeSSEClient(clientId);
    });
  }

  /**
   * Get current connection status
   * Useful for debugging/monitoring
   */
  @Get('status')
  getStatus() {
    return {
      connectedClients: this.notificationService.getSSEClientCount(),
      timestamp: new Date().toISOString(),
    };
  }
}
