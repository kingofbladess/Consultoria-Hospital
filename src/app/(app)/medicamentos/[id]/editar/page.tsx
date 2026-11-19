import { notFound } from "next/navigation";
import Formulario from "@/components/Formulario";
import { Migas, SinConexion } from "@/components/ui";
import { opcionesEnfermedades } from "@/lib/opciones";
import { prisma } from "@/lib/prisma";
import { camposMedicamento, valoresMedicamento } from "../../campos";

export const dynamic = "force-dynamic";

export default async function EditarMedicamento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datos = await Promise.all([
    prisma.medicamento.findUnique({ where: { id }, include: { enfermedades: true } }),
    opcionesEnfermedades(),
  ]).catch(() => null);
  if (!datos) return <SinConexion que="el medicamento" />;
  const [medicamento, enfermedades] = datos;
  if (!medicamento) notFound();

  const nombre = `${medicamento.principioActivo} ${medicamento.concentracion ?? ""}`.trim();
  return (
    <>
      <Migas
        items={[{ href: "/medicamentos", texto: "Medicamentos" }, { href: `/medicamentos/${id}`, texto: nombre }, { texto: "Editar" }]}
      />
      <h1>Editar {nombre}</h1>
      <Formulario
        secciones={camposMedicamento(enfermedades)}
        inicial={valoresMedicamento(medicamento)}
        accion={`/api/medicamentos/${id}`}
        metodo="PATCH"
        destino="/medicamentos/:id"
        cancelar={`/medicamentos/${id}`}
        textoGuardar="Guardar cambios"
      />
    </>
  );
}
