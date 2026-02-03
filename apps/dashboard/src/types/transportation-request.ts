/**
 * Transportation Request entity types
 * Phase 1: Minimal types with just pickup/dropoff addresses
 */

/**
 * Transportation Request entity
 */
export interface TransportationRequest {
  id: string;
  requestNumber: string;
  pickupAddress: string;
  dropoffAddress: string;
  threadIds: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new transportation request
 */
export interface CreateTransportationRequestDto {
  pickupAddress: string;
  dropoffAddress: string;
  threadId?: string;
}

/**
 * Form data for transportation request forms
 */
export interface TransportationRequestFormData {
  pickupAddress: string;
  dropoffAddress: string;
  threadIds?: string[];
}
