import Link from "next/link";
import { notFound } from "next/navigation";
import BotonEliminar from "@/components/BotonEliminar";
import { Dato, Encabezado, Insignia, Migas, SinConexion } from "@/components/ui";
import { nombreVia } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FichaMedicamento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const medicamento = await prisma.medicamento
    .findUnique({
      where: { id },
      include: { enfermedades: { orderBy: { codigoCie10: "asc" } }, _count: { select: { recetaItems: true } } },
    })
    .catch(() => undefined);
  if (medicamento === undefined) return <SinConexion que="el medicamento" />;
  if (!medicamento) notFound();

  const nombre = `${medicamento.principioActivo} ${medicamento.concentracion ?? ""}`.trim();
  const usos = medicamento._count.recetaItems;

  return (
    <>
      <Migas items={[{ href: "/medicamentos", texto: "Medicamentos" }, { texto: nombre }]} />
      <Encabezado titulo={nombre} subtitulo={[medicamento.nombreComercial, medicamento.presentacion].filter(Boolean).join(" · ")}>
        <Link href={`/medicamentos/${id}/editar`} className="boton primario">
          Editar medicamento
        </Link>
        <BotonEliminar
          accion={`/api/medicamentos/${id}`}
          nombre={nombre}
          volverA="/medicamentos"
          bloqueado={usos > 0 ? `No se puede eliminar: aparece en ${usos} ${usos === 1 ? "récipe" : "récipes"}.` : undefined}
        />
      </Encabezado>

      {medicamento.requiereRecipeEspecial && (
        <p className="aviso alerta">Este medicamento es psicotrópico o estupefaciente y requiere récipe especial.</p>
      )}

      <div className="paneles">
        <section className="panel">
          <h2>Ficha</h2>
          <dl>
            <Dato etiqueta="Principio activo" valor={medicamento.principioActivo} />
            <Dato etiqueta="Nombre comercial" valor={medicamento.nombreComercial} />
            <Dato etiqueta="Presentación" valor={medicamento.presentacion} />
            <Dato etiqueta="Concentración" valor={medicamento.concentracion} />
            <Dato etiqueta="Vía" valor={nombreVia[medicamento.via]} />
            <Dato etiqueta="Laboratorio" valor={medicamento.laboratorio} />
          </dl>
        </section>
        <section className="panel">
          <h2>Enfermedades que trata</h2>
          {medicamento.enfermedades.length === 0 ? (
            <p className="suave">No tiene enfermedades asociadas.</p>
          ) : (
            <ul className="lista">
              {medicamento.enfermedades.map((e) => (
                <li key={e.id}>
                  <Insignia>{e.codigoCie10}</Insignia> {e.nombre}
                </li>
              ))}
            </ul>
          )}
          <dl>
            <Dato etiqueta="Origen del registro" valor={medicamento.fuente === "local" ? "Cargado a mano" : medicamento.fuente} />
          </dl>
        </section>
      </div>
    </>
  );
}
