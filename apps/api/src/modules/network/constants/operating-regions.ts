/**
 * Allowed operating regions for Case Providers.
 * Stored as-is in DB; use for validation and filtering (e.g. WHERE 'North America' = ANY(operating_regions)).
 */
export const OPERATING_REGIONS: readonly string[] = [
  "North America",
  "South America",
  "Central America",
  "Caribbean",
  "Europe",
  "Middle East",
  "North Africa",
  "Sub-Saharan Africa",
  "Asia Pacific",
  "South Asia",
  "Southeast Asia",
  "East Asia",
  "Central Asia",
  "Oceania",
  "Global",
] as const;

export type OperatingRegion = (typeof OPERATING_REGIONS)[number];
