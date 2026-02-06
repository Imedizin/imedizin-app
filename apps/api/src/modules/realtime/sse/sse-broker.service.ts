import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import type { Response } from "express";
import { RealtimePublisher } from "../realtime.publisher";
import type { RealtimeEvent } from "../realtime.events";
import { Subscription } from "rxjs";

export interface SSEClientFilter {
  /** Only send events whose scope matches. Omit = receive all. */
  scope?: Record<string, string>;
  /** Only send events for these topics. Omit = receive all topics. */
  topics?: string[];
}

interface SSEClient {
  response: Response;
  filter: SSEClientFilter;
}

/**
 * Manages SSE connections and broadcasts events from RealtimePublisher to matching clients.
 */
@Injectable()
export class SseBrokerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SseBrokerService.name);
  private readonly clients = new Map<string, SSEClient>();
  private subscription: Subscription | null = null;

  constructor(private readonly publisher: RealtimePublisher) {}

  onModuleInit(): void {
    this.subscription = this.publisher.stream.subscribe((event) =>
      this.broadcast(event)
    );
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    for (const [id] of this.clients) {
      this.removeClient(id);
    }
  }

  addClient(
    clientId: string,
    response: Response,
    filter: SSEClientFilter = {}
  ): void {
    this.clients.set(clientId, { response, filter });
    this.logger.log(
      `SSE client connected: ${clientId} (${this.clients.size} total)`
    );
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    this.logger.log(
      `SSE client disconnected: ${clientId} (${this.clients.size} total)`
    );
  }

  getClientCount(): number {
    return this.clients.size;
  }

  private matchesFilter(
    event: RealtimeEvent,
    filter: SSEClientFilter
  ): boolean {
    if (filter.topics?.length && !filter.topics.includes(event.topic)) {
      return false;
    }
    if (filter.scope && event.scope) {
      for (const [key, value] of Object.entries(filter.scope)) {
        if (event.scope![key] !== value) return false;
      }
    }
    return true;
  }

  private broadcast(event: RealtimeEvent): void {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const [clientId, client] of this.clients) {
      if (!this.matchesFilter(event, client.filter)) continue;
      try {
        client.response.write(data);
      } catch (error) {
        this.logger.warn(`SSE send failed for ${clientId}: ${error}`);
        this.clients.delete(clientId);
      }
    }
  }

  /** Send heartbeat comment to all clients to keep connections alive. */
  sendHeartbeat(): void {
    const line = `:heartbeat ${Date.now()}\n\n`;
    for (const [clientId, client] of this.clients) {
      try {
        client.response.write(line);
      } catch (error) {
        this.logger.warn(`SSE heartbeat failed for ${clientId}: ${error}`);
        this.clients.delete(clientId);
      }
    }
  }
}
