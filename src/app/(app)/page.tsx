import Link from "next/link";
import Icono from "@/components/Icono";
import { Insignia, SinConexion } from "@/components/ui";
import { diaLocal, estadosCita, fechaDia, fechaLarga, hora, inicioDia, nombreCompleto } from "@/lib/formato";
import { MODULOS } from "@/lib/modulos";
import { prisma } from "@/lib/prisma";
import styles from "./inicio.module.css";

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

async function cargar(dia: string) {
  const hoy = inicioDia(dia);
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
  const dia = diaLocal();
  const datos = await cargar(dia);

  return (
    <div className={styles.inicio}>
      <header className={styles.cabecera}>
        <div>
          <h1>Panel principal</h1>
          <time dateTime={dia}>
            <Icono nombre="citas" tamano={16} />
            <span>{fechaLarga(inicioDia(dia))}</span>
          </time>
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
      </header>

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

      <section aria-labelledby="resumen-modulos">
        <h2 id="resumen-modulos" className={styles.subtitulo}>Resumen de módulos</h2>
        <ul className={styles.indicadores}>
          {MODULOS.map((m, i) => (
            <li key={m.ruta}>
              <Link className={styles.modulo} href={m.ruta} data-color={m.color}>
                <span className={styles.moduloNombre}>
                  <Icono nombre={m.icono} tamano={18} />
                  {m.nombre}
                </span>
                <span className={styles.total}>{datos ? datos.totales[i].toLocaleString("es-VE") : "—"}</span>
                <span className={styles.detalle}>{descripciones[m.ruta]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {datos && (
        <div className={styles.actividad}>
          <section className={styles.panel} aria-labelledby="agenda-hoy">
            <div className={styles.panelTitulo}>
              <h2 id="agenda-hoy"><Icono nombre="citas" tamano={20} /> Citas de hoy</h2>
              <Link href={`/citas?dia=${dia}`}>Ver agenda <Icono nombre="flecha" tamano={15} /></Link>
            </div>
            {datos.citasHoy.length === 0 ? (
              <p className={styles.vacio}>
                No hay citas para hoy. <Link href="/citas/nuevo">Agendar una cita</Link>
              </p>
            ) : (
              <ul className={styles.filas}>
                {datos.citasHoy.map((c) => (
                  <li key={c.id} className={styles.cita}>
                    <time className="cifra" dateTime={c.fechaHora.toISOString()}>{hora(c.fechaHora)}</time>
                    <div className={styles.persona}>
                      <Link href={`/citas/${c.id}`}>{nombreCompleto(c.paciente)}</Link>
                      <span className={styles.detalle}>{nombreCompleto(c.medico.personal)}</span>
                    </div>
                    <Insignia tono={estadosCita[c.estado].tono}>{estadosCita[c.estado].etiqueta}</Insignia>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className={styles.panel} aria-labelledby="recetas-recientes">
            <div className={styles.panelTitulo}>
              <h2 id="recetas-recientes"><Icono nombre="recetas" tamano={20} /> Últimos récipes</h2>
              <Link href="/recetas">Ver todos <Icono nombre="flecha" tamano={15} /></Link>
            </div>
            {datos.ultimas.length === 0 ? (
              <p className={styles.vacio}>
                Todavía no hay récipes. <Link href="/recetas/nuevo">Crear el primero</Link>
              </p>
            ) : (
              <ul className={styles.filas}>
                {datos.ultimas.map((r) => (
                  <li key={r.id} className={styles.recipe}>
                    <div className={styles.persona}>
                      <Link href={`/recetas/${r.id}`} className="cifra">N° {r.numero}</Link>
                      <span className={styles.detalle}>{nombreCompleto(r.paciente)}</span>
                    </div>
                    <time className={`cifra ${styles.detalle}`} dateTime={r.fecha.toISOString()}>{fechaDia(r.fecha)}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
