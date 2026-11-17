import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// Búsqueda que no distingue acentos ni mayúsculas: «perez» encuentra «Pérez» y «maria perez»
// encuentra «Pérez, María» (cada palabra debe aparecer en alguno de los campos).
// Usa translate() de PostgreSQL, que existe en cualquier instalación (no requiere la extensión unaccent).

const CON_ACENTO = "áàäâéèëêíìïîóòöôúùüûñç";
const SIN_ACENTO = "aaaaeeeeiiiioooouuuunc";

/** Texto en minúsculas y sin acentos, igual que lo deja la base al comparar. */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

const SOLO_IDENTIFICADOR = /^[A-Za-z][A-Za-z0-9]*$/;

/**
 * Devuelve los id de `modelo` cuyos `campos` contienen todas las palabras de `q`.
 * Los nombres de tabla y columna vienen del código (nunca del usuario) y se validan igual.
 */
export async function idsPorTexto(modelo: string, campos: string[], q: string, limite = 2000): Promise<string[]> {
  const palabras = normalizar(q).split(/\s+/).filter(Boolean).slice(0, 6);
  if (!palabras.length || !campos.length) return [];
  const tabla = modelo.charAt(0).toUpperCase() + modelo.slice(1);
  if (![tabla, ...campos].every((n) => SOLO_IDENTIFICADOR.test(n))) throw new Error("Identificador de búsqueda no válido");

  const texto = Prisma.raw(campos.map((c) => `coalesce("${c}", '')`).join(` || ' ' || `));
  const comparable = Prisma.sql`translate(lower(${texto}), ${CON_ACENTO}, ${SIN_ACENTO})`;
  // Cada palabra se escapa para que %, _ y \ se busquen como texto.
  const condiciones = palabras.map((p) => Prisma.sql`${comparable} LIKE ${`%${p.replace(/[\\%_]/g, "\\$&")}%`}`);

  const filas = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM ${Prisma.raw(`"${tabla}"`)}
    WHERE ${Prisma.join(condiciones, " AND ")}
    LIMIT ${limite}`;
  return filas.map((f) => f.id);
}

/** Atajo: pacientes por nombre, apellido o cédula. */
export const idsPacientes = (q: string) => idsPorTexto("paciente", ["nombres", "apellidos", "cedula"], q);
