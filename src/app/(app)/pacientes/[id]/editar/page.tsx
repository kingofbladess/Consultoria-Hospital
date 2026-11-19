import { notFound } from "next/navigation";
import Formulario from "@/components/Formulario";
import { Migas, SinConexion } from "@/components/ui";
import { nombreCompleto } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { camposPaciente, valoresPaciente } from "../../campos";

export const dynamic = "force-dynamic";

export default async function EditarPaciente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paciente = await prisma.paciente.findUnique({ where: { id } }).catch(() => undefined);
  if (paciente === undefined) return <SinConexion que="el paciente" />;
  if (!paciente) notFound();

  const nombre = nombreCompleto(paciente);
  return (
    <>
      <Migas items={[{ href: "/pacientes", texto: "Pacientes" }, { href: `/pacientes/${id}`, texto: nombre }, { texto: "Editar" }]} />
      <h1>Editar datos de {nombre}</h1>
      <Formulario
        secciones={camposPaciente}
        inicial={valoresPaciente(paciente)}
        accion={`/api/pacientes/${id}`}
        metodo="PATCH"
        destino="/pacientes/:id"
        cancelar={`/pacientes/${id}`}
        textoGuardar="Guardar cambios"
        mensajeDuplicado="Ya hay un paciente registrado con esa cédula."
      />
    </>
  );
}
