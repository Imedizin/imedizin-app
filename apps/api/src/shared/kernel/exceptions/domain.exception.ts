/**
 * Base exception for all domain exceptions
 */
export abstract class DomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Exception thrown when a resource is not found
 */
export class NotFoundException extends DomainException {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier ${identifier} not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND');
  }
}

/**
 * Exception thrown when validation fails
 */
export class ValidationException extends DomainException {
  constructor(
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message, 'VALIDATION_ERROR');
  }
}

/**
 * Exception thrown when a business rule is violated
 */
export class BusinessRuleException extends DomainException {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
  }
}
