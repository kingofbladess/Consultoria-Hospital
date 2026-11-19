import type { Metadata } from "next";
import { EmblemaMppd } from "@/components/Marca";
import Icono from "@/components/Icono";
import FormularioIngreso from "./FormularioIngreso";

export const metadata: Metadata = { title: "Ingresar" };

export default async function Ingresar({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { siguiente } = await searchParams;
  // Solo se acepta volver a una ruta interna, nunca a otro sitio.
  const destino = siguiente?.startsWith("/") && !siguiente.startsWith("//") ? siguiente : undefined;

  return (
    <main className="acceso">
      <section className="acceso-marca-panel" aria-labelledby="titulo-hospital">
        <div className="signin-grid-pattern acceso-reticula" aria-hidden="true" />
        <div className="acceso-marca">
          <span className="acceso-emblema"><EmblemaMppd tamano={72} /></span>
          <span>Ministerio del Poder Popular<br />para la Defensa</span>
        </div>
        <div className="acceso-identidad">
          <p className="text-caption">Gestión hospitalaria</p>
          <h1 id="titulo-hospital">Consultoría<br className="acceso-salto" /> Hospital</h1>
          <p className="acceso-descripcion">
            Pacientes, consultas, récipes y agenda del centro de salud, en una sola consola.
          </p>
        </div>
      </section>

      <section className="acceso-formulario">
        <div className="acceso-tarjeta">
          <h2>Iniciar sesión</h2>
          <p className="suave">Use el usuario y la contraseña que le asignó administración.</p>
          <FormularioIngreso destino={destino} />
        </div>
        <p className="acceso-aviso"><Icono nombre="candado" tamano={14} /> Acceso solo para personal autorizado.</p>
      </section>
    </main>
  );
}
