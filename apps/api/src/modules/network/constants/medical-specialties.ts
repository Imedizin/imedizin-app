/**
 * Allowed medical specialties for Medical Providers.
 * Stored as-is in DB; use for validation and filtering (e.g. WHERE 'Cardiology' = ANY(specialties)).
 */
export const ALL_MEDICAL_SPECIALTIES: readonly string[] = [
  'General',
  'Cardiology',
  'Pulmonology',
  'Hematology',
  'Medical Oncology',
  'Endocrinology',
  'Hepatology',
  'Gastroenterology',
  'Nephrology',
  'Neurology',
  'Dermatology',
  'Psychiatry',
  'Rheumatology',
  'GIT',
  'Neurosurgery',
  'Urology',
  'Orthopedics',
  'Surgical Oncology',
  'Plastic Surgery',
  'Transplantation',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'E.N.T',
  'Ophthalmology',
  'Emergency medicine',
  'General Practitioner',
  'Physiotherapy',
  'Dentistry',
  'Radiology',
  'Clinical Pathology',
  'Anesthesiology',
  'Pain Management',
  'I.C.U',
  'C.C.U',
] as const;

export type MedicalSpecialty = (typeof ALL_MEDICAL_SPECIALTIES)[number];
