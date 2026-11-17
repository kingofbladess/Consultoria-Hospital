import Formulario from "@/components/Formulario";
import { Migas, SinConexion } from "@/components/ui";
import { opcionesEnfermedades } from "@/lib/opciones";
import { camposMedicamento } from "../campos";

export const dynamic = "force-dynamic";

export default async function NuevoMedicamento() {
  const enfermedades = await opcionesEnfermedades().catch(() => null);
  return (
    <>
      <Migas items={[{ href: "/medicamentos", texto: "Medicamentos" }, { texto: "Agregar" }]} />
      <h1>Agregar medicamento</h1>
      {!enfermedades ? (
        <SinConexion que="las enfermedades" />
      ) : (
        <Formulario
          secciones={camposMedicamento(enfermedades)}
          inicial={{ via: "ORAL" }}
          accion="/api/medicamentos"
          metodo="POST"
          destino="/medicamentos/:id"
          cancelar="/medicamentos"
          textoGuardar="Agregar medicamento"
        />
      )}
    </>
  );
}
