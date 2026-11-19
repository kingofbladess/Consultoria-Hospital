import type { Metadata } from "next";
import Link from "next/link";
import Icono from "@/components/Icono";
import Lente from "@/components/Lente";
import { Insignia, SinConexion } from "@/components/ui";
import { diaLocal, estadosCita, fechaLarga, hora, inicioDia, nombreCompleto } from "@/lib/formato";
import { ACCIONES } from "@/lib/modulos";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesionServidor";
import BuscadorPacientes from "./BuscadorPacientes";

export const metadata: Metadata = { title: "Estación de registro" };
export const dynamic = "force-dynamic";

const DIA_MS = 24 * 60 * 60 * 1000;

type Evento = { id: string; cuando: Date; texto: string; detalle: string; href: string; color: string };

async function cargar() {
  const hoy = inicioDia(diaLocal());
  const manana = new Date(hoy.getTime() + DIA_MS);
  const deHoy = { gte: hoy, lt: manana };
  try {
    const [pacientesHoy, citasHoy, consultasHoy, recetasHoy, agenda, pacientes, citas, recetas, consultas] = await Promise.all([
      prisma.paciente.count({ where: { creadoEn: deHoy } }),
      prisma.cita.count({ where: { fechaHora: deHoy } }),
      prisma.consulta.count({ where: { fecha: deHoy } }),
      prisma.receta.count({ where: { fecha: deHoy } }),
      prisma.cita.findMany({
        where: { fechaHora: deHoy },
        include: { paciente: true, medico: { include: { personal: true } }, consultorio: true },
        orderBy: { fechaHora: "asc" },
        take: 12,
      }),
      prisma.paciente.findMany({ orderBy: { creadoEn: "desc" }, take: 5 }),
      prisma.cita.findMany({ orderBy: { creadoEn: "desc" }, take: 5, include: { paciente: true } }),
      prisma.receta.findMany({ orderBy: { fecha: "desc" }, take: 5, include: { paciente: true } }),
      prisma.consulta.findMany({ orderBy: { fecha: "desc" }, take: 5, include: { paciente: true } }),
    ]);

    // Actividad reciente: los últimos registros de todos los módulos, en una sola línea de tiempo.
    const eventos: Evento[] = [
      ...pacientes.map((p) => ({ id: `p${p.id}`, cuando: p.creadoEn, texto: "Paciente registrado", detalle: nombreCompleto(p), href: `/pacientes/${p.id}`, color: "oliva" })),
      ...citas.map((c) => ({ id: `c${c.id}`, cuando: c.creadoEn, texto: "Cita agendada", detalle: nombreCompleto(c.paciente), href: `/citas/${c.id}`, color: "ciruela" })),
      ...recetas.map((r) => ({ id: `r${r.id}`, cuando: r.fecha, texto: `Récipe N° ${r.numero}`, detalle: nombreCompleto(r.paciente), href: `/recetas/${r.id}`, color: "vino" })),
      ...consultas.map((c) => ({ id: `k${c.id}`, cuando: c.fecha, texto: "Consulta registrada", detalle: nombreCompleto(c.paciente), href: `/consultas/${c.id}`, color: "petroleo" })),
    ]
      .sort((a, b) => b.cuando.getTime() - a.cuando.getTime())
      .slice(0, 8);

    return { contadores: { pacientesHoy, citasHoy, consultasHoy, recetasHoy }, agenda, eventos };
  } catch {
    return null;
  }
}

function hace(fecha: Date): string {
  const minutos = Math.round((Date.now() - fecha.getTime()) / 60000);
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "ayer" : `hace ${dias} días`;
}

function saludo(): string {
  const h = Number(new Date().toLocaleString("en-US", { timeZone: "America/Caracas", hour: "numeric", hour12: false }));
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export default async function EstacionRegistro() {
  const [sesion, datos] = await Promise.all([sesionActual(), cargar()]);
  const nombre = sesion?.nombre.split(" ")[0] ?? "";

  const indicadores = datos && [
    { etiqueta: "Pacientes registrados hoy", valor: datos.contadores.pacientesHoy, icono: "pacientes" as const, color: "oliva" },
    { etiqueta: "Citas para hoy", valor: datos.contadores.citasHoy, icono: "citas" as const, color: "ciruela" },
    { etiqueta: "Consultas de hoy", valor: datos.contadores.consultasHoy, icono: "consultas" as const, color: "petroleo" },
    { etiqueta: "Récipes emitidos hoy", valor: datos.contadores.recetasHoy, icono: "recetas" as const, color: "vino" },
  ];

  return (
    <div className="estacion">
      <Lente color="naval">
      <header className="estacion-encabezado">
        <div>
          <p className="text-caption caption-pagina">Estación de registro</p>
          <h1>
            {saludo()}
            {nombre && `, ${nombre}`}
          </h1>
          <p className="suave">{fechaLarga(new Date())}</p>
        </div>
        <p className="ayuda-teclado">
          <Icono nombre="teclado" tamano={18} />
          <span>
            <kbd>/</kbd> buscar · <kbd>Ctrl K</kbd> ir a cualquier parte · <kbd>Alt 1–6</kbd> acciones
          </span>
        </p>
      </header>
      </Lente>

      <BuscadorPacientes />

      <section aria-labelledby="titulo-acciones">
        <h2 id="titulo-acciones" className="text-caption titulo-seccion">
          Registrar
        </h2>
        <div className="acciones-rapidas">
          {ACCIONES.map((a) => (
            <Link key={a.ruta} href={a.ruta} className="glass-panel tarjeta-accion" data-color={a.color}>
              <span className="kpi-icono">
                <Icono nombre={a.icono} tamano={18} />
              </span>
              <span className="tarjeta-accion-texto">{a.nombre}</span>
              <kbd>Alt {a.tecla}</kbd>
            </Link>
          ))}
        </div>
      </section>

      {!datos ? (
        <SinConexion />
      ) : (
        <>
          <section className="kpis" aria-label="Resumen de hoy">
            {indicadores!.map((x) => (
              <div key={x.etiqueta} className="glass-panel kpi" data-color={x.color}>
                <span className="kpi-icono">
                  <Icono nombre={x.icono} tamano={18} />
                </span>
                <span className="text-caption">Hoy</span>
                <span className="kpi-cifra">{x.valor.toLocaleString("es-VE")}</span>
                <span className="kpi-detalle">{x.etiqueta}</span>
              </div>
            ))}
          </section>

          <div className="columnas-estacion">
            <section className="glass-panel panel">
              <div className="panel-titulo">
                <h2>Agenda de hoy</h2>
                <Link href={`/citas?dia=${diaLocal()}`} className="enlace-flecha">
                  Ver agenda <Icono nombre="flecha" />
                </Link>
              </div>
              {datos.agenda.length === 0 ? (
                <div className="vacio-compacto">
                  <p className="suave">No hay citas para hoy.</p>
                  <Link href="/citas/nuevo" className="boton chico">
                    <Icono nombre="calendarioMas" tamano={16} /> Agendar cita
                  </Link>
                </div>
              ) : (
                <ol className="linea-agenda">
                  {datos.agenda.map((c) => (
                    <li key={c.id}>
                      <span className="agenda-hora cifra">{hora(c.fechaHora)}</span>
                      <Link href={`/citas/${c.id}`} className="agenda-detalle">
                        <strong>{nombreCompleto(c.paciente)}</strong>
                        <small>
                          {nombreCompleto(c.medico.personal)}
                          {c.consultorio && ` · ${c.consultorio.nombre}`}
                        </small>
                      </Link>
                      <Insignia tono={estadosCita[c.estado].tono}>{estadosCita[c.estado].etiqueta}</Insignia>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="glass-panel panel">
              <div className="panel-titulo">
                <h2>Actividad reciente</h2>
              </div>
              {datos.eventos.length === 0 ? (
                <p className="suave">Todavía no hay registros. Empiece por buscar o registrar un paciente.</p>
              ) : (
                <ol className="actividad">
                  {datos.eventos.map((e) => (
                    <li key={e.id} data-color={e.color}>
                      <span className="actividad-punto" aria-hidden="true" />
                      <Link href={e.href}>
                        <strong>{e.texto}</strong>
                        <small>{e.detalle}</small>
                      </Link>
                      <time dateTime={e.cuando.toISOString()} className="suave">
                        {hace(e.cuando)}
                      </time>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
