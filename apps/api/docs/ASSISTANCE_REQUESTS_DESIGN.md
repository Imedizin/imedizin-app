# Assistance Requests: Parent + Children Design

This document defines the **parent (assistance_requests) + children (transport_requests, medical_requests)** model for assistance requests. Patient info lives on the parent; there is no separate patients table for now. **No existing operations/transport backend is assumed**—we are building from scratch.

---

## 1. Proposed model (summary)

| Layer | Table / concept | Purpose |
|-------|------------------|--------|
| **Parent** | `assistance_requests` | Shared fields for all service types (MEDICAL, TRANSPORT), including patient info |
| **Child** | `transport_requests` | Transport-specific fields (1:1 with parent when `service_type = TRANSPORT`) |
| **Child** | `medical_requests` | Medical-case-specific fields (1:1 with parent when `service_type = MEDICAL`) |

**For now:** No relationship between medical and transport requests is implemented, but the schema keeps it possible (e.g. optional `related_medical_request_id` on transport) as described later in this document.

---

## 2. Schema mapping

### 2.1 Parent: `assistance_requests`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `service_type` | ENUM | `TRANSPORT`, `MEDICAL` |
| `status` | TEXT/ENUM | e.g. NEW, IN_REVIEW, APPROVED, DISPATCHED, COMPLETED, CANCELLED |
| `priority` | TEXT/ENUM | optional |
| `provider_reference_number` | TEXT | UNIQUE/INDEX — case/insurance provider reference |
| `received_at` | TIMESTAMPTZ | “received at” |
| `case_provider_id` | UUID FK | → `case_providers.id` (we already have this table) |
| **Patient (on parent)** | | |
| `patient_full_name` | TEXT | |
| `patient_birth_date` | DATE | |
| `patient_nationality_code` | TEXT | e.g. ISO 3166-1 alpha-2 |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

**Optional later:** `request_number` (e.g. AR-2025-001) can live here or be generated per service type (TR-… / MC-…).

---

### 2.2 Child: `transport_requests`

| Column | Type | Notes |
|--------|------|--------|
| `request_id` | UUID PK/FK | → `assistance_requests.id` (1:1) |
| `pickup_point` | TEXT (or FK) | Phase 1: text; later `pickup_location_id` → `locations` |
| `dropoff_point` | TEXT (or FK) | Same |
| `requested_transport_at` | DATE/TIMESTAMPTZ | “date of requested transportation” |
| `mode_of_transport` | ENUM | LIMOUSINE (lemozen), ALS, BLS |
| `medical_crew_required` | BOOLEAN | “with or without escorting medical crew” |
| `companion_count` | SMALLINT or `has_companion` BOOLEAN | “there a companion” |
| `estimated_pickup_time` | TIMESTAMPTZ | |
| `estimated_dropoff_time` | TIMESTAMPTZ | |
| `diagnosis` | TEXT nullable | Optional on transport for justification; see §4 |

**Timing:**  
- Parent: `received_at` (when request was received).  
- Child: `requested_transport_at`, `estimated_pickup_time`, `estimated_dropoff_time`.

**Optional (for later):** `related_medical_request_id` (FK → `assistance_requests.id` where `service_type = 'MEDICAL'`) to link transport to a medical case. Not implemented for now; schema can reserve it.

---

### 2.3 Child: `medical_requests`

| Column | Type | Notes |
|--------|------|--------|
| `request_id` | UUID PK/FK | → `assistance_requests.id` (1:1) |
| `case_provider_reference_number` | TEXT | |
| `admission_date` | DATE | |
| `discharge_date` | DATE | |
| `country` | TEXT | Treatment location |
| `city` | TEXT | |
| `medical_provider_id` | UUID FK | → `medical_providers.id` (we have this table) |
| `diagnosis` | TEXT | ICD-10 etc. later |
| (+ future) | | e.g. chief_complaint, triage_level, admission_required |

Diagnosis is stored here for medical cases; transport has its own optional `diagnosis` for standalone requests (§4).

---

## 3. Relationship: Transport ↔ Medical

**For now:** No relationship between medical and transport requests is implemented. Each request stands on its own.

**Kept possible for later:** Transport can optionally be linked to a medical case (e.g. “transfer from hospital A to B for surgery”). The schema can reserve an optional FK on transport:  
`transport_requests.related_medical_request_id` (FK → `assistance_requests.id` WHERE `service_type = 'MEDICAL'`).  
When that is implemented: if transport is linked, diagnosis can be taken from the related medical case; if standalone, use `transport_requests.diagnosis`.

---

## 4. Where diagnosis lives

Use a single column name **`diagnosis`** (TEXT) in both child tables:

| Scenario | Where diagnosis is stored |
|----------|---------------------------|
| Medical case | `medical_requests.diagnosis` |
| Transport **standalone** (for now) | `transport_requests.diagnosis` (nullable) |
| Transport **linked** to medical (later) | From related medical request; no duplicate on transport |

No `medical_diagnosis_text` or `diagnosis_text`—just `diagnosis` everywhere.

---

## 5. Location modeling

- **Phase 1:** Keep `pickup_point` / `dropoff_point` as TEXT (and/or `pickup_point_text`, `dropoff_point_text`).
- **Later:** Introduce `locations` (address, city, country, lat/lng) and FKs:  
  `transport_requests.pickup_location_id`, `dropoff_location_id`.  
  Medical can reuse the same or add facility-specific fields.

---

## 6. Backend and frontend context

**Backend (API):**  
- **No existing operations module.** We build the assistance-requests domain from scratch (parent + transport/medical children).  
- **Reuse from network module:** `case_providers`, `medical_providers` — use as FKs: `assistance_requests.case_provider_id`, `medical_requests.medical_provider_id`.  
- **New tables:** `assistance_requests` (includes patient fields on parent), `transport_requests` (child), `medical_requests` (child). No separate `patients` table for now.

**Frontend (dashboard):**  
- Already has unified types: `AssistanceRequestBase`, `TransportAssistanceRequest`, `MedicalCaseAssistanceRequest`, and shared `patient` + `diagnosis` etc.  
- These map cleanly to parent + patient + transport/medical child once the new API exists.

---

## 7. Enums (recommended)

- **service_type:** `MEDICAL`, `TRANSPORT`
- **mode_of_transport:** `LIMOUSINE`, `ALS`, `BLS` (map “lemozen” → LIMOUSINE)
- **status (parent):** e.g. `NEW`, `IN_REVIEW`, `APPROVED`, `DISPATCHED`, `COMPLETED`, `CANCELLED`  
  (Medical and transport can share or extend with type-specific statuses in app logic.)

---

## 8. Implementation: new assistance-requests module

**Single approach (clean slate):**

- Add a new module under `modules/assistance-requests/`.
- **No existing transport/operations code to migrate** — the previous operations module has been removed.
- The new module contains:
  - **Parent:** `assistance_requests` (entity, repo, create/find/list). Patient info is on this table.
  - **Children:** `transport_requests` (child table), `medical_requests` (child table).
- One schema (e.g. in this module’s `infrastructure/schema.ts`) defines: `assistance_requests`, `transport_requests`, `medical_requests`. Register it in the app’s Drizzle config and database module.

---

## 9. Suggested next steps

1. **Add schema:** `assistance_requests` (with patient fields), `transport_requests` (child), `medical_requests` (child) in the new module. Optionally reserve `related_medical_request_id` on transport for later.
2. **Implement:** Parent creation (including patient fields) in one transaction; then create the appropriate child (transport or medical).
3. **API:** Single “create assistance request” that accepts `service_type` and payload for either transport or medical; backend creates parent + child in one flow.
4. **Wire dashboard:** Point the dashboard to the new assistance-requests API (list, get, create) so it uses real data instead of dummy.

This keeps the design (parent + children, patient on parent, single `diagnosis` name, `provider_reference_number`), and leaves room for a medical–transport link and locations later.
