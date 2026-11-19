/* eslint-disable @next/next/no-img-element */
import { componentePorCodigo } from "@/lib/marca/grados";

// «Lente» del kit: un arte institucional grande pintado como HERMANO detrás de un vidrio profundo
// (.glass-deep), que lo refracta. Es adorno: no lleva información exclusiva ni interacción.

export default function Lente({
  componente,
  color,
  children,
}: {
  /** Código de componente de la FANB; sin componente se usa el emblema del MPPD. */
  componente?: string | null;
  color?: string;
  children: React.ReactNode;
}) {
  const c = componentePorCodigo(componente);
  const arte = c?.slug ? `/marca/componentes/escudos/${c.slug}.avif` : "/icons/mppd.avif";
  return (
    <section className="lente" data-color={color}>
      <img src={arte} alt="" aria-hidden="true" className="lente-arte" />
      <div className="glass-panel glass-deep lente-vidrio">{children}</div>
    </section>
  );
}
