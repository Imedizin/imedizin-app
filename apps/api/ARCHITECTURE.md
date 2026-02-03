# Modular Monolith Architecture

This document describes the modular monolith architecture implemented in the NestJS backend.

## Overview

The application follows a **Modular Monolith** pattern with **Layered Architecture** principles, implementing **Domain-Driven Design (DDD)** concepts. Each module is self-contained with clear boundaries, making it easy to evolve into microservices if needed in the future.

## Architecture Principles

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Dependency Inversion**: High-level modules don't depend on low-level modules; both depend on abstractions
3. **Domain-Driven Design**: Business logic lives in the domain layer, isolated from technical concerns
4. **Modular Monolith**: Independent modules that can communicate through well-defined interfaces
5. **Testability**: Each layer can be tested in isolation with mocked dependencies

## Project Structure

```
src/
├── modules/                    # Business modules (bounded contexts)
│   └── users/                  # Users module example
│       ├── domain/             # Domain layer (business logic)
│       │   ├── entities/       # Domain entities
│       │   └── interfaces/     # Repository interfaces
│       ├── application/        # Application layer (use cases)
│       │   ├── dto/            # Data Transfer Objects
│       │   └── *.service.ts    # Application services
│       ├── infrastructure/     # Infrastructure layer (external concerns)
│       │   └── repositories/    # Repository implementations
│       ├── api/                # API layer (HTTP/transport)
│       │   └── *.controller.ts # HTTP controllers
│       └── *.module.ts         # NestJS module definition
│
├── shared/                     # Shared kernel
│   ├── kernel/                 # Domain primitives, base classes
│   │   ├── entities/           # Base entity classes
│   │   ├── exceptions/         # Domain exceptions
│   │   └── interfaces/         # Repository interfaces
│   ├── common/                 # Common modules
│   │   └── database/           # Database configuration
│   └── utils/                  # Shared utilities
│
├── app.module.ts               # Root module
└── main.ts                     # Application entry point
```

## Architecture Layers

### Domain Layer (`domain/`)
Contains the core business logic:
- **Entities**: Rich domain models with behavior (e.g., `User`)
- **Value Objects**: Immutable objects representing domain concepts
- **Domain Services**: Services that contain domain logic that doesn't naturally fit in entities
- **Interfaces**: Repository interfaces (abstractions)

**Rules**:
- No dependencies on other layers
- Pure business logic, no technical concerns
- Entities contain behavior, not just data

### Application Layer (`application/`)
Orchestrates use cases:
- **DTOs**: Input/output data transfer objects
- **Application Services**: Coordinate between domain and infrastructure layers
- **Use Cases**: Business operations (create user, find user, etc.)

**Rules**:
- Depends on domain layer
- No direct database access
- Uses repository interfaces (not implementations)

### Infrastructure Layer (`infrastructure/`)
Handles technical concerns:
- **Repositories**: Data access implementations
- **External Services**: Third-party API clients
- **Persistence**: Database schema and ORM configurations

**Rules**:
- Implements domain interfaces
- Depends on domain layer
- Contains all technical implementation details

### API Layer (`api/`)
Handles HTTP concerns:
- **Controllers**: Handle HTTP requests/responses
- **Route Handlers**: Express route definitions

**Rules**:
- Depends on application layer
- No business logic
- Handles HTTP-specific concerns (validation, serialization)

## Dependency Flow

```
┌─────────────┐
│     API     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Application │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Domain    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Infrastructure│
└─────────────┘
```

**Rules**:
- API → Application → Domain
- Infrastructure → Domain (implements interfaces)
- No circular dependencies
- Domain has no dependencies on other layers

## Module: Users

### Domain
- `User`: Main user entity with business logic
- `IUserRepository`: Repository interface

### Application
- DTOs: `CreateUserDto`, `UserResponseDto`
- Service: `UsersService` orchestrates user operations

### Infrastructure
- `UserRepository`: Implements `IUserRepository` using Drizzle ORM

### API
- `UsersController`: Handles HTTP requests for user operations
- Routes: `/users/*`

## Adding New Modules

When adding new modules, follow the same structure:

```
modules/
├── users/              # Existing module
├── tickets/            # New module
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   ├── api/
│   └── tickets.module.ts
└── notifications/      # Another new module
```

### Steps to Add a Module:

1. Create module directory structure
2. Define domain entities and interfaces
3. Implement repository interface in infrastructure
4. Create application service and DTOs
5. Create API controller
6. Create NestJS module and register in `app.module.ts`

## Module Communication

Modules communicate through:
1. **Shared Kernel**: Common interfaces and base classes
2. **Application Services**: Direct service calls (within monolith)
3. **Database**: Shared database (but separate schemas per module recommended)
4. **Events**: Domain events (future enhancement)

## Benefits

1. **Maintainability**: Clear separation makes code easy to understand and modify
2. **Testability**: Each layer can be tested independently
3. **Scalability**: Easy to add new modules following the same pattern
4. **Flexibility**: Can evolve to microservices without major refactoring
5. **Domain Focus**: Business logic is clearly separated from technical concerns
6. **Team Collaboration**: Different teams can work on different modules

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Drizzle ORM
- **Language**: TypeScript
- **Architecture**: Modular Monolith with DDD

## Next Steps

1. Add more modules (tickets, notifications, etc.)
2. Implement domain events for inter-module communication
3. Add validation using class-validator
4. Add authentication and authorization
5. Implement CQRS pattern for complex modules (optional)
6. Add unit and integration tests
