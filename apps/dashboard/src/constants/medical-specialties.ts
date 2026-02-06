/**
 * Predefined medical specialties, grouped by category.
 * Used in Medical Provider form and elsewhere.
 */
export const MEDICAL_SPECIALTY_GROUPS: { label: string; options: string[] }[] = [
  {
    label: "Internal Medicine",
    options: [
      "General",
      "Cardiology",
      "Pulmonology",
      "Hematology",
      "Medical Oncology",
      "Endocrinology",
      "Hepatology",
      "Gastroenterology",
      "Nephrology",
      "Neurology",
      "Dermatology",
      "Psychiatry",
      "Rheumatology",
    ],
  },
  {
    label: "Surgery",
    options: [
      "General",
      "GIT",
      "Neurosurgery",
      "Urology",
      "Orthopedics",
      "Surgical Oncology",
      "Plastic Surgery",
      "Transplantation",
    ],
  },
  {
    label: "Other specialities",
    options: [
      "Pediatrics",
      "Obstetrics & Gynecology",
      "E.N.T",
      "Ophthalmology",
      "Emergency medicine",
      "General Practitioner",
      "Physiotherapy",
      "Dentistry",
      "Radiology",
      "Clinical Pathology",
      "Anesthesiology",
      "Pain Management",
      "I.C.U",
      "C.C.U",
    ],
  },
];

/** Flat list of all specialty values (for validation or display). */
export const ALL_MEDICAL_SPECIALTIES = MEDICAL_SPECIALTY_GROUPS.flatMap(
  (g) => g.options,
);
