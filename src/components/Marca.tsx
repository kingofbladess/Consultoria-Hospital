// Artes institucionales del MPPD y de la FANB. No se recolorean, recortan ni estiran (BRANDING.md).
/* eslint-disable @next/next/no-img-element */

import { componentePorCodigo, gradoPorClave, medidaInsignia } from "@/lib/marca/grados";

/** Emblema del MPPD. 28 px en la barra; 72 px en el ingreso. */
export function EmblemaMppd({ tamano = 28, decorativo = true }: { tamano?: 28 | 72; decorativo?: boolean }) {
  const ancho = Math.round((tamano * 432) / 577);
  return (
    <img
      src={tamano === 72 ? "/icons/mppd-72.avif" : "/icons/mppd-28.avif"}
      width={ancho}
      height={tamano}
      alt={decorativo ? "" : "Ministerio del Poder Popular para la Defensa"}
      aria-hidden={decorativo || undefined}
      className="emblema"
    />
  );
}

/** Escudo de componente a 20 o 32 px de alto. Junto al nombre es decorativo. */
export function EscudoComponente({ codigo, alto = 32, decorativo = true }: { codigo: string | null | undefined; alto?: 20 | 32; decorativo?: boolean }) {
  const c = componentePorCodigo(codigo);
  if (!c?.slug) return null; // Milicia o desconocido: sin arte, solo texto.
  return (
    <img
      src={`/marca/componentes/escudos/${c.slug}-32.avif`}
      height={alto}
      style={{ height: alto, width: "auto" }}
      alt={decorativo ? "" : c.nombre}
      aria-hidden={decorativo || undefined}
      className="escudo"
    />
  );
}

/** Insignia de grado a una altura fija (máximo 36 px), con su proporción real. */
export function InsigniaGrado({ clave, alto = 20, decorativo = true }: { clave: string | null | undefined; alto?: number; decorativo?: boolean }) {
  const g = gradoPorClave(clave);
  if (!g?.arte) return null; // Sin arte propio: no se pinta nada.
  const medida = medidaInsignia(g.arte, Math.min(alto, 36));
  if (!medida) return null;
  return (
    <img
      src={`/marca/grados/${g.arte}.webp`}
      width={medida.width}
      height={medida.height}
      alt={decorativo ? "" : g.nombre}
      aria-hidden={decorativo || undefined}
      className="insignia-grado"
    />
  );
}

/** Grado con su arte: escudo + insignia + texto. El texto siempre se escribe. */
export function GradoConArte({ componente, grado, compacto = false }: { componente: string | null | undefined; grado: string | null | undefined; compacto?: boolean }) {
  const c = componentePorCodigo(componente);
  const g = gradoPorClave(grado);
  if (!c && !g) return null;
  return (
    <span className={`grado-con-arte ${compacto ? "compacto" : ""}`}>
      <EscudoComponente codigo={c?.codigo} alto={compacto ? 20 : 32} />
      <span className="grado-texto">
        {g && (
          <span className="grado-nombre">
            <InsigniaGrado clave={g.clave} alto={compacto ? 14 : 18} />
            {g.nombre}
          </span>
        )}
        {c && <span className="grado-componente">{c.nombre}</span>}
      </span>
    </span>
  );
}
