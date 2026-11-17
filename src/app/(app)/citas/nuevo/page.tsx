import Link from "next/link";
import Formulario from "@/components/Formulario";
import { Migas, SinConexion, Vacio } from "@/components/ui";
import { opcionesConsultorios, opcionesMedicos, opcionesPacientes } from "@/lib/opciones";
import { camposCita } from "../campos";

export const dynamic = "force-dynamic";

export default async function NuevaCita({
  searchParams,
}: {
  searchParams: Promise<{ pacienteId?: string; medicoId?: string }>;
}) {
  const { pacienteId = "", medicoId = "" } = await searchParams;
  const opciones = await Promise.all([opcionesPacientes(), opcionesMedicos(), opcionesConsultorios()])
    .then(([pacientes, medicos, consultorios]) => ({ pacientes, medicos, consultorios }))
    .catch(() => null);

  return (
    <>
      <Migas items={[{ href: "/citas", texto: "Citas" }, { texto: "Agendar" }]} />
      <h1>Agendar cita</h1>
      {!opciones ? (
        <SinConexion que="los pacientes y médicos" />
      ) : opciones.pacientes.length === 0 ? (
        <Vacio
          texto="Para agendar una cita primero debe registrar al paciente."
          accion={{ href: "/pacientes/nuevo", texto: "Registrar paciente", primaria: true }}
        />
      ) : opciones.medicos.length === 0 ? (
        <Vacio
          texto="Para agendar una cita primero debe registrar al menos un médico activo."
          accion={{ href: "/medicos/nuevo", texto: "Registrar médico", primaria: true }}
        />
      ) : (
        <>
          <p className="suave">
            ¿El paciente no aparece? <Link href="/pacientes/nuevo">Regístrelo primero</Link>.
          </p>
          <Formulario
            secciones={camposCita(opciones)}
            inicial={{ pacienteId, medicoId }}
            accion="/api/citas"
            metodo="POST"
            destino="/citas/:id"
            cancelar="/citas"
            textoGuardar="Agendar cita"
          />
        </>
      )}
    </>
  );
}
