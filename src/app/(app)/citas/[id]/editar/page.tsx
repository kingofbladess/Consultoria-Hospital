import { notFound } from "next/navigation";
import Formulario from "@/components/Formulario";
import { Migas, SinConexion } from "@/components/ui";
import { opcionesConsultorios, opcionesMedicos, opcionesPacientes } from "@/lib/opciones";
import { prisma } from "@/lib/prisma";
import { camposCita, valoresCita } from "../../campos";

export const dynamic = "force-dynamic";

export default async function EditarCita({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datos = await Promise.all([
    prisma.cita.findUnique({ where: { id } }),
    opcionesPacientes(),
    opcionesMedicos(),
    opcionesConsultorios(),
  ]).catch(() => null);
  if (!datos) return <SinConexion que="la cita" />;
  const [cita, pacientes, medicos, consultorios] = datos;
  if (!cita) notFound();

  return (
    <>
      <Migas items={[{ href: "/citas", texto: "Citas" }, { href: `/citas/${id}`, texto: "Cita" }, { texto: "Editar" }]} />
      <h1>Editar cita</h1>
      <Formulario
        secciones={camposCita({ pacientes, medicos, consultorios }, true)}
        inicial={valoresCita(cita)}
        accion={`/api/citas/${id}`}
        metodo="PATCH"
        destino="/citas/:id"
        cancelar={`/citas/${id}`}
        textoGuardar="Guardar cambios"
      />
    </>
  );
}
