import Formulario from "@/components/Formulario";
import { Migas, SinConexion } from "@/components/ui";
import { opcionesEspecialidades } from "@/lib/opciones";
import { camposMedico, MENSAJE_DUPLICADO } from "../campos";

export const dynamic = "force-dynamic";

export default async function NuevoMedico() {
  const especialidades = await opcionesEspecialidades().catch(() => null);
  return (
    <>
      <Migas items={[{ href: "/medicos", texto: "Médicos" }, { texto: "Registrar" }]} />
      <h1>Registrar médico</h1>
      {!especialidades ? (
        <SinConexion que="las especialidades" />
      ) : (
        <Formulario
          secciones={camposMedico(especialidades)}
          accion="/api/medicos"
          metodo="POST"
          destino="/medicos/:id"
          cancelar="/medicos"
          textoGuardar="Registrar médico"
          mensajeDuplicado={MENSAJE_DUPLICADO}
        />
      )}
    </>
  );
}
