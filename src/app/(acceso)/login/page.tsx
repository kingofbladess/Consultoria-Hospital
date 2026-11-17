import type { Metadata } from "next";
import { EmblemaMppd } from "@/components/Marca";
import FormularioIngreso from "./FormularioIngreso";

export const metadata: Metadata = { title: "Ingresar" };

// Ingreso según el kit de marca: el panel izquierdo es el único lienzo oscuro de la aplicación,
// con el emblema a 72 px en un círculo y la retícula al 6 %. El formulario va sobre el crema.
export default async function Ingresar({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { siguiente } = await searchParams;
  // Solo se acepta volver a una ruta interna, nunca a otro sitio.
  const destino = siguiente?.startsWith("/") && !siguiente.startsWith("//") ? siguiente : undefined;

  return (
    <div className="acceso">
      <section className="acceso-marca-panel">
        <div className="signin-grid-pattern acceso-reticula" aria-hidden="true" />
        <div className="acceso-identidad">
          <span className="acceso-emblema">
            <EmblemaMppd tamano={72} decorativo={false} />
          </span>
          <p className="text-caption">Gestión Hospitalaria · MPPD</p>
          <h1>Consultoría Hospital</h1>
          <p className="acceso-descripcion">
            Pacientes, consultas, récipes y agenda del centro de salud, en una sola consola.
          </p>
        </div>
        <p className="acceso-pie">Ministerio del Poder Popular para la Defensa · Venezuela</p>
      </section>

      <section className="acceso-formulario">
        <div className="glass-panel glass-strong acceso-tarjeta">
          <p className="text-caption suave">Acceso al sistema</p>
          <h2>Ingresar</h2>
          <p className="suave">Use el usuario y la contraseña que le asignó administración.</p>
          <FormularioIngreso destino={destino} />
        </div>
        <p className="acceso-aviso">Acceso solo para personal autorizado.</p>
      </section>
    </div>
  );
}
