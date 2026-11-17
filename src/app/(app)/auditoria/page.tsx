import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Busqueda, Encabezado, enlaceConFiltros, Insignia, leerPagina, Paginacion, SinConexion, Vacio } from "@/components/ui";
import { fechaHora, inicioDia } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Auditoría" };
export const dynamic = "force-dynamic";

const POR_PAGINA = 40;
const DIA_MS = 24 * 60 * 60 * 1000;

const ACCIONES: Record<string, { etiqueta: string; tono: string }> = {
  CREAR: { etiqueta: "Creó", tono: "exito" },
  ACTUALIZAR: { etiqueta: "Modificó", tono: "info" },
  ELIMINAR: { etiqueta: "Eliminó", tono: "peligro" },
  INGRESAR: { etiqueta: "Ingresó", tono: "neutro" },
  SALIR: { etiqueta: "Salió", tono: "neutro" },
};

/** Nombre legible y pantalla de cada recurso de la bitácora. */
const RECURSOS: Record<string, { nombre: string; ruta?: (id: string) => string }> = {
  paciente: { nombre: "Paciente", ruta: (id) => `/pacientes/${id}` },
  medico: { nombre: "Médico", ruta: (id) => `/medicos/${id}` },
  personal: { nombre: "Personal" },
  consulta: { nombre: "Consulta", ruta: (id) => `/consultas/${id}` },
  receta: { nombre: "Récipe", ruta: (id) => `/recetas/${id}` },
  cita: { nombre: "Cita", ruta: (id) => `/citas/${id}` },
  medicamento: { nombre: "Medicamento", ruta: (id) => `/medicamentos/${id}` },
  protocolo: { nombre: "Protocolo", ruta: () => "/recetas/protocolos" },
  plantillaReceta: { nombre: "Plantilla", ruta: () => "/recetas/plantillas" },
  usuario: { nombre: "Usuario", ruta: (id) => `/usuarios/${id}/editar` },
  sesion: { nombre: "Sesión" },
};

type Filtros = { q: string; accion: string; recurso: string; dia: string };

export default async function Auditoria({ searchParams }: { searchParams: Promise<Partial<Filtros> & { pagina?: string }> }) {
  const p = await searchParams;
  const f: Filtros = { q: p.q?.trim() ?? "", accion: p.accion ?? "", recurso: p.recurso ?? "", dia: p.dia ?? "" };
  const pagina = leerPagina(p.pagina);
  const where: Prisma.AuditoriaWhereInput = {
    ...(f.q && { usuarioNombre: { contains: f.q, mode: "insensitive" } }),
    ...(f.accion && { accion: f.accion }),
    ...(f.recurso && { recurso: f.recurso }),
    ...(f.dia && { fecha: { gte: inicioDia(f.dia), lt: new Date(inicioDia(f.dia).getTime() + DIA_MS) } }),
  };
  const datos = await Promise.all([
    prisma.auditoria.findMany({ where, orderBy: { fecha: "desc" }, skip: (pagina - 1) * POR_PAGINA, take: POR_PAGINA }),
    prisma.auditoria.count({ where }),
  ]).catch(() => null);
  const filtrando = Object.values(f).some(Boolean);

  return (
    <>
      <Encabezado
        caption="Administración"
        titulo="Auditoría"
        subtitulo={datos ? `${datos[1]} ${datos[1] === 1 ? "movimiento" : "movimientos"} registrados` : undefined}
      />

      <Busqueda q={f.q} placeholder="Buscar por nombre de usuario" limpiar={filtrando ? "/auditoria" : undefined}>
        <label htmlFor="accion" className="oculto">
          Acción
        </label>
        <select id="accion" name="accion" defaultValue={f.accion}>
          <option value="">Todas las acciones</option>
          {Object.entries(ACCIONES).map(([valor, a]) => (
            <option key={valor} value={valor}>
              {a.etiqueta}
            </option>
          ))}
        </select>
        <label htmlFor="recurso" className="oculto">
          Registro
        </label>
        <select id="recurso" name="recurso" defaultValue={f.recurso}>
          <option value="">Todos los registros</option>
          {Object.entries(RECURSOS).map(([valor, r]) => (
            <option key={valor} value={valor}>
              {r.nombre}
            </option>
          ))}
        </select>
        <label htmlFor="dia" className="oculto">
          Día
        </label>
        <input id="dia" name="dia" type="date" defaultValue={f.dia} />
      </Busqueda>

      {!datos ? (
        <SinConexion que="la auditoría" />
      ) : datos[0].length === 0 ? (
        <Vacio texto={filtrando ? "No hay movimientos con esos filtros." : "Todavía no hay movimientos registrados."} />
      ) : (
        <>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Registro</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {datos[0].map((m) => {
                  const r = RECURSOS[m.recurso];
                  const a = ACCIONES[m.accion];
                  const enlace = r?.ruta && m.registroId && m.accion !== "ELIMINAR" && m.recurso !== "sesion" ? r.ruta(m.registroId) : null;
                  return (
                    <tr key={m.id}>
                      <td className="cifra">{fechaHora(m.fecha)}</td>
                      <td>{m.usuarioNombre}</td>
                      <td>
                        <Insignia tono={a?.tono}>{a?.etiqueta ?? m.accion}</Insignia>
                      </td>
                      <td>{enlace ? <Link href={enlace}>{r?.nombre}</Link> : (r?.nombre ?? m.recurso)}</td>
                      <td className="recorte suave">{m.detalle ? (m.accion === "ACTUALIZAR" ? `Campos: ${m.detalle}` : m.detalle) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Paginacion
            pagina={pagina}
            paginas={Math.ceil(datos[1] / POR_PAGINA)}
            enlace={(n) => enlaceConFiltros("/auditoria", { ...f, pagina: String(n) })}
          />
        </>
      )}
    </>
  );
}
