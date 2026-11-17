import { notFound } from "next/navigation";
import Formulario from "@/components/Formulario";
import { Migas, SinConexion } from "@/components/ui";
import { nombreCompleto } from "@/lib/formato";
import { opcionesEspecialidades } from "@/lib/opciones";
import { prisma } from "@/lib/prisma";
import { camposMedico, MENSAJE_DUPLICADO, valoresMedico } from "../../campos";

export const dynamic = "force-dynamic";

export default async function EditarMedico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datos = await Promise.all([
    prisma.medico.findUnique({ where: { id }, include: { personal: true, especialidades: true } }),
    opcionesEspecialidades(),
  ]).catch(() => null);
  if (!datos) return <SinConexion que="el médico" />;
  const [medico, especialidades] = datos;
  if (!medico) notFound();

  const nombre = nombreCompleto(medico.personal);
  return (
    <>
      <Migas items={[{ href: "/medicos", texto: "Médicos" }, { href: `/medicos/${id}`, texto: nombre }, { texto: "Editar" }]} />
      <h1>Editar datos de {nombre}</h1>
      <Formulario
        secciones={camposMedico(especialidades, true)}
        inicial={valoresMedico(medico)}
        accion={`/api/medicos/${id}`}
        metodo="PATCH"
        destino="/medicos/:id"
        cancelar={`/medicos/${id}`}
        textoGuardar="Guardar cambios"
        mensajeDuplicado={MENSAJE_DUPLICADO}
      />
    </>
  );
}
