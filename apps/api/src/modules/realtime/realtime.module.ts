import { Module } from "@nestjs/common";
import { RealtimePublisher } from "./realtime.publisher";
import { RealtimeSocketGateway } from "./socket/realtime-socket.gateway";
import { RealtimeTestController } from "./realtime-test.controller";

/**
 * Realtime module – Socket.IO only.
 * - RealtimePublisher: inject in any module to emit events (topic + payload + scope).
 * - Socket.IO: namespace /realtime, emits email.received to connected clients.
 * - Test: GET /api/realtime/test/email-received (emit fake event for integration testing).
 */
@Module({
  controllers: [RealtimeTestController],
  providers: [RealtimePublisher, RealtimeSocketGateway],
  exports: [RealtimePublisher],
})
export class RealtimeModule {}
