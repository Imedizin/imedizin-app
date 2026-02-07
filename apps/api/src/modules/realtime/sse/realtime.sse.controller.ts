import {
  Controller,
  Get,
  Query,
  Res,
  Logger,
  OnModuleDestroy,
} from "@nestjs/common";
import type { Response } from "express";
import { randomUUID } from "crypto";
import { SseBrokerService, type SSEClientFilter } from "./sse-broker.service";

/**
 * SSE endpoint for realtime events.
 * Clients connect to GET /api/realtime/stream; optional query params filter by scope/topics.
 */
@Controller("api/realtime")
export class RealtimeSseController implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimeSseController.name);
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly sseBroker: SseBrokerService) {
    this.heartbeatInterval = setInterval(() => {
      this.sseBroker.sendHeartbeat();
    }, 30_000);
  }

  onModuleDestroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  /**
   * GET /api/realtime/stream
   * Query params (all optional):
   *   - topics: comma-separated list of topic names
   *   - any other key=value: used as scope filter (e.g. entityId=uuid, userId=uuid)
   */
  @Get("stream")
  stream(
    @Query("topics") topicsParam: string | undefined,
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ): void {
    const clientId = randomUUID();

    const filter: SSEClientFilter = {};
    if (topicsParam) {
      filter.topics = topicsParam
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
    const scopeKeys = Object.keys(query).filter((k) => k !== "topics");
    if (scopeKeys.length) {
      filter.scope = {} as Record<string, string>;
      for (const key of scopeKeys) {
        const v = query[key];
        if (v) filter.scope[key] = v;
      }
    }

    this.logger.log(
      `SSE client connecting: ${clientId}, filter: ${JSON.stringify(filter)}`,
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setTimeout(0);

    res.write(
      `data: ${JSON.stringify({
        type: "connected",
        clientId,
        timestamp: new Date().toISOString(),
      })}\n\n`,
    );

    this.sseBroker.addClient(clientId, res, filter);

    res.on("close", () => {
      this.logger.log(`SSE client disconnected: ${clientId}`);
      this.sseBroker.removeClient(clientId);
    });

    res.on("error", (error) => {
      this.logger.error(`SSE client error ${clientId}: ${error}`);
      this.sseBroker.removeClient(clientId);
    });
  }

  @Get("status")
  getStatus(): { connectedClients: number; timestamp: string } {
    return {
      connectedClients: this.sseBroker.getClientCount(),
      timestamp: new Date().toISOString(),
    };
  }
}
