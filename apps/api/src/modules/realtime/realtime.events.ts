/**
 * Realtime event contract – topic names and payload shape.
 * Any module can call RealtimePublisher.emit(); the Socket.IO gateway delivers by topic and scope.
 */

export type RealtimeTopic = string;

/**
 * Generic realtime event: topic + payload + optional scope for filtering.
 */
export interface RealtimeEvent<T = Record<string, unknown>> {
  topic: RealtimeTopic;
  payload: T;
  /** Optional scope for broker filtering (e.g. { entityId: 'uuid', userId: 'uuid' }) */
  scope?: Record<string, string>;
  timestamp?: string;
}
