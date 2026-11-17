import { notFound } from "next/navigation";
import Formulario from "@/components/Formulario";
import { Migas, SinConexion } from "@/components/ui";
import { nombreCompleto } from "@/lib/formato";
import { opcionesEnfermedades } from "@/lib/opciones";
import { prisma } from "@/lib/prisma";
import { camposConsulta, valoresConsulta } from "../../campos";

export const dynamic = "force-dynamic";

export default async function EditarConsulta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datos = await Promise.all([
    prisma.consulta.findUnique({ where: { id }, include: { paciente: true } }),
    opcionesEnfermedades(),
  ]).catch(() => null);
  if (!datos) return <SinConexion que="la consulta" />;
  const [consulta, enfermedades] = datos;
  if (!consulta) notFound();

  return (
    <>
      <Migas items={[{ href: "/consultas", texto: "Consultas" }, { href: `/consultas/${id}`, texto: "Consulta" }, { texto: "Editar" }]} />
      <h1>Editar consulta de {nombreCompleto(consulta.paciente)}</h1>
      <Formulario
        secciones={camposConsulta({ pacientes: [], medicos: [], enfermedades }, true)}
        inicial={valoresConsulta(consulta)}
        accion={`/api/consultas/${id}`}
        metodo="PATCH"
        destino="/consultas/:id"
        cancelar={`/consultas/${id}`}
        textoGuardar="Guardar cambios"
      />
    </>
  );
}
