import Link from "next/link";
import { Migas, SinConexion, Vacio } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesionServidor";
import { cargarOpcionesReceta, itemsAFormulario } from "../datos";
import FormularioReceta, { type InicialReceta } from "../FormularioReceta";

export const dynamic = "force-dynamic";

type Params = { pacienteId?: string; medicoId?: string; consultaId?: string; enfermedadId?: string; plantillaId?: string; desde?: string };

/** Valores con los que arranca el formulario según desde dónde se llegó. */
async function valoresIniciales(p: Params): Promise<InicialReceta> {
  const inicial: InicialReceta = {
    pacienteId: p.pacienteId ?? "",
    medicoId: p.medicoId ?? (await sesionActual())?.medicoId ?? "",
    consultaId: "",
    enfermedadId: p.enfermedadId ?? "",
    indicacionesGenerales: "",
    items: [],
  };
  const incluirItems = { items: { include: { medicamento: true }, orderBy: { orden: "asc" as const } } };

  if (p.consultaId) {
    // Desde una consulta: mismo paciente, médico y diagnóstico. Con el diagnóstico se aplica el protocolo.
    const c = await prisma.consulta.findUnique({ where: { id: p.consultaId } });
    if (c)
      Object.assign(inicial, {
        pacienteId: c.pacienteId,
        medicoId: c.medicoId,
        consultaId: c.id,
        enfermedadId: c.enfermedadId ?? "",
        indicacionesGenerales: c.plan ?? "",
      });
  }
  if (p.desde) {
    // Repetir un récipe anterior: mismo paciente, médico y medicamentos.
    const r = await prisma.receta.findUnique({ where: { id: p.desde }, include: incluirItems });
    if (r)
      Object.assign(inicial, {
        pacienteId: r.pacienteId,
        medicoId: r.medicoId,
        enfermedadId: r.enfermedadId ?? "",
        indicacionesGenerales: r.indicacionesGenerales ?? "",
        items: itemsAFormulario(r.items),
      });
  }
  if (p.plantillaId) {
    const t = await prisma.plantillaReceta.findUnique({ where: { id: p.plantillaId }, include: incluirItems });
    if (t)
      Object.assign(inicial, {
        medicoId: t.medicoId,
        indicacionesGenerales: t.indicacionesGenerales ?? "",
        items: itemsAFormulario(t.items),
      });
  }
  return inicial;
}

export default async function NuevaReceta({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const datos = await Promise.all([cargarOpcionesReceta(), valoresIniciales(params)]).catch(() => null);

  return (
    <>
      <Migas items={[{ href: "/recetas", texto: "Récipes" }, { texto: "Crear" }]} />
      <h1>Crear récipe</h1>
      {!datos ? (
        <SinConexion que="los pacientes y médicos" />
      ) : datos[0].medicos.length === 0 ? (
        <Vacio
          texto="Primero registre al médico con su MPPS, firma y sello. Se cargan una sola vez y salen en cada récipe."
          accion={{ href: "/medicos/nuevo", texto: "Registrar médico", primaria: true }}
        />
      ) : datos[0].pacientes.length === 0 ? (
        <Vacio texto="Primero registre al paciente." accion={{ href: "/pacientes/nuevo", texto: "Registrar paciente", primaria: true }} />
      ) : (
        <>
          <p className="suave">
            Elija el paciente y el diagnóstico: el récipe se llena con el protocolo según la edad. Revise y emita.{" "}
            <Link href="/recetas/protocolos">Ver protocolos</Link>
          </p>
          <FormularioReceta {...datos[0]} inicial={datos[1]} />
        </>
      )}
    </>
  );
}
