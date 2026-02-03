# Partners Management Module - Implementation Plan

## Overview

This document outlines the architecture and implementation plan for the **Partners Management** module, which will manage:
- **Medical Providers** - Healthcare providers (doctors, hospitals, clinics, etc.)
- **International Network** - Insurance partners/network members
- **Future**: Contracts, Rules, and other related entities

## Architecture Decision

We will use a **nested module structure** where:
- A parent module `partners-management` aggregates related sub-modules
- Each sub-module (medical-providers, international-network) is a complete, independent module following the existing Clean Architecture pattern
- Future sub-modules (contracts, rules) can be added following the same pattern

## Module Structure

```
modules/
└── partners-management/              # Parent module
    ├── medical-providers/            # Sub-module 1: Medical Providers
    │   ├── domain/
    │   │   ├── entities/
    │   │   │   └── medical-provider.entity.ts
    │   │   └── interfaces/
    │   │       └── medical-provider.repository.interface.ts
    │   ├── application/
    │   │   ├── commands/
    │   │   │   ├── create-medical-provider.command.ts
    │   │   │   ├── update-medical-provider.command.ts
    │   │   │   └── delete-medical-provider.command.ts
    │   │   ├── queries/
    │   │   │   ├── find-medical-provider-by-id.query.ts
    │   │   │   └── find-all-medical-providers.query.ts
    │   │   └── services/
    │   │       └── medical-provider.service.ts (optional, for complex business logic)
    │   ├── infrastructure/
    │   │   ├── repositories/
    │   │   │   └── medical-provider.repository.ts
    │   │   └── schema.ts
    │   ├── api/
    │   │   ├── controllers/
    │   │   │   └── medical-provider.controller.ts
    │   │   └── dto/
    │   │       ├── create-medical-provider.dto.ts
    │   │       ├── update-medical-provider.dto.ts
    │   │       └── medical-provider-response.dto.ts
    │   └── medical-providers.module.ts
    │
    ├── international-network/        # Sub-module 2: International Network
    │   ├── domain/
    │   │   ├── entities/
    │   │   │   └── network-partner.entity.ts
    │   │   └── interfaces/
    │   │       └── network-partner.repository.interface.ts
    │   ├── application/
    │   │   ├── commands/
    │   │   │   ├── create-network-partner.command.ts
    │   │   │   ├── update-network-partner.command.ts
    │   │   │   └── delete-network-partner.command.ts
    │   │   ├── queries/
    │   │   │   ├── find-network-partner-by-id.query.ts
    │   │   │   ├── find-all-network-partners.query.ts
    │   │   │   └── find-network-partners-by-country.query.ts
    │   │   └── services/
    │   │       └── network-partner.service.ts (optional)
    │   ├── infrastructure/
    │   │   ├── repositories/
    │   │   │   └── network-partner.repository.ts
    │   │   └── schema.ts
    │   ├── api/
    │   │   ├── controllers/
    │   │   │   └── network-partner.controller.ts
    │   │   └── dto/
    │   │       ├── create-network-partner.dto.ts
    │   │       ├── update-network-partner.dto.ts
    │   │       └── network-partner-response.dto.ts
    │   └── international-network.module.ts
    │
    ├── contracts/                    # Future: Contracts between providers/network
    │   └── [same structure]
    │
    ├── rules/                        # Future: Business rules engine
    │   └── [same structure]
    │
    └── partners-management.module.ts # Parent module
```

## Domain Models

### Medical Provider Entity

**Fields:**
- `id: string` (UUID)
- `name: string` (required)
- `npi?: string` (National Provider Identifier)
- `taxId?: string`
- `specialty?: string`
- `address?: string`
- `city?: string`
- `state?: string`
- `zipCode?: string`
- `country?: string`
- `phone?: string`
- `email?: string`
- `isActive: boolean` (default: true)
- `createdAt: Date`
- `updatedAt: Date`

**Domain Methods:**
- `updateName(name: string): void`
- `updateContactInfo(phone?: string, email?: string): void`
- `updateAddress(...): void`
- `activate(): void`
- `deactivate(): void`
- `isProviderActive(): boolean`

### Network Partner Entity

**Fields:**
- `id: string` (UUID)
- `name: string` (required)
- `country: string` (required)
- `region?: string`
- `contactEmail?: string`
- `contactPhone?: string`
- `website?: string`
- `address?: string`
- `taxId?: string`
- `isActive: boolean` (default: true)
- `createdAt: Date`
- `updatedAt: Date`

**Domain Methods:**
- `updateName(name: string): void`
- `updateContactInfo(...): void`
- `updateLocation(...): void`
- `activate(): void`
- `deactivate(): void`
- `isPartnerActive(): boolean`

## Database Schema

### Medical Providers Table

```sql
CREATE TABLE medical_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  npi TEXT,
  tax_id TEXT,
  specialty TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medical_providers_name ON medical_providers(name);
CREATE INDEX idx_medical_providers_npi ON medical_providers(npi);
CREATE INDEX idx_medical_providers_is_active ON medical_providers(is_active);
```

### Network Partners Table

```sql
CREATE TABLE network_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  address TEXT,
  tax_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_network_partners_name ON network_partners(name);
CREATE INDEX idx_network_partners_country ON network_partners(country);
CREATE INDEX idx_network_partners_is_active ON network_partners(is_active);
```

## API Endpoints

### Medical Providers

- `GET /api/medical-providers` - List all medical providers
- `GET /api/medical-providers/:id` - Get medical provider by ID
- `POST /api/medical-providers` - Create new medical provider
- `PATCH /api/medical-providers/:id` - Update medical provider
- `DELETE /api/medical-providers/:id` - Delete medical provider

### International Network

- `GET /api/international-network` - List all network partners
- `GET /api/international-network/:id` - Get network partner by ID
- `GET /api/international-network/country/:country` - Get partners by country
- `POST /api/international-network` - Create new network partner
- `PATCH /api/international-network/:id` - Update network partner
- `DELETE /api/international-network/:id` - Delete network partner

## Implementation Steps

### Phase 1: Medical Providers Sub-Module

1. **Create directory structure**
   ```bash
   mkdir -p partners-management/medical-providers/{domain/{entities,interfaces},application/{commands,queries,services},infrastructure/repositories,api/{controllers,dto}}
   ```

2. **Domain Layer**
   - Create `MedicalProvider` entity with business logic methods
   - Create `IMedicalProviderRepository` interface

3. **Infrastructure Layer**
   - Create Drizzle schema in `schema.ts`
   - Implement `MedicalProviderRepository` using Drizzle ORM
   - Update `database.module.ts` to import the new schema

4. **Application Layer**
   - Create commands: `CreateMedicalProviderCommand`, `UpdateMedicalProviderCommand`, `DeleteMedicalProviderCommand`
   - Create queries: `FindAllMedicalProvidersQuery`, `FindMedicalProviderByIdQuery`

5. **API Layer**
   - Create DTOs: `CreateMedicalProviderDto`, `UpdateMedicalProviderDto`, `MedicalProviderResponseDto`
   - Create `MedicalProviderController` with CRUD endpoints

6. **Module Registration**
   - Create `medical-providers.module.ts`
   - Register in parent `partners-management.module.ts`

### Phase 2: International Network Sub-Module

1. **Create directory structure**
   ```bash
   mkdir -p partners-management/international-network/{domain/{entities,interfaces},application/{commands,queries,services},infrastructure/repositories,api/{controllers,dto}}
   ```

2. **Domain Layer**
   - Create `NetworkPartner` entity with business logic methods
   - Create `INetworkPartnerRepository` interface

3. **Infrastructure Layer**
   - Create Drizzle schema in `schema.ts`
   - Implement `NetworkPartnerRepository` using Drizzle ORM
   - Update `database.module.ts` to import the new schema

4. **Application Layer**
   - Create commands: `CreateNetworkPartnerCommand`, `UpdateNetworkPartnerCommand`, `DeleteNetworkPartnerCommand`
   - Create queries: `FindAllNetworkPartnersQuery`, `FindNetworkPartnerByIdQuery`, `FindNetworkPartnersByCountryQuery`

5. **API Layer**
   - Create DTOs: `CreateNetworkPartnerDto`, `UpdateNetworkPartnerDto`, `NetworkPartnerResponseDto`
   - Create `NetworkPartnerController` with CRUD endpoints

6. **Module Registration**
   - Create `international-network.module.ts`
   - Register in parent `partners-management.module.ts`

### Phase 3: Parent Module

1. **Create `partners-management.module.ts`**
   - Import both sub-modules
   - Export them for use in other modules if needed

2. **Register in `app.module.ts`**
   - Add `PartnersManagementModule` to imports

### Phase 4: Database Migration

1. Generate migration:
   ```bash
   npm run db:generate
   ```

2. Review migration files

3. Apply migration:
   ```bash
   npm run db:push
   # or
   npm run db:migrate
   ```

## Future Extensibility

### Contracts Module (Future)

When contracts are needed, create a new sub-module:

```
partners-management/
└── contracts/
    ├── domain/
    │   ├── entities/
    │   │   └── contract.entity.ts
    │   └── interfaces/
    │       └── contract.repository.interface.ts
    └── ...
```

**Contract Entity (Planned):**
- Links `MedicalProvider` to `NetworkPartner`
- Contains: terms, rates, effective dates, expiration dates
- References rules that apply to the contract

### Rules Module (Future)

When business rules are needed:

```
partners-management/
└── rules/
    ├── domain/
    │   ├── entities/
    │   │   └── rule.entity.ts
    │   └── interfaces/
    │       └── rule.repository.interface.ts
    └── ...
```

**Rule Entity (Planned):**
- Defines business rules for contracts
- Can be applied to specific contracts or globally
- Contains rule logic, conditions, and actions

## Dependencies

### Required Updates

1. **`database.module.ts`**
   - Import schemas from both sub-modules:
   ```typescript
   import * as medicalProvidersSchema from '../../../modules/partners-management/medical-providers/infrastructure/schema';
   import * as networkPartnersSchema from '../../../modules/partners-management/international-network/infrastructure/schema';
   
   const schema = {
     ...mailboxSchema,
     ...medicalProvidersSchema,
     ...networkPartnersSchema,
   };
   ```

2. **`app.module.ts`**
   - Import `PartnersManagementModule`

## Validation Rules

### Medical Provider
- `name`: Required, max 255 characters
- `npi`: Optional, must be unique if provided
- `email`: Optional, must be valid email format if provided
- `phone`: Optional, should follow phone format validation

### Network Partner
- `name`: Required, max 255 characters
- `country`: Required
- `contactEmail`: Optional, must be valid email format if provided
- `contactPhone`: Optional, should follow phone format validation

## Error Handling

- Use NestJS exceptions:
  - `NotFoundException` - When entity not found
  - `ConflictException` - When duplicate NPI or other unique constraint violation
  - `BadRequestException` - When validation fails

## Testing Considerations

1. **Unit Tests**
   - Domain entities (business logic methods)
   - Commands and queries
   - Repository implementations

2. **Integration Tests**
   - API endpoints
   - Database operations
   - End-to-end flows

3. **Test Data**
   - Create seed scripts for development
   - Use factories for test data generation

## Notes

- Follow existing patterns from `mailbox` module
- Maintain consistency with Clean Architecture principles
- Each sub-module is independent and can be tested in isolation
- Parent module serves as an aggregator, making it easy to add new sub-modules
- Future contracts and rules will link medical providers and network partners
