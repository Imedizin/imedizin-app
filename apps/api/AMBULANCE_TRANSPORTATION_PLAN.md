# Ambulance and Transportation Module - Incremental Implementation Plan

## Overview

This document outlines a **simple, incremental approach** to building the **Operations: Ambulance and Transportation Module**. We start with the absolute minimum (creating a request) and add features phase by phase.

**Goal**: Build a working system quickly, then enhance it incrementally.

## Quick Reference: Implementation Phases

1. **Phase 1**: Basic request creation (pickup/dropoff addresses only) - ~2-3 hours
2. **Phase 2**: Add medical requirements fields - ~1-2 hours
3. **Phase 3**: Add distance calculation - ~3-4 hours
4. **Phase 4**: Add basic pricing (base + per-km) - ~2-3 hours
5. **Phase 5**: Add service level & personnel surcharges - ~1-2 hours
6. **Phase 6**: Add equipment pricing - ~1 hour
7. **Phase 7**: Add quotations - ~3-4 hours
8. **Phase 8**: Add country-specific pricing - ~1-2 hours
9. **Phase 9**: Add detailed pricing breakdown - ~1-2 hours
10. **Phase 10**: Frontend integration - ~1-2 days

**Total estimated time**: ~2-3 weeks for full implementation

## Architecture Decision

We will use a **single cohesive module** structure following the existing Clean Architecture pattern:

```
modules/
└── operations/
    └── ambulance-transportation/    # Main module
        ├── domain/
        │   ├── entities/
        │   │   ├── transportation-request.entity.ts
        │   │   ├── quotation.entity.ts
        │   │   └── pricing-rule.entity.ts
        │   ├── value-objects/
        │   │   ├── address.vo.ts
        │   │   ├── distance.vo.ts
        │   │   ├── medical-requirements.vo.ts
        │   │   └── pricing-breakdown.vo.ts
        │   └── interfaces/
        │       ├── transportation-request.repository.interface.ts
        │       ├── quotation.repository.interface.ts
        │       ├── pricing-rule.repository.interface.ts
        │       ├── map-service.interface.ts
        │       └── pricing-calculator.interface.ts
        ├── application/
        │   ├── commands/
        │   │   ├── create-transportation-request.command.ts
        │   │   ├── update-transportation-request.command.ts
        │   │   ├── confirm-medical-requirements.command.ts
        │   │   ├── generate-quotation.command.ts
        │   │   ├── accept-quotation.command.ts
        │   │   └── cancel-request.command.ts
        │   ├── queries/
        │   │   ├── find-transportation-request-by-id.query.ts
        │   │   ├── find-all-transportation-requests.query.ts
        │   │   ├── find-quotation-by-id.query.ts
        │   │   └── find-pricing-rules-by-country.query.ts
        │   └── services/
        │       ├── distance-calculation.service.ts
        │       ├── pricing-calculation.service.ts
        │       └── quotation-generation.service.ts
        ├── infrastructure/
        │   ├── repositories/
        │   │   ├── transportation-request.repository.ts
        │   │   ├── quotation.repository.ts
        │   │   └── pricing-rule.repository.ts
        │   ├── external/
        │   │   ├── map-service.client.ts (Google Maps, Mapbox, etc.)
        │   │   └── distance-calculator.client.ts
        │   └── schema.ts
        ├── api/
        │   ├── controllers/
        │   │   ├── transportation-request.controller.ts
        │   │   ├── quotation.controller.ts
        │   │   └── pricing-rule.controller.ts
        │   └── dto/
        │       ├── create-transportation-request.dto.ts
        │       ├── update-transportation-request.dto.ts
        │       ├── medical-requirements.dto.ts
        │       ├── quotation-request.dto.ts
        │       ├── quotation-response.dto.ts
        │       ├── pricing-breakdown.dto.ts
        │       └── transportation-request-response.dto.ts
        └── ambulance-transportation.module.ts
```

## Domain Models

### Transportation Request Entity

**Core Fields:**
- `id: string` (UUID)
- `requestNumber: string` (auto-generated, unique)
- `companyId: string` (reference to company/partner)
- `requestedBy: string` (user ID or contact info)
- `status: RequestStatus` (draft, pending, confirmed, in-progress, completed, cancelled)
- `pickupAddress: Address` (value object)
- `dropoffAddress: Address` (value object)
- `distance: Distance` (value object - calculated)
- `medicalRequirements: MedicalRequirements` (value object)
- `serviceLevel: ServiceLevel` (BLS | ALS)
- `personnelType: PersonnelType` (none | gp | specialist)
- `requestedDate: Date`
- `requestedTime: Time`
- `urgency: UrgencyLevel` (routine | urgent | emergency)
- `notes?: string`
- `createdAt: Date`
- `updatedAt: Date`

**Domain Methods:**
- `confirmMedicalRequirements(requirements: MedicalRequirements): void`
- `updateStatus(status: RequestStatus): void`
- `calculateDistance(mapService: IMapService): Promise<Distance>`
- `isConfirmed(): boolean`
- `canBeCancelled(): boolean`
- `acceptQuotation(quotationId: string): void`

### Quotation Entity

**Core Fields:**
- `id: string` (UUID)
- `quotationNumber: string` (auto-generated, unique)
- `requestId: string` (reference to TransportationRequest)
- `status: QuotationStatus` (draft, sent, accepted, rejected, expired)
- `pricingBreakdown: PricingBreakdown` (value object)
- `baseFee: Money` (opening/booking fee)
- `distanceFee: Money` (per-kilometer rate × distance)
- `serviceLevelFee: Money` (BLS vs ALS surcharge)
- `personnelFee: Money` (GP/Specialist surcharge)
- `equipmentFee: Money` (oxygen, ventilator, etc.)
- `totalAmount: Money`
- `currency: string` (ISO 4217)
- `country: string` (for pricing rules)
- `validUntil: Date` (expiration date)
- `generatedAt: Date`
- `acceptedAt?: Date`
- `rejectedAt?: Date`
- `rejectionReason?: string`
- `createdAt: Date`
- `updatedAt: Date`

**Domain Methods:**
- `accept(): void`
- `reject(reason?: string): void`
- `isExpired(): boolean`
- `isValid(): boolean`
- `calculateTotal(): Money`

### Pricing Rule Entity

**Core Fields:**
- `id: string` (UUID)
- `country: string` (ISO 3166-1 alpha-2)
- `region?: string` (optional, for regional variations)
- `baseFee: Money` (opening/booking fee)
- `perKilometerRate: Money` (rate per km)
- `blsSurcharge: Money` (Basic Life Support additional fee)
- `alsSurcharge: Money` (Advanced Life Support additional fee)
- `gpSurcharge: Money` (General Practitioner additional fee)
- `specialistSurcharge: Money` (Specialist additional fee)
- `oxygenPerLiterRate: Money` (rate per liter of oxygen)
- `ventilatorSurcharge: Money` (ventilator equipment fee)
- `currency: string` (ISO 4217)
- `isActive: boolean`
- `effectiveFrom: Date`
- `effectiveTo?: Date` (null if currently active)
- `createdAt: Date`
- `updatedAt: Date`

**Domain Methods:**
- `isActiveForDate(date: Date): boolean`
- `activate(): void`
- `deactivate(): void`
- `updatePricing(...): void`

### Value Objects

#### Address
```typescript
{
  street: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
  coordinates?: { lat: number; lng: number };
}
```

#### Distance
```typescript
{
  kilometers: number;
  meters: number;
  calculatedAt: Date;
  routeType?: 'driving' | 'walking' | 'transit';
}
```

#### Medical Requirements
```typescript
{
  oxygenLiters?: number;
  requiresVentilator: boolean;
  requiresStretcher: boolean;
  requiresWheelchair: boolean;
  specialEquipment?: string[];
  patientCondition?: string;
  notes?: string;
}
```

#### Pricing Breakdown
```typescript
{
  baseFee: Money;
  distanceFee: Money;
  serviceLevelFee: Money;
  personnelFee: Money;
  equipmentFee: Money;
  subtotal: Money;
  taxes?: Money;
  total: Money;
  currency: string;
  lineItems: PricingLineItem[];
}
```

## Database Schema

### Transportation Requests Table

```sql
CREATE TYPE request_status AS ENUM ('draft', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE service_level AS ENUM ('bls', 'als');
CREATE TYPE personnel_type AS ENUM ('none', 'gp', 'specialist');
CREATE TYPE urgency_level AS ENUM ('routine', 'urgent', 'emergency');

CREATE TABLE transportation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL, -- Reference to company/partner
  requested_by TEXT NOT NULL, -- User ID or contact info
  status request_status NOT NULL DEFAULT 'draft',
  
  -- Addresses
  pickup_street TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  pickup_state TEXT,
  pickup_zip_code TEXT,
  pickup_country TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  
  dropoff_street TEXT NOT NULL,
  dropoff_city TEXT NOT NULL,
  dropoff_state TEXT,
  dropoff_zip_code TEXT,
  dropoff_country TEXT NOT NULL,
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),
  
  -- Distance (calculated)
  distance_kilometers DECIMAL(10, 2),
  distance_meters INTEGER,
  distance_calculated_at TIMESTAMPTZ,
  
  -- Medical Requirements
  service_level service_level NOT NULL,
  personnel_type personnel_type NOT NULL DEFAULT 'none',
  oxygen_liters DECIMAL(5, 2),
  requires_ventilator BOOLEAN NOT NULL DEFAULT false,
  requires_stretcher BOOLEAN NOT NULL DEFAULT false,
  requires_wheelchair BOOLEAN NOT NULL DEFAULT false,
  special_equipment TEXT[], -- Array of equipment names
  patient_condition TEXT,
  medical_notes TEXT,
  
  -- Scheduling
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  urgency urgency_level NOT NULL DEFAULT 'routine',
  
  -- Additional
  notes TEXT,
  quotation_id UUID, -- Reference to accepted quotation
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transportation_requests_request_number ON transportation_requests(request_number);
CREATE INDEX idx_transportation_requests_company_id ON transportation_requests(company_id);
CREATE INDEX idx_transportation_requests_status ON transportation_requests(status);
CREATE INDEX idx_transportation_requests_requested_date ON transportation_requests(requested_date);
CREATE INDEX idx_transportation_requests_created_at ON transportation_requests(created_at);
```

### Quotations Table

```sql
CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');

CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT NOT NULL UNIQUE,
  request_id UUID NOT NULL REFERENCES transportation_requests(id) ON DELETE CASCADE,
  status quotation_status NOT NULL DEFAULT 'draft',
  
  -- Pricing
  base_fee DECIMAL(10, 2) NOT NULL,
  distance_fee DECIMAL(10, 2) NOT NULL,
  service_level_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  personnel_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  equipment_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  taxes DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Context
  country TEXT NOT NULL,
  distance_kilometers DECIMAL(10, 2) NOT NULL,
  
  -- Validity
  valid_until TIMESTAMPTZ NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotations_quotation_number ON quotations(quotation_number);
CREATE INDEX idx_quotations_request_id ON quotations(request_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_valid_until ON quotations(valid_until);
```

### Pricing Rules Table

```sql
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  region TEXT, -- Optional regional variation
  
  -- Base Pricing
  base_fee DECIMAL(10, 2) NOT NULL,
  per_kilometer_rate DECIMAL(10, 2) NOT NULL,
  
  -- Service Level Surcharges
  bls_surcharge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  als_surcharge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Personnel Surcharges
  gp_surcharge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  specialist_surcharge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Equipment Rates
  oxygen_per_liter_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ventilator_surcharge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE, -- NULL if currently active
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pricing_rules_country ON pricing_rules(country);
CREATE INDEX idx_pricing_rules_country_region ON pricing_rules(country, region);
CREATE INDEX idx_pricing_rules_is_active ON pricing_rules(is_active);
CREATE INDEX idx_pricing_rules_effective_dates ON pricing_rules(effective_from, effective_to);
CREATE UNIQUE INDEX uq_pricing_rules_country_region_active ON pricing_rules(country, region) WHERE is_active = true AND (effective_to IS NULL OR effective_to >= CURRENT_DATE);
```

## API Endpoints

### Transportation Requests

- `GET /api/transportation-requests` - List all requests (with filters)
- `GET /api/transportation-requests/:id` - Get request by ID
- `POST /api/transportation-requests` - Create new request
- `PATCH /api/transportation-requests/:id` - Update request
- `POST /api/transportation-requests/:id/confirm-requirements` - Confirm medical requirements
- `POST /api/transportation-requests/:id/generate-quotation` - Generate automated quotation
- `POST /api/transportation-requests/:id/cancel` - Cancel request
- `GET /api/transportation-requests/:id/calculate-distance` - Calculate distance (preview)

### Quotations

- `GET /api/quotations` - List all quotations
- `GET /api/quotations/:id` - Get quotation by ID
- `GET /api/quotations/request/:requestId` - Get quotation for a request
- `POST /api/quotations/:id/accept` - Accept quotation
- `POST /api/quotations/:id/reject` - Reject quotation
- `GET /api/quotations/:id/breakdown` - Get detailed pricing breakdown

### Pricing Rules

- `GET /api/pricing-rules` - List all pricing rules
- `GET /api/pricing-rules/country/:country` - Get active pricing rules for country
- `GET /api/pricing-rules/:id` - Get pricing rule by ID
- `POST /api/pricing-rules` - Create new pricing rule
- `PATCH /api/pricing-rules/:id` - Update pricing rule
- `DELETE /api/pricing-rules/:id` - Deactivate pricing rule

## Incremental Implementation Phases

This approach starts with the **simplest possible implementation** and adds features incrementally. Each phase builds on the previous one.

---

### Phase 1: Basic Request Creation (MVP)

**Goal**: Create the simplest possible request - just save pickup/dropoff addresses

**What we build**:
- Simple database table with minimal fields
- Basic API endpoint to create a request
- Basic API endpoint to list requests

**Database Schema** (minimal):
```sql
CREATE TABLE transportation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE, -- Auto-generated: REQ-2026-001
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**API Endpoints**:
- `POST /api/transportation-requests` - Create request (just addresses)
- `GET /api/transportation-requests` - List all requests
- `GET /api/transportation-requests/:id` - Get one request

**What we skip for now**:
- Distance calculation
- Pricing
- Medical requirements
- Quotations
- Complex validation

**Files to create**:
1. Module structure (minimal)
2. Domain entity (simple)
3. Repository interface + implementation
4. Create command
5. Find queries
6. Controller + DTOs
7. Module registration

**Time**: ~2-3 hours

---

### Phase 2: Add Medical Requirements

**Goal**: Add fields for medical requirements to the request

**What we add**:
- Service level (BLS/ALS)
- Personnel type (none/GP/Specialist)
- Equipment needs (oxygen liters, ventilator, etc.)

**Database changes**:
```sql
ALTER TABLE transportation_requests ADD COLUMN service_level TEXT; -- 'bls' or 'als'
ALTER TABLE transportation_requests ADD COLUMN personnel_type TEXT DEFAULT 'none'; -- 'none', 'gp', 'specialist'
ALTER TABLE transportation_requests ADD COLUMN oxygen_liters DECIMAL(5,2);
ALTER TABLE transportation_requests ADD COLUMN requires_ventilator BOOLEAN DEFAULT false;
```

**API changes**:
- Update DTOs to include medical fields
- Update create/update endpoints

**What we skip for now**:
- Distance calculation
- Pricing
- Quotations

**Time**: ~1-2 hours

---

### Phase 3: Add Distance Calculation

**Goal**: Calculate distance between pickup and dropoff addresses

**What we add**:
- Distance field in database
- Map service integration (start with a simple one like OpenRouteService or Google Maps)
- Service to calculate distance
- Endpoint to calculate/update distance

**Database changes**:
```sql
ALTER TABLE transportation_requests ADD COLUMN distance_kilometers DECIMAL(10,2);
ALTER TABLE transportation_requests ADD COLUMN distance_calculated_at TIMESTAMPTZ;
```

**New files**:
- Map service interface
- Map service client (Google Maps/Mapbox/OpenRouteService)
- Distance calculation service
- Update command to calculate distance

**API changes**:
- `POST /api/transportation-requests/:id/calculate-distance` - Calculate distance

**What we skip for now**:
- Pricing
- Quotations

**Time**: ~3-4 hours

---

### Phase 4: Add Basic Pricing

**Goal**: Calculate a simple price (base fee + per-km rate)

**What we add**:
- Simple pricing rules table (hardcoded or single country)
- Pricing calculation service
- Price fields in request

**Database changes**:
```sql
-- Simple pricing rules (one row for now)
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL DEFAULT 'US',
  base_fee DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  per_kilometer_rate DECIMAL(10,2) NOT NULL DEFAULT 2.50,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE transportation_requests ADD COLUMN calculated_price DECIMAL(10,2);
ALTER TABLE transportation_requests ADD COLUMN currency TEXT DEFAULT 'USD';
```

**New files**:
- Pricing rule entity + repository
- Pricing calculation service
- Update command to calculate price

**API changes**:
- `POST /api/transportation-requests/:id/calculate-price` - Calculate price
- `GET /api/pricing-rules` - Get pricing rules (admin)

**Formula**: `price = baseFee + (distanceKm * perKmRate)`

**What we skip for now**:
- Service level surcharges
- Personnel surcharges
- Equipment fees
- Quotations

**Time**: ~2-3 hours

---

### Phase 5: Add Service Level & Personnel Pricing

**Goal**: Add surcharges for BLS/ALS and personnel types

**What we add**:
- Surcharge fields in pricing rules
- Update pricing calculation to include surcharges

**Database changes**:
```sql
ALTER TABLE pricing_rules ADD COLUMN bls_surcharge DECIMAL(10,2) DEFAULT 0;
ALTER TABLE pricing_rules ADD COLUMN als_surcharge DECIMAL(10,2) DEFAULT 0;
ALTER TABLE pricing_rules ADD COLUMN gp_surcharge DECIMAL(10,2) DEFAULT 0;
ALTER TABLE pricing_rules ADD COLUMN specialist_surcharge DECIMAL(10,2) DEFAULT 0;
```

**Formula update**: 
```
price = baseFee 
      + (distanceKm * perKmRate)
      + serviceLevelSurcharge (BLS or ALS)
      + personnelSurcharge (GP or Specialist)
```

**Time**: ~1-2 hours

---

### Phase 6: Add Equipment Pricing

**Goal**: Add pricing for oxygen and ventilator

**What we add**:
- Equipment pricing fields in pricing rules
- Update pricing calculation

**Database changes**:
```sql
ALTER TABLE pricing_rules ADD COLUMN oxygen_per_liter_rate DECIMAL(10,2) DEFAULT 0;
ALTER TABLE pricing_rules ADD COLUMN ventilator_surcharge DECIMAL(10,2) DEFAULT 0;
```

**Formula update**:
```
price = baseFee 
      + (distanceKm * perKmRate)
      + serviceLevelSurcharge
      + personnelSurcharge
      + (oxygenLiters * oxygenPerLiterRate)
      + (ventilator ? ventilatorSurcharge : 0)
```

**Time**: ~1 hour

---

### Phase 7: Add Quotations

**Goal**: Generate quotations from requests

**What we add**:
- Quotations table
- Quotation generation service
- Quotation endpoints

**Database changes**:
```sql
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT NOT NULL UNIQUE,
  request_id UUID NOT NULL REFERENCES transportation_requests(id),
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected'
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transportation_requests ADD COLUMN quotation_id UUID REFERENCES quotations(id);
```

**New files**:
- Quotation entity + repository
- Quotation generation service
- Quotation controller + DTOs

**API changes**:
- `POST /api/transportation-requests/:id/generate-quotation` - Generate quotation
- `GET /api/quotations/:id` - Get quotation
- `POST /api/quotations/:id/accept` - Accept quotation
- `POST /api/quotations/:id/reject` - Reject quotation

**Time**: ~3-4 hours

---

### Phase 8: Add Country-Specific Pricing

**Goal**: Support different pricing rules per country

**What we add**:
- Country field in requests
- Multiple pricing rules (one per country)
- Update pricing calculation to find rule by country

**Database changes**:
```sql
ALTER TABLE transportation_requests ADD COLUMN country TEXT NOT NULL DEFAULT 'US';
ALTER TABLE pricing_rules ADD COLUMN country TEXT NOT NULL; -- Already exists, but make it required
CREATE INDEX idx_pricing_rules_country ON pricing_rules(country);
```

**Logic update**:
- When calculating price, find pricing rule by country
- If no rule found, use default or error

**Time**: ~1-2 hours

---

### Phase 9: Add Detailed Pricing Breakdown

**Goal**: Show line-by-line pricing breakdown in quotations

**What we add**:
- Pricing breakdown value object
- Store breakdown in quotation
- Return breakdown in API response

**Database changes**:
```sql
ALTER TABLE quotations ADD COLUMN base_fee DECIMAL(10,2);
ALTER TABLE quotations ADD COLUMN distance_fee DECIMAL(10,2);
ALTER TABLE quotations ADD COLUMN service_level_fee DECIMAL(10,2);
ALTER TABLE quotations ADD COLUMN personnel_fee DECIMAL(10,2);
ALTER TABLE quotations ADD COLUMN equipment_fee DECIMAL(10,2);
```

**API changes**:
- Return detailed breakdown in quotation response

**Time**: ~1-2 hours

---

### Phase 10: Frontend Integration

**Goal**: Build UI for creating requests and viewing quotations

**What we build**:
- Request creation form
- Request list
- Quotation display
- Basic admin UI for pricing rules

**Time**: ~1-2 days

---

## Quick Start: Phase 1 Implementation

Here's the minimal code to get Phase 1 working:

### 1. Create Module Structure
```bash
mkdir -p src/modules/operations/ambulance-transportation/{domain/{entities,interfaces},application/{commands,queries},infrastructure/repositories,api/{controllers,dto}}
```

### 2. Database Schema (schema.ts)
```typescript
export const transportationRequests = pgTable('transportation_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestNumber: text('request_number').notNull().unique(),
  pickupAddress: text('pickup_address').notNull(),
  dropoffAddress: text('dropoff_address').notNull(),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### 3. Domain Entity (minimal)
```typescript
export class TransportationRequest extends BaseEntity {
  constructor(
    public id: string,
    public requestNumber: string,
    public pickupAddress: string,
    public dropoffAddress: string,
    public status: string = 'draft',
  ) {
    super();
  }
  
  static create(data: { pickupAddress: string; dropoffAddress: string }): TransportationRequest {
    return new TransportationRequest(
      uuid(),
      `REQ-${new Date().getFullYear()}-${Date.now()}`,
      data.pickupAddress,
      data.dropoffAddress,
    );
  }
}
```

### 4. Repository + Command + Controller
- Follow existing patterns from `mailbox` module
- Create, Find, List operations only

**That's it for Phase 1!** You can create requests immediately. Then add features phase by phase.

---

## Dependencies

### External Services

1. **Map Service** (choose one):
   - Google Maps API
   - Mapbox API
   - OpenRouteService API

2. **Configuration**:
   - API keys for map service
   - Country/currency data
   - Timezone handling

### Internal Dependencies

1. **Company/Partner Module** (if exists):
   - Reference to `companyId` in requests
   - Company validation

2. **User Management** (if exists):
   - Reference to `requestedBy` user
   - User permissions/roles

3. **Notification Module** (if exists):
   - Integration for quotation notifications

## Validation Rules

### Transportation Request
- `requestNumber`: Auto-generated, unique
- `companyId`: Required, must exist
- `pickupAddress`: Required, valid address format
- `dropoffAddress`: Required, valid address format
- `serviceLevel`: Required, must be 'bls' or 'als'
- `personnelType`: Required, must be 'none', 'gp', or 'specialist'
- `requestedDate`: Required, must be in the future
- `requestedTime`: Required
- `oxygenLiters`: Optional, must be positive if provided
- `distance`: Must be calculated before quotation generation

### Quotation
- `quotationNumber`: Auto-generated, unique
- `requestId`: Required, must reference existing request
- `totalAmount`: Must match sum of all fees
- `validUntil`: Must be in the future
- `currency`: Must be valid ISO 4217 code
- `country`: Required, must have active pricing rule

### Pricing Rule
- `country`: Required, valid ISO 3166-1 alpha-2 code
- `baseFee`: Required, must be non-negative
- `perKilometerRate`: Required, must be non-negative
- `currency`: Required, valid ISO 4217 code
- `effectiveFrom`: Required, must be valid date
- `effectiveTo`: Optional, must be after `effectiveFrom` if provided
- Only one active rule per country/region combination

## Error Handling

Use NestJS exceptions:
- `NotFoundException` - When request/quotation/rule not found
- `BadRequestException` - When validation fails or invalid input
- `ConflictException` - When duplicate request number or rule conflict
- `UnprocessableEntityException` - When business rules prevent operation (e.g., quotation expired)
- `ServiceUnavailableException` - When map service is unavailable
- `InternalServerErrorException` - For unexpected errors

## Testing Strategy

### Unit Tests
- Domain entities (business logic methods)
- Value objects validation
- Commands and queries
- Pricing calculation service
- Distance calculation service
- Repository implementations

### Integration Tests
- API endpoints
- Database operations
- Map service integration
- End-to-end quotation generation flow

### E2E Tests
- Complete request creation → quotation generation → acceptance flow
- Pricing rules management
- Error scenarios

### Test Data
- Seed scripts for development
- Factory functions for test data
- Mock map service responses

## Security Considerations

1. **API Authentication**: Secure all endpoints with authentication
2. **Authorization**: Role-based access (operations team, admin, etc.)
3. **Data Validation**: Strict input validation on all endpoints
4. **Rate Limiting**: Prevent abuse of map service API
5. **Sensitive Data**: Encrypt sensitive medical information if required
6. **Audit Logging**: Log all request/quotation changes

## Future Enhancements

1. **Real-time Tracking**: GPS tracking of ambulances
2. **Scheduling Optimization**: Route optimization for multiple requests
3. **Capacity Management**: Track available ambulances and personnel
4. **Multi-currency Support**: Automatic currency conversion
5. **Contract Integration**: Link to partner contracts for special pricing
6. **Mobile App**: Native mobile app for field operations
7. **Integration with Dispatch Systems**: Connect to ambulance dispatch software
8. **Historical Analytics**: Trend analysis and forecasting
9. **Automated Routing**: Optimal route suggestions
10. **Equipment Inventory**: Track available medical equipment

## Notes

- Follow existing patterns from `mailbox` module
- Maintain consistency with Clean Architecture principles
- Use value objects for complex domain concepts (Address, Distance, etc.)
- Keep pricing calculation logic in domain/application layer, not infrastructure
- Consider using a state machine for request/quotation status transitions
- Plan for scalability: pricing rules can grow significantly
- Consider using a message queue for async operations (distance calculation, notifications)
- Implement proper logging for debugging and auditing
