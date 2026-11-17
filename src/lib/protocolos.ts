// Reglas clínicas que usa el llenado automático del récipe. Este archivo corre en el navegador
// y en el servidor, así que no importa nada de la base de datos.

/** Por debajo de esta edad se usa el protocolo pediátrico (dosis de niño). */
export const EDAD_PEDIATRICA = 12;

export type Grupo = "ADULTO" | "PEDIATRICO";

export function grupoPorEdad(edad: number): Grupo {
  return edad < EDAD_PEDIATRICA ? "PEDIATRICO" : "ADULTO";
}

export const nombreGrupo: Record<Grupo, string> = {
  ADULTO: "Adulto",
  PEDIATRICO: "Pediátrico",
};

const numero = (n: number, decimales = 1) =>
  n.toLocaleString("es-VE", { minimumFractionDigits: 0, maximumFractionDigits: decimales });

/**
 * Dosis por peso: mg/kg × peso, sin pasar del máximo por toma.
 * Si la presentación es líquida (mgPorMl), devuelve los ml redondeados a medio ml,
 * que es lo que se puede medir con una jeringa dosificadora.
 */
export function dosisPorPeso(
  regla: { dosisMgKg: number; dosisMaxMg: number | null; mgPorMl: number | null },
  pesoKg: number,
): { texto: string; mg: number; limitada: boolean } {
  const calculada = regla.dosisMgKg * pesoKg;
  const limitada = regla.dosisMaxMg !== null && calculada > regla.dosisMaxMg;
  const mg = limitada ? regla.dosisMaxMg! : calculada;
  if (regla.mgPorMl) {
    // Si se llegó al máximo, se redondea hacia abajo para no pasarlo; si no, al medio ml más cercano.
    const redondeo = limitada ? Math.floor : Math.round;
    const ml = Math.max(0.5, redondeo((mg / regla.mgPorMl) * 2) / 2);
    return { texto: `${numero(ml)} ml (${numero(ml * regla.mgPorMl, 0)} mg)`, mg: ml * regla.mgPorMl, limitada };
  }
  return { texto: `${numero(mg, 0)} mg`, mg, limitada };
}

/** Explicación corta de una regla de dosis por peso, para mostrarla al médico. */
export function describirRegla(regla: { dosisMgKg: number; dosisMaxMg: number | null; mgPorMl: number | null }): string {
  const partes = [`${numero(regla.dosisMgKg)} mg/kg por toma`];
  if (regla.dosisMaxMg) partes.push(`máximo ${numero(regla.dosisMaxMg, 0)} mg`);
  if (regla.mgPorMl) partes.push(`presentación de ${numero(regla.mgPorMl)} mg/ml`);
  return partes.join(", ");
}

// ─── Alergias ─────────────────────────────────────────────────────────

const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Familias de medicamentos: una alergia a la familia alcanza a todos sus miembros. */
const FAMILIAS: Record<string, string[]> = {
  penicilina: ["penicilina", "amoxicilina", "ampicilina", "dicloxacilina", "piperacilina", "oxacilina"],
  betalactamico: ["penicilina", "amoxicilina", "ampicilina", "cefalexina", "cefadroxilo", "ceftriaxona", "cefuroxima"],
  cefalosporina: ["cefalexina", "cefadroxilo", "ceftriaxona", "cefuroxima", "cefixima"],
  aines: ["ibuprofeno", "diclofenac", "naproxeno", "ketorolaco", "acido acetilsalicilico", "aspirina", "meloxicam", "piroxicam", "metamizol"],
  sulfa: ["sulfametoxazol", "sulfadiazina", "sulfasalazina"],
  macrolido: ["azitromicina", "claritromicina", "eritromicina"],
  quinolona: ["ciprofloxacina", "levofloxacina", "moxifloxacina"],
  opioide: ["tramadol", "codeina", "morfina", "oxicodona"],
};

const PALABRAS_VACIAS = new Set(["alergia", "alergias", "alergico", "alergica", "intolerancia", "reaccion", "hacia"]);

/**
 * Busca si un medicamento choca con las alergias anotadas del paciente.
 * Devuelve la alergia que coincide, o null. Es una ayuda, no reemplaza el criterio médico.
 */
export function choqueAlergia(alergias: string | null | undefined, medicamento: string): string | null {
  if (!alergias?.trim() || !medicamento.trim()) return null;
  const med = normalizar(medicamento);
  const anotadas = normalizar(alergias)
    .split(/[,;\n/]+|\sy\s/)
    .map((a) => a.trim())
    .filter((a) => a.length >= 4);

  for (const alergia of anotadas) {
    const palabras = alergia.split(/\s+/).filter((p) => p.length >= 4 && !PALABRAS_VACIAS.has(p));
    // Alergia anotada con el nombre del medicamento ("alergia a ibuprofeno").
    if (palabras.some((p) => med.includes(p))) return alergia;
    // Alergia anotada a una familia ("penicilinas", "AINES", "sulfas").
    for (const [familia, miembros] of Object.entries(FAMILIAS)) {
      if (palabras.some((p) => p.startsWith(familia) || familia.startsWith(p.replace(/s$/, ""))) && miembros.some((m) => med.includes(m))) {
        return alergia;
      }
    }
  }
  return null;
}
