// Catálogo de componentes y grados de la FANB con sus artes, tomado de
// branding-kit/branding-kit/assets/{componentes,grados}/indice.csv.
//
// Reglas del kit (BRANDING.md, «Artes institucionales»):
// 1. El arte de un grado se busca por abreviatura Y categoría, nunca solo por abreviatura.
// 2. La Armada usa su denominación naval (C/N, no CNEL).
// 3. Si no hay arte, no se pinta nada (ni genérico ni de otro grado).
// 4. La insignia nunca reemplaza al texto del grado.

import { GRADE_INSIGNIA_SIZES } from "./insignias-manifest";

export type CodigoComponente = "EJB" | "ARBV" | "AMB" | "GNB" | "MB";

export const COMPONENTES: { codigo: CodigoComponente; nombre: string; slug: string | null }[] = [
  { codigo: "EJB", nombre: "Ejército Bolivariano", slug: "ejercito" },
  { codigo: "ARBV", nombre: "Armada Bolivariana", slug: "armada" },
  { codigo: "AMB", nombre: "Aviación Militar Bolivariana", slug: "aviacion" },
  { codigo: "GNB", nombre: "Guardia Nacional Bolivariana", slug: "guardia-nacional" },
  { codigo: "MB", nombre: "Milicia Bolivariana", slug: null }, // Sin escudo en el kit.
];

export type Categoria = "OFICIAL_GENERAL" | "OFICIAL_SUPERIOR" | "OFICIAL_SUBALTERNO" | "TROPA_PROFESIONAL" | "TROPA_ALISTADA";

export type Grado = {
  /** Clave guardada en la base: categoría + abreviatura (única aunque la abreviatura se repita). */
  clave: string;
  abreviatura: string;
  nombre: string;
  nivel: string;
  categoria: Categoria;
  aplicaA: CodigoComponente[];
  /** Código del arte (abreviatura sin barra), o null si no hay arte. */
  arte: string | null;
};

const T: CodigoComponente[] = ["EJB", "AMB", "GNB"]; // Denominación terrestre
const N: CodigoComponente[] = ["ARBV"]; // Denominación naval
const TODOS: CodigoComponente[] = ["EJB", "ARBV", "AMB", "GNB"];

// [arte, abreviatura, nivel, categoría, nombre, aplica a]
const FILAS: [string | null, string, string, Categoria, string, CodigoComponente[]][] = [
  ["GJ", "G/J", "O10", "OFICIAL_GENERAL", "General en Jefe", T],
  ["GJ", "A/J", "O10", "OFICIAL_GENERAL", "Almirante en Jefe", N],
  ["MG", "M/G", "O9", "OFICIAL_GENERAL", "Mayor General", T],
  ["MG", "ALM", "O9", "OFICIAL_GENERAL", "Almirante", N],
  ["GD", "G/D", "O8", "OFICIAL_GENERAL", "General de División", T],
  ["GD", "V/A", "O8", "OFICIAL_GENERAL", "Vicealmirante", N],
  ["GB", "G/B", "O7", "OFICIAL_GENERAL", "General de Brigada", T],
  ["GB", "C/A", "O7", "OFICIAL_GENERAL", "Contralmirante", N],
  ["CNEL", "CNEL", "O6", "OFICIAL_SUPERIOR", "Coronel", T],
  ["CN", "C/N", "O6", "OFICIAL_SUPERIOR", "Capitán de Navío", N],
  ["TCNEL", "TCNEL", "O5", "OFICIAL_SUPERIOR", "Teniente Coronel", T],
  ["CF", "C/F", "O5", "OFICIAL_SUPERIOR", "Capitán de Fragata", N],
  ["MAY", "MAY", "O4", "OFICIAL_SUPERIOR", "Mayor", T],
  ["CC", "C/C", "O4", "OFICIAL_SUPERIOR", "Capitán de Corbeta", N],
  ["CAP", "CAP", "O3", "OFICIAL_SUBALTERNO", "Capitán", T],
  ["TN", "T/N", "O3", "OFICIAL_SUBALTERNO", "Teniente de Navío", N],
  ["PTTE", "PTTE", "O2", "OFICIAL_SUBALTERNO", "Primer Teniente", T],
  ["TF", "T/F", "O2", "OFICIAL_SUBALTERNO", "Teniente de Fragata", N],
  ["TTE", "TTE", "O1", "OFICIAL_SUBALTERNO", "Teniente", T],
  ["TC", "T/C", "O1", "OFICIAL_SUBALTERNO", "Teniente de Corbeta", N],
  ["SS", "S/S", "TP7", "TROPA_PROFESIONAL", "Sargento Supervisor", TODOS],
  ["SA", "S/A", "TP6", "TROPA_PROFESIONAL", "Sargento Ayudante", TODOS],
  ["SM1", "SM/1", "TP5", "TROPA_PROFESIONAL", "Sargento Mayor de Primera", TODOS],
  ["SM2", "SM/2", "TP4", "TROPA_PROFESIONAL", "Sargento Mayor de Segunda", TODOS],
  ["SM3", "SM/3", "TP3", "TROPA_PROFESIONAL", "Sargento Mayor de Tercera", TODOS],
  ["S1", "S/1", "TP2", "TROPA_PROFESIONAL", "Sargento Primero", TODOS],
  ["S2", "S/2", "TP1", "TROPA_PROFESIONAL", "Sargento Segundo", TODOS],
  ["S1", "S/1", "TA6", "TROPA_ALISTADA", "Sargento Primero", TODOS],
  ["S2", "S/2", "TA5", "TROPA_ALISTADA", "Sargento Segundo", TODOS],
  [null, "C/1", "TA4", "TROPA_ALISTADA", "Cabo Primero", TODOS],
  [null, "C/2", "TA3", "TROPA_ALISTADA", "Cabo Segundo", TODOS],
];

export const GRADOS: Grado[] = FILAS.map(([arte, abreviatura, nivel, categoria, nombre, aplicaA]) => ({
  clave: `${categoria}:${abreviatura}`,
  abreviatura,
  nivel,
  categoria,
  nombre,
  aplicaA,
  arte,
}));

export const nombreCategoria: Record<Categoria, string> = {
  OFICIAL_GENERAL: "Oficiales generales",
  OFICIAL_SUPERIOR: "Oficiales superiores",
  OFICIAL_SUBALTERNO: "Oficiales subalternos",
  TROPA_PROFESIONAL: "Tropa profesional",
  TROPA_ALISTADA: "Tropa alistada",
};

export function componentePorCodigo(codigo: string | null | undefined) {
  return COMPONENTES.find((c) => c.codigo === codigo) ?? null;
}

export function gradoPorClave(clave: string | null | undefined) {
  return GRADOS.find((g) => g.clave === clave) ?? null;
}

/** Grados que existen en un componente (la Armada ve su denominación naval). */
export function gradosDeComponente(codigo: string | null | undefined): Grado[] {
  if (!codigo || codigo === "MB") return []; // La Milicia no tiene grados sembrados en el catálogo del kit.
  return GRADOS.filter((g) => g.aplicaA.includes(codigo as CodigoComponente));
}

/** Medidas de la insignia a una altura dada, sin deformarla (ancho = alto × proporción del arte). */
export function medidaInsignia(arte: string, alto: number) {
  const m = GRADE_INSIGNIA_SIZES[arte as keyof typeof GRADE_INSIGNIA_SIZES];
  return m ? { width: Math.round((alto * m.width) / m.height), height: alto } : null;
}

/** «CAP. Luis Gómez»: tratamiento con la abreviatura del grado, como se escribe en la FANB. */
export function conGrado(nombre: string, clave: string | null | undefined): string {
  const g = gradoPorClave(clave);
  return g ? `${g.abreviatura}. ${nombre}` : nombre;
}
