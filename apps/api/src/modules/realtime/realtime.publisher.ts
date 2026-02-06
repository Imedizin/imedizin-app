import { Injectable, Logger } from "@nestjs/common";
import { Subject, Observable } from "rxjs";
import { filter } from "rxjs/operators";
import type { RealtimeEvent } from "./realtime.events";

/**
 * Single publisher for all realtime events.
 * The Socket.IO gateway subscribes and delivers to connected clients.
 * Other modules inject RealtimePublisher and call emit() – no transport-specific code.
 */
@Injectable()
export class RealtimePublisher {
  private readonly logger = new Logger(RealtimePublisher.name);
  private readonly subject = new Subject<RealtimeEvent>();

  /** Stream of all events (for brokers that do their own filtering). */
  get stream(): Observable<RealtimeEvent> {
    return this.subject.asObservable();
  }

  /** Stream filtered by topic. */
  topic(topic: string): Observable<RealtimeEvent> {
    return this.subject.asObservable().pipe(filter((e) => e.topic === topic));
  }

  /**
   * Emit an event to all subscribers (e.g. Socket.IO gateway).
   */
  emit(event: RealtimeEvent): void {
    this.logger.debug(`Realtime emit: topic=${event.topic}`);
    this.subject.next({
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
    });
  }
}
