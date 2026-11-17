import Formulario, { type Valores } from "@/components/Formulario";
import { Migas, SinConexion, Vacio } from "@/components/ui";
import { fechaHoraInput } from "@/lib/formato";
import { opcionesEnfermedades, opcionesMedicos, opcionesPacientes } from "@/lib/opciones";
import { prisma } from "@/lib/prisma";
import { camposConsulta } from "../campos";

export const dynamic = "force-dynamic";

export default async function NuevaConsulta({
  searchParams,
}: {
  searchParams: Promise<{ pacienteId?: string; citaId?: string }>;
}) {
  const { pacienteId = "", citaId = "" } = await searchParams;
  const datos = await Promise.all([
    opcionesPacientes(),
    opcionesMedicos(),
    opcionesEnfermedades(),
    citaId ? prisma.cita.findUnique({ where: { id: citaId } }) : null,
  ]).catch(() => null);

  if (!datos) {
    return (
      <>
        <h1>Registrar consulta</h1>
        <SinConexion que="los pacientes y médicos" />
      </>
    );
  }
  const [pacientes, medicos, enfermedades, cita] = datos;

  // Si viene de una cita, se precargan el paciente, el médico y el motivo.
  const inicial: Valores = cita
    ? { pacienteId: cita.pacienteId, medicoId: cita.medicoId, citaId: cita.id, motivo: cita.motivo ?? "" }
    : { pacienteId };

  return (
    <>
      <Migas items={[{ href: "/consultas", texto: "Consultas" }, { texto: "Registrar" }]} />
      <h1>Registrar consulta</h1>
      {pacientes.length === 0 || medicos.length === 0 ? (
        <Vacio
          texto="Para registrar una consulta necesita al menos un paciente y un médico activo."
          accion={
            pacientes.length === 0
              ? { href: "/pacientes/nuevo", texto: "Registrar paciente", primaria: true }
              : { href: "/medicos/nuevo", texto: "Registrar médico", primaria: true }
          }
        />
      ) : (
        <Formulario
          secciones={camposConsulta({ pacientes, medicos, enfermedades })}
          inicial={{ ...inicial, fecha: fechaHoraInput(new Date()) }}
          accion="/api/consultas"
          metodo="POST"
          destino="/consultas/:id"
          cancelar={cita ? `/citas/${cita.id}` : "/consultas"}
          textoGuardar="Registrar consulta"
          mensajeDuplicado="Esa cita ya tiene una consulta registrada."
        />
      )}
    </>
  );
}
