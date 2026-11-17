import Link from "next/link";
import Icono from "@/components/Icono";
import Lente from "@/components/Lente";
import { Insignia, SinConexion } from "@/components/ui";
import { diaLocal, estadosCita, fechaDia, hora, inicioDia, nombreCompleto } from "@/lib/formato";
import { MODULOS } from "@/lib/modulos";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DIA_MS = 24 * 60 * 60 * 1000;

const descripciones: Record<string, string> = {
  "/pacientes": "Registrados",
  "/medicos": "En plantilla",
  "/consultas": "En la historia clínica",
  "/recetas": "Emitidos",
  "/medicamentos": "En el vademécum",
  "/citas": "Pendientes desde hoy",
};

async function cargar() {
  const hoy = inicioDia(diaLocal());
  const manana = new Date(hoy.getTime() + DIA_MS);
  try {
    const [pacientes, medicos, consultas, recetas, medicamentos, citas, citasHoy, ultimas, perfil] = await Promise.all([
      prisma.paciente.count(),
      prisma.medico.count(),
      prisma.consulta.count(),
      prisma.receta.count(),
      prisma.medicamento.count(),
      prisma.cita.count({ where: { fechaHora: { gte: hoy }, estado: { in: ["PENDIENTE", "CONFIRMADA"] } } }),
      prisma.cita.findMany({
        where: { fechaHora: { gte: hoy, lt: manana } },
        include: { paciente: true, medico: { include: { personal: true } } },
        orderBy: { fechaHora: "asc" },
        take: 10,
      }),
      prisma.receta.findMany({ include: { paciente: true }, orderBy: { numero: "desc" }, take: 5 }),
      // Médicos activos a los que les falta la firma o el sello para el récipe.
      prisma.medico.findMany({
        where: { personal: { activo: true }, OR: [{ firmaUrl: null }, { selloUrl: null }] },
        include: { personal: true },
        take: 5,
      }),
    ]);
    return { totales: [pacientes, medicos, consultas, recetas, medicamentos, citas], citasHoy, ultimas, perfil };
  } catch {
    return null;
  }
}

export default async function Inicio() {
  const datos = await cargar();

  return (
    <>
      <Lente>
        <div className="encabezado">
          <div>
            <p className="text-caption caption-pagina">Consola · Gestión Hospitalaria</p>
            <h1>Panel principal</h1>
            <p className="suave">Actividad del centro de salud y accesos a cada módulo.</p>
          </div>
          <div className="acciones">
            <Link href="/registro" className="boton">
              <Icono nombre="registro" />
              Estación de registro
            </Link>
            <Link href="/recetas/nuevo" className="boton primario">
              <Icono nombre="recetas" />
              Crear récipe
            </Link>
          </div>
        </div>
      </Lente>

      {!datos && <SinConexion />}

      {datos && datos.perfil.length > 0 && (
        <div className="glass-panel glass-tone-warning aviso-vidrio">
          <span className="text-caption">Atención</span>
          <p>
            {datos.perfil.length === 1 ? "Este médico no tiene" : "Estos médicos no tienen"} la firma o el sello para el récipe:{" "}
            {datos.perfil.map((m, i) => (
              <span key={m.id}>
                {i > 0 && ", "}
                <Link href={`/medicos/${m.id}/editar`}>{nombreCompleto(m.personal)}</Link>
              </span>
            ))}
            .
          </p>
        </div>
      )}

      <div className="kpis">
        {MODULOS.map((m, i) => (
          <Link className="glass-panel kpi" key={m.ruta} href={m.ruta} data-color={m.color}>
            <span className="kpi-icono">
              <Icono nombre={m.icono} tamano={18} />
            </span>
            <span className="text-caption">{m.nombre}</span>
            <span className="kpi-cifra">{datos ? datos.totales[i].toLocaleString("es-VE") : "—"}</span>
            <span className="kpi-detalle">{descripciones[m.ruta]}</span>
          </Link>
        ))}
      </div>

      {datos && (
        <div className="paneles">
          <section className="glass-panel panel" data-color="vino">
            <div className="panel-titulo">
              <h2>Últimos récipes</h2>
              <Link href="/recetas">Ver todos</Link>
            </div>
            {datos.ultimas.length === 0 ? (
              <p className="suave">
                Todavía no hay récipes. <Link href="/recetas/nuevo">Crear el primero</Link>
              </p>
            ) : (
              <ul className="lista">
                {datos.ultimas.map((r) => (
                  <li key={r.id}>
                    <Link href={`/recetas/${r.id}`} className="cifra">
                      N° {r.numero}
                    </Link>{" "}
                    {nombreCompleto(r.paciente)}
                    <span className="suave cifra"> · {fechaDia(r.fecha)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="glass-panel panel" data-color="ciruela">
            <div className="panel-titulo">
              <h2>Citas de hoy</h2>
              <Link href={`/citas?dia=${diaLocal()}`}>Ver agenda</Link>
            </div>
            {datos.citasHoy.length === 0 ? (
              <p className="suave">
                No hay citas para hoy. <Link href="/citas/nuevo">Agendar una cita</Link>
              </p>
            ) : (
              <ul className="lista">
                {datos.citasHoy.map((c) => (
                  <li key={c.id}>
                    <Link href={`/citas/${c.id}`} className="cifra">
                      {hora(c.fechaHora)}
                    </Link>{" "}
                    {nombreCompleto(c.paciente)}
                    <span className="suave"> · {nombreCompleto(c.medico.personal)}</span>{" "}
                    <Insignia tono={estadosCita[c.estado].tono}>{estadosCita[c.estado].etiqueta}</Insignia>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
