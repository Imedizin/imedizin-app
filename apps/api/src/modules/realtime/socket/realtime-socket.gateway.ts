import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger, OnModuleDestroy } from "@nestjs/common";
import { Server } from "socket.io";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { RealtimePublisher } from "../realtime.publisher";
import type { RealtimeEvent } from "../realtime.events";

/** Allowed CORS origins for Socket.IO (same as REST API: FRONTEND_URL, comma-separated). */
const corsOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Socket.IO gateway – subscribes to RealtimePublisher and emits email.received
 * to all connected clients.
 */
@WebSocketGateway({
  namespace: "/realtime",
  cors: { origin: corsOrigins.length > 0 ? corsOrigins : true },
})
export class RealtimeSocketGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  private readonly logger = new Logger(RealtimeSocketGateway.name);
  private subscription: Subscription | null = null;

  @WebSocketServer()
  server!: Server;

  constructor(private readonly publisher: RealtimePublisher) {}

  afterInit(): void {
    this.subscription = this.publisher.stream
      .pipe(filter((e) => e.topic === "email.received"))
      .subscribe((event: RealtimeEvent) => {
        const server = this.server;
        if (!server) return;
        server.emit("email.received", event);
        const ns = server.sockets as {
          sockets?: Map<unknown, unknown>;
          size?: number;
        };
        const count = ns.sockets?.size ?? ns.size ?? 0;
        this.logger.debug(
          `Socket.IO emit email.received to ${count} client(s)`,
        );
      });
  }

  handleConnection(client: { id: string }): void {
    this.logger.log(`Socket client connected: ${client.id}`);
  }

  handleDisconnect(client: { id: string }): void {
    this.logger.log(`Socket client disconnected: ${client.id}`);
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }
}
