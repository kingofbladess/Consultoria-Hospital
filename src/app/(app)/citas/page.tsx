import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { idsPacientes } from "@/lib/busqueda";
import { diaLocal, estadosCita, fechaLarga, hora, inicioDia, nombreCompleto, type EstadoCita } from "@/lib/formato";
import { opcionesMedicos } from "@/lib/opciones";
import { Busqueda, Encabezado, enlaceConFiltros, Insignia, leerPagina, Paginacion, SinConexion, Vacio } from "@/components/ui";

export const dynamic = "force-dynamic";

const POR_PAGINA = 50;
const DIA_MS = 24 * 60 * 60 * 1000;

type Filtros = { q: string; dia: string; estado: string; medicoId: string; pacienteId: string };

async function buscar(f: Filtros, pagina: number) {
  const where: Prisma.CitaWhereInput = {
    // Con un día elegido se muestra ese día; con un paciente, toda su historia; si no, de hoy en adelante.
    ...(f.dia
      ? { fechaHora: { gte: inicioDia(f.dia), lt: new Date(inicioDia(f.dia).getTime() + DIA_MS) } }
      : f.pacienteId
        ? {}
        : { fechaHora: { gte: inicioDia(diaLocal()) } }),
    ...(f.estado && { estado: f.estado as EstadoCita }),
    ...(f.medicoId && { medicoId: f.medicoId }),
    ...(f.pacienteId && { pacienteId: f.pacienteId }),
    ...(f.q && {
      OR: [
        { motivo: { contains: f.q, mode: "insensitive" } },
        { pacienteId: { in: await idsPacientes(f.q).catch(() => []) } },
      ],
    }),
  };
  try {
    const [citas, total, medicos, paciente] = await Promise.all([
      prisma.cita.findMany({
        where,
        include: { paciente: true, medico: { include: { personal: true } }, consultorio: true },
        orderBy: { fechaHora: f.pacienteId && !f.dia ? "desc" : "asc" },
        skip: (pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
      }),
      prisma.cita.count({ where }),
      opcionesMedicos(),
      f.pacienteId ? prisma.paciente.findUnique({ where: { id: f.pacienteId } }) : null,
    ]);
    return { citas, total, medicos, paciente };
  } catch {
    return null;
  }
}

export default async function Citas({ searchParams }: { searchParams: Promise<Partial<Filtros> & { pagina?: string }> }) {
  const params = await searchParams;
  const f: Filtros = {
    q: params.q?.trim() ?? "",
    dia: params.dia ?? "",
    estado: params.estado ?? "",
    medicoId: params.medicoId ?? "",
    pacienteId: params.pacienteId ?? "",
  };
  const pagina = leerPagina(params.pagina);
  const r = await buscar(f, pagina);
  const filtrando = Object.values(f).some(Boolean);
  const hoy = diaLocal();

  // Agrupa las citas por día para mostrarlas como agenda.
  const porDia = new Map<string, NonNullable<typeof r>["citas"]>();
  for (const c of r?.citas ?? []) {
    const dia = diaLocal(c.fechaHora);
    porDia.set(dia, [...(porDia.get(dia) ?? []), c]);
  }

  const titulo = r?.paciente ? `Citas de ${nombreCompleto(r.paciente)}` : "Citas";
  const subtitulo = f.dia
    ? fechaLarga(inicioDia(f.dia))
    : f.pacienteId
      ? "Todas sus citas"
      : "Desde hoy en adelante";

  return (
    <>
      <Encabezado caption="Agenda" titulo={titulo} subtitulo={r && `${subtitulo} · ${r.total} ${r.total === 1 ? "cita" : "citas"}`}>
        <Link href={enlaceConFiltros("/citas", { dia: hoy })} className="boton">
          Ver hoy
        </Link>
        <Link
          href={enlaceConFiltros("/citas/nuevo", { pacienteId: f.pacienteId, medicoId: f.medicoId })}
          className="boton primario"
        >
          Agendar cita
        </Link>
      </Encabezado>

      <Busqueda q={f.q} placeholder="Buscar por paciente o motivo" limpiar={filtrando ? "/citas" : undefined}>
        {f.pacienteId && <input type="hidden" name="pacienteId" value={f.pacienteId} />}
        <label htmlFor="dia" className="oculto">
          Día
        </label>
        <input id="dia" name="dia" type="date" defaultValue={f.dia} />
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
        <label htmlFor="estado" className="oculto">
          Estado
        </label>
        <select id="estado" name="estado" defaultValue={f.estado}>
          <option value="">Todos los estados</option>
          {Object.entries(estadosCita).map(([valor, e]) => (
            <option key={valor} value={valor}>
              {e.etiqueta}
            </option>
          ))}
        </select>
      </Busqueda>

      {!r ? (
        <SinConexion que="las citas" />
      ) : r.citas.length === 0 ? (
        <Vacio
          texto={filtrando ? "No hay citas con esos filtros." : "No hay citas agendadas desde hoy."}
          accion={{ href: enlaceConFiltros("/citas/nuevo", { pacienteId: f.pacienteId }), texto: "Agendar cita", primaria: true }}
        />
      ) : (
        <>
          {[...porDia].map(([dia, citas]) => (
            <section key={dia} className="dia">
              <h2>
                {fechaLarga(citas[0].fechaHora)}
                {dia === hoy && <Insignia tono="info">Hoy</Insignia>}
              </h2>
              <div className="tabla-contenedor">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Paciente</th>
                      <th>Médico</th>
                      <th>Consultorio</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citas.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <Link href={`/citas/${c.id}`}>{hora(c.fechaHora)}</Link>
                        </td>
                        <td>
                          <Link href={`/pacientes/${c.pacienteId}`}>{nombreCompleto(c.paciente)}</Link>
                        </td>
                        <td>{nombreCompleto(c.medico.personal)}</td>
                        <td>{c.consultorio?.nombre ?? "—"}</td>
                        <td>
                          <Insignia tono={estadosCita[c.estado].tono}>{estadosCita[c.estado].etiqueta}</Insignia>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
          <Paginacion
            pagina={pagina}
            paginas={Math.ceil(r.total / POR_PAGINA)}
            enlace={(n) => enlaceConFiltros("/citas", { ...f, pagina: String(n) })}
          />
        </>
      )}
    </>
  );
}
