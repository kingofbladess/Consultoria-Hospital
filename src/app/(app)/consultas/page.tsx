import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { idsPacientes, idsPorTexto } from "@/lib/busqueda";
import { fechaHora, nombreCompleto } from "@/lib/formato";
import { opcionesMedicos } from "@/lib/opciones";
import { Busqueda, Encabezado, enlaceConFiltros, leerPagina, Paginacion, SinConexion, Vacio } from "@/components/ui";

export const dynamic = "force-dynamic";

const POR_PAGINA = 20;

type Filtros = { q: string; medicoId: string; pacienteId: string };

async function buscar(f: Filtros, pagina: number) {
  const where: Prisma.ConsultaWhereInput = {
    ...(f.medicoId && { medicoId: f.medicoId }),
    ...(f.pacienteId && { pacienteId: f.pacienteId }),
    ...(f.q && {
      OR: [
        { motivo: { contains: f.q, mode: "insensitive" } },
        { diagnostico: { contains: f.q, mode: "insensitive" } },
        { enfermedadId: { in: await idsPorTexto("enfermedad", ["codigoCie10", "nombre"], f.q).catch(() => []) } },
        { enfermedad: { codigoCie10: { contains: f.q, mode: "insensitive" } } },
        { pacienteId: { in: await idsPacientes(f.q).catch(() => []) } },
      ],
    }),
  };
  try {
    const [consultas, total, medicos, paciente] = await Promise.all([
      prisma.consulta.findMany({
        where,
        include: { paciente: true, medico: { include: { personal: true } }, enfermedad: true },
        orderBy: { fecha: "desc" },
        skip: (pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
      }),
      prisma.consulta.count({ where }),
      opcionesMedicos(),
      f.pacienteId ? prisma.paciente.findUnique({ where: { id: f.pacienteId } }) : null,
    ]);
    return { consultas, total, medicos, paciente };
  } catch {
    return null;
  }
}

export default async function Consultas({ searchParams }: { searchParams: Promise<Partial<Filtros> & { pagina?: string }> }) {
  const params = await searchParams;
  const f: Filtros = { q: params.q?.trim() ?? "", medicoId: params.medicoId ?? "", pacienteId: params.pacienteId ?? "" };
  const pagina = leerPagina(params.pagina);
  const r = await buscar(f, pagina);
  const filtrando = Object.values(f).some(Boolean);

  return (
    <>
      <Encabezado caption="Historia clínica"
        titulo={r?.paciente ? `Historia clínica de ${nombreCompleto(r.paciente)}` : "Consultas"}
        subtitulo={r && `${r.total} ${r.total === 1 ? "consulta" : "consultas"}`}
      >
        <Link href={enlaceConFiltros("/consultas/nuevo", { pacienteId: f.pacienteId })} className="boton primario">
          Registrar consulta
        </Link>
      </Encabezado>

      <Busqueda q={f.q} placeholder="Buscar por paciente, motivo o diagnóstico" limpiar={filtrando ? "/consultas" : undefined}>
        {f.pacienteId && <input type="hidden" name="pacienteId" value={f.pacienteId} />}
        <label htmlFor="medicoId" className="oculto">
          Médico
        </label>
        <select id="medicoId" name="medicoId" defaultValue={f.medicoId}>
          <option value="">Todos los médicos</option>
          {r?.medicos.map((m) => (
            <option key={m.valor} value={m.valor}>
              {m.etiqueta}
            </option>
          ))}
        </select>
      </Busqueda>

      {!r ? (
        <SinConexion que="las consultas" />
      ) : r.consultas.length === 0 ? (
        <Vacio
          texto={filtrando ? "No hay consultas que coincidan con la búsqueda." : "Todavía no hay consultas registradas."}
          accion={{ href: enlaceConFiltros("/consultas/nuevo", { pacienteId: f.pacienteId }), texto: "Registrar consulta", primaria: true }}
        />
      ) : (
        <>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Paciente</th>
                  <th>Médico</th>
                  <th>Motivo</th>
                  <th>Diagnóstico</th>
                </tr>
              </thead>
              <tbody>
                {r.consultas.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/consultas/${c.id}`}>{fechaHora(c.fecha)}</Link>
                    </td>
                    <td>
                      <Link href={`/pacientes/${c.pacienteId}`}>{nombreCompleto(c.paciente)}</Link>
                    </td>
                    <td>{nombreCompleto(c.medico.personal)}</td>
                    <td className="recorte">{c.motivo}</td>
                    <td className="recorte">
                      {c.enfermedad ? `${c.enfermedad.codigoCie10} · ${c.enfermedad.nombre}` : (c.diagnostico ?? "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion
            pagina={pagina}
            paginas={Math.ceil(r.total / POR_PAGINA)}
            enlace={(n) => enlaceConFiltros("/consultas", { ...f, pagina: String(n) })}
          />
        </>
      )}
    </>
  );
}
