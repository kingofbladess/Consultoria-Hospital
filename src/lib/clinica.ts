// Cálculos clínicos sencillos para mostrar junto a los signos vitales. Son una ayuda visual:
// no reemplazan la interpretación del médico.

export function imc(pesoKg: number | null, tallaCm: number | null): number | null {
  if (!pesoKg || !tallaCm) return null;
  const m = tallaCm / 100;
  return Math.round((pesoKg / (m * m)) * 10) / 10;
}

/** Clasificación de la OMS para adultos. En menores de 18 años el IMC se interpreta por percentiles. */
export function clasificarImc(valor: number, edad: number): { texto: string; tono: string } {
  if (edad < 18) return { texto: "Interpretar por percentiles (pediatría)", tono: "neutro" };
  if (valor < 18.5) return { texto: "Bajo peso", tono: "alerta" };
  if (valor < 25) return { texto: "Normal", tono: "exito" };
  if (valor < 30) return { texto: "Sobrepeso", tono: "alerta" };
  return { texto: "Obesidad", tono: "peligro" };
}

type Signos = {
  tensionSistolica: number | null;
  tensionDiastolica: number | null;
  frecuenciaCardiaca: number | null;
  frecuenciaRespiratoria: number | null;
  temperatura: number | null;
  saturacion: number | null;
};

/** Señales de atención en adultos (umbrales habituales de triaje). */
export function alertasSignos(s: Signos, edad: number): string[] {
  const a: string[] = [];
  if (edad >= 18) {
    if ((s.tensionSistolica ?? 0) >= 140 || (s.tensionDiastolica ?? 0) >= 90) a.push("Tensión arterial elevada");
    if (s.tensionSistolica !== null && s.tensionSistolica < 90) a.push("Tensión arterial baja");
    if (s.frecuenciaCardiaca !== null && (s.frecuenciaCardiaca > 100 || s.frecuenciaCardiaca < 50)) a.push("Frecuencia cardíaca fuera de rango");
  }
  if ((s.temperatura ?? 0) >= 38) a.push("Fiebre");
  if (s.saturacion !== null && s.saturacion < 92) a.push("Saturación baja");
  return a;
}
