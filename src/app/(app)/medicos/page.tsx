import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { idsPorTexto } from "@/lib/busqueda";
import { GradoConArte } from "@/components/Marca";
import { opcionesEspecialidades } from "@/lib/opciones";
import { Busqueda, Encabezado, enlaceConFiltros, Insignia, leerPagina, Paginacion, SinConexion, Vacio } from "@/components/ui";

export const dynamic = "force-dynamic";

const POR_PAGINA = 20;

async function buscar(q: string, especialidadId: string, pagina: number) {
  const where: Prisma.MedicoWhereInput = {
    ...(q && {
      OR: [
        { numeroMpps: { contains: q, mode: "insensitive" } },
        { personalId: { in: await idsPorTexto("personal", ["nombres", "apellidos", "cedula"], q).catch(() => []) } },
      ],
    }),
    ...(especialidadId && { especialidades: { some: { id: especialidadId } } }),
  };
  try {
    const [medicos, total, especialidades] = await Promise.all([
      prisma.medico.findMany({
        where,
        include: { personal: true, especialidades: true },
        orderBy: { personal: { apellidos: "asc" } },
        skip: (pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
      }),
      prisma.medico.count({ where }),
      opcionesEspecialidades(),
    ]);
    return { medicos, total, especialidades };
  } catch {
    return null;
  }
}

export default async function Medicos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; especialidadId?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const especialidadId = params.especialidadId ?? "";
  const pagina = leerPagina(params.pagina);
  const r = await buscar(q, especialidadId, pagina);
  const filtrando = Boolean(q || especialidadId);

  return (
    <>
      <Encabezado caption="Plantilla médica" titulo="Médicos" subtitulo={r && `${r.total} ${r.total === 1 ? "médico" : "médicos"}`}>
        <Link href="/medicos/nuevo" className="boton primario">
          Registrar médico
        </Link>
      </Encabezado>

      <Busqueda q={q} placeholder="Buscar por nombre, cédula o MPPS" limpiar={filtrando ? "/medicos" : undefined}>
        <label htmlFor="especialidadId" className="oculto">
          Especialidad
        </label>
        <select id="especialidadId" name="especialidadId" defaultValue={especialidadId}>
          <option value="">Todas las especialidades</option>
          {r?.especialidades.map((e) => (
            <option key={e.valor} value={e.valor}>
              {e.etiqueta}
            </option>
          ))}
        </select>
      </Busqueda>

      {!r ? (
        <SinConexion que="los médicos" />
      ) : r.medicos.length === 0 ? (
        filtrando ? (
          <Vacio texto="Ningún médico coincide con la búsqueda." accion={{ href: "/medicos", texto: "Ver todos los médicos" }} />
        ) : (
          <Vacio
            texto="Todavía no hay médicos registrados."
            accion={{ href: "/medicos/nuevo", texto: "Registrar el primer médico", primaria: true }}
          />
        )
      ) : (
        <>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Médico</th>
                  <th>MPPS</th>
                  <th>Grado</th>
                  <th>Especialidades</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {r.medicos.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/medicos/${m.id}`}>
                        {m.personal.apellidos}, {m.personal.nombres}
                      </Link>
                    </td>
                    <td>{m.numeroMpps}</td>
                    <td>{m.personal.componente ? <GradoConArte componente={m.personal.componente} grado={m.personal.grado} compacto /> : <span className="suave">Civil</span>}</td>
                    <td>{m.especialidades.map((e) => e.nombre).join(", ") || "—"}</td>
                    <td>{m.personal.telefono ?? "—"}</td>
                    <td>
                      {m.personal.activo ? <Insignia tono="exito">Activo</Insignia> : <Insignia tono="apagado">Inactivo</Insignia>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion
            pagina={pagina}
            paginas={Math.ceil(r.total / POR_PAGINA)}
            enlace={(n) => enlaceConFiltros("/medicos", { q, especialidadId, pagina: String(n) })}
          />
        </>
      )}
    </>
  );
}
