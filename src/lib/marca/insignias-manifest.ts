// Generado por docs/branding-kit/scripts/optimize-grados.mjs — no editar a mano.
// Medidas (px) de public/grados/{CODIGO}.webp tras recortar el lienzo.

export const GRADE_INSIGNIA_SIZES = {
  "CAP": { width: 229, height: 72 },
  "CC": { width: 90, height: 72 },
  "CF": { width: 89, height: 72 },
  "CN": { width: 109, height: 72 },
  "CNEL": { width: 227, height: 72 },
  "GB": { width: 74, height: 72 },
  "GD": { width: 149, height: 72 },
  "GJ": { width: 299, height: 72 },
  "MAY": { width: 74, height: 72 },
  "MG": { width: 224, height: 72 },
  "PTTE": { width: 151, height: 72 },
  "S1": { width: 50, height: 72 },
  "S2": { width: 30, height: 72 },
  "SA": { width: 117, height: 72 },
  "SM1": { width: 103, height: 72 },
  "SM2": { width: 87, height: 72 },
  "SM3": { width: 70, height: 72 },
  "SS": { width: 135, height: 72 },
  "TC": { width: 46, height: 72 },
  "TCNEL": { width: 151, height: 72 },
  "TF": { width: 67, height: 72 },
  "TN": { width: 68, height: 72 },
  "TTE": { width: 75, height: 72 },
} as const satisfies Record<string, { width: number; height: number }>;

export type GradeInsigniaCode = keyof typeof GRADE_INSIGNIA_SIZES;
