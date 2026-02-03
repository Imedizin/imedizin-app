# Backend Coding Standards

This document defines the coding standards and conventions for the NestJS backend.

## Architecture Overview

The application follows a **Modular Monolith** pattern with **Clean Architecture** principles:

```
src/
├── modules/                    # Business modules (bounded contexts)
│   └── <module>/
│       ├── api/                # HTTP Layer
│       │   ├── controllers/    # HTTP request handlers
│       │   └── dto/            # Request/Response DTOs
│       ├── application/        # Use Cases Layer
│       │   ├── commands/       # Write operations (create, update, delete)
│       │   ├── queries/        # Read operations
│       │   └── services/       # Application services
│       ├── domain/             # Business Logic Layer
│       │   ├── entities/       # Domain entities
│       │   └── interfaces/     # Repository interfaces
│       ├── infrastructure/     # Technical Implementation Layer
│       │   ├── repositories/   # Repository implementations
│       │   └── schema.ts       # Database schema (Drizzle)
│       └── <module>.module.ts  # NestJS module definition
│
└── shared/                     # Shared Kernel
    ├── kernel/                 # Domain primitives
    │   ├── entities/           # Base entity classes
    │   ├── exceptions/         # Domain exceptions
    │   └── interfaces/         # Base interfaces
    └── common/                 # Common utilities
        ├── database/           # Database configuration
        ├── http/               # HTTP utilities
        ├── responses/          # API response utilities
        └── filters/            # Exception filters
```

## Layer Responsibilities

### API Layer (`api/`)

**Purpose**: Handle HTTP concerns only - no business logic.

**Contains**:
- **Controllers**: Handle HTTP requests/responses, validation, and routing
- **DTOs**: Data Transfer Objects for request/response serialization

**Rules**:
- Controllers should be thin - delegate to Commands/Queries
- Use class-validator decorators for input validation
- Always return standardized response format

### Application Layer (`application/`)

**Purpose**: Orchestrate use cases and coordinate domain operations.

**Contains**:
- **Commands**: Write operations that modify state
- **Queries**: Read operations that return data
- **Services**: Cross-cutting application services (e.g., external APIs)

**Rules**:
- Commands and Queries inject repository interfaces (not implementations)
- Use `@Inject('IRepositoryName')` for dependency injection
- Each Command/Query has a single `execute()` method
- Log operations using NestJS Logger

### Domain Layer (`domain/`)

**Purpose**: Core business logic, isolated from technical concerns.

**Contains**:
- **Entities**: Rich domain models with behavior
- **Interfaces**: Repository contracts (abstractions)
- **Value Objects**: Immutable domain concepts (future)

**Rules**:
- No dependencies on other layers
- Entities contain business methods, not just data
- Repository interfaces define the contract

### Infrastructure Layer (`infrastructure/`)

**Purpose**: Technical implementations and external integrations.

**Contains**:
- **Repositories**: Data access implementations using Drizzle ORM
- **Schema**: Database table definitions
- **External clients**: Third-party API integrations

**Rules**:
- Implements domain interfaces
- Contains all ORM/database-specific code
- Maps between database models and domain entities

---

## Naming Conventions

### Commands (Write Operations)

| Operation | Naming Pattern           | Example                      |
| --------- | ------------------------ | ---------------------------- |
| Create    | `Create<Entity>Command`  | `CreateDomainCommand`        |
| Add       | `Add<Entity>Command`     | `AddMailboxCommand`          |
| Update    | `Update<Entity>Command`  | `UpdateDomainCommand`        |
| Delete    | `Delete<Entity>Command`  | `DeleteDomainCommand`        |
| Process   | `Process<Action>Command` | `ProcessNotificationCommand` |
| Sync      | `Sync<Entity>Command`    | `SyncMailboxCommand`         |

### Queries (Read Operations)

| Operation     | Naming Pattern               | Example                          |
| ------------- | ---------------------------- | -------------------------------- |
| Find All      | `FindAll<Entity>sQuery`      | `FindAllDomainsQuery`            |
| Find By ID    | `Find<Entity>ByIdQuery`      | `FindDomainByIdQuery`            |
| Find By Field | `Find<Entity>By<Field>Query` | `FindMailboxByAddressQuery`      |
| Find Expiring | `FindExpiring<Entity>sQuery` | `FindExpiringSubscriptionsQuery` |
| Search        | `Search<Entity>sQuery`       | `SearchEmailsQuery`              |

### Command Payloads

Define payload interfaces within the command file:

```typescript
export interface CreateDomainCommandPayload {
  domain: string;
  name: string;
}

@Injectable()
export class CreateDomainCommand {
  async execute(payload: CreateDomainCommandPayload): Promise<Domain> {
    // ...
  }
}
```

### DTOs

| Type         | Naming Pattern        | Example             |
| ------------ | --------------------- | ------------------- |
| Create Input | `Create<Entity>Dto`   | `CreateDomainDto`   |
| Update Input | `Update<Entity>Dto`   | `UpdateDomainDto`   |
| Response     | `<Entity>ResponseDto` | `DomainResponseDto` |

### Repository Interfaces

| Pattern               | Example             |
| --------------------- | ------------------- |
| `I<Entity>Repository` | `IDomainRepository` |

---

## API Response Format

### Standard Response Structure

All API responses MUST follow this format:

**Single Item Response**:
```json
{
  "data": { ... }
}
```

**List Response**:
```json
{
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

**Error Response**:
```json
{
  "statusCode": 400,
  "message": "Human-readable error message",
  "error": "Bad Request"
}
```

### Controller Response Examples

```typescript
// Single item
@Get(':id')
async findOne(@Param('id') id: string): Promise<{ data: DomainResponseDto }> {
  const domain = await this.findDomainByIdQuery.execute({ id });
  return ApiResponse.item(new DomainResponseDto(domain));
}

// List
@Get()
async findAll(): Promise<{ data: DomainResponseDto[] }> {
  const domains = await this.findAllDomainsQuery.execute();
  return ApiResponse.list(domains.map(d => new DomainResponseDto(d)));
}

// Paginated list
@Get()
async findAll(
  @Query('page') page = 1,
  @Query('limit') limit = 20,
): Promise<ListResponse<EmailResponseDto>> {
  const result = await this.findAllEmailsQuery.execute({ page, limit });
  return ApiResponse.paginated(
    result.items.map(e => new EmailResponseDto(e)),
    { total: result.total, page, limit }
  );
}

// No content (delete)
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
async remove(@Param('id') id: string): Promise<void> {
  await this.deleteDomainCommand.execute({ id });
}
```

---

## Dependency Injection

### Repository Registration

Register repositories in the module with interface tokens:

```typescript
@Module({
  providers: [
    {
      provide: 'IDomainRepository',
      useClass: DomainRepository,
    },
  ],
  exports: ['IDomainRepository'],
})
```

### Injecting Repositories

Use `@Inject()` with the interface token:

```typescript
@Injectable()
export class CreateDomainCommand {
  constructor(
    @Inject('IDomainRepository')
    private readonly domainRepository: IDomainRepository,
  ) {}
}
```

---

## Error Handling

### Domain Exceptions

Use NestJS built-in exceptions for HTTP errors:

```typescript
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

// Not found
throw new NotFoundException(`Domain with id ${id} not found`);

// Conflict (duplicate)
throw new ConflictException(`Domain ${domain} already exists`);

// Validation error
throw new BadRequestException('Domain name is required');
```

### Logging

Use the NestJS Logger in Commands and Services:

```typescript
@Injectable()
export class CreateDomainCommand {
  private readonly logger = new Logger(CreateDomainCommand.name);

  async execute(payload: CreateDomainCommandPayload): Promise<Domain> {
    this.logger.log(`Creating domain: ${payload.domain}`);
    
    // ... operation
    
    this.logger.log(`Domain created successfully: ${domain.id}`);
    return domain;
  }
}
```

---

## Validation

### DTO Validation

Use class-validator decorators on DTOs:

```typescript
import { IsString, IsNotEmpty, MaxLength, Matches, IsOptional } from 'class-validator';

export class CreateDomainDto {
  @IsString({ message: 'Domain must be a string' })
  @IsNotEmpty({ message: 'Domain is required' })
  @MaxLength(255, { message: 'Domain must not exceed 255 characters' })
  @Matches(/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, {
    message: 'Domain must be a valid domain name (e.g., example.com)',
  })
  domain: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name: string;
}
```

---

## Testing Conventions

### Unit Tests

- Place tests next to the file being tested: `create-domain.command.spec.ts`
- Mock repository interfaces for command/query tests
- Test business logic in isolation

### E2E Tests

- Place in `test/` directory
- Test full HTTP request/response cycle
- Use test database

---

## Code Style

### Imports Order

1. NestJS/Node.js imports
2. Third-party imports
3. Local imports (relative paths)

### File Organization

Each file should have:
1. Imports
2. Interfaces/Types (if small, otherwise separate file)
3. Class definition
4. Export (if not using decorators)

### Comments

Use JSDoc-style comments for public APIs:

```typescript
/**
 * Create a new domain
 * @param payload - The domain creation data
 * @returns The created domain entity
 * @throws ConflictException if domain already exists
 */
async execute(payload: CreateDomainCommandPayload): Promise<Domain> {
  // ...
}
```
