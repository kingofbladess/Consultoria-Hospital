import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { idsPacientes, idsPorTexto } from "@/lib/busqueda";
import { fechaDia, nombreCompleto, nombreItem } from "@/lib/formato";
import { opcionesMedicos } from "@/lib/opciones";
import { Busqueda, Encabezado, enlaceConFiltros, leerPagina, Paginacion, SinConexion, Vacio } from "@/components/ui";

export const dynamic = "force-dynamic";

const POR_PAGINA = 20;

type Filtros = { q: string; medicoId: string; pacienteId: string };

async function buscar(f: Filtros, pagina: number) {
  const numero = Number(f.q.replace(/\D/g, ""));
  const where: Prisma.RecetaWhereInput = {
    ...(f.medicoId && { medicoId: f.medicoId }),
    ...(f.pacienteId && { pacienteId: f.pacienteId }),
    ...(f.q && {
      OR: [
        ...(numero ? [{ numero }] : []),
        { pacienteId: { in: await idsPacientes(f.q).catch(() => []) } },
        { items: { some: { descripcion: { contains: f.q, mode: "insensitive" } } } },
        { items: { some: { medicamentoId: { in: await idsPorTexto("medicamento", ["principioActivo", "nombreComercial"], f.q).catch(() => []) } } } },
      ],
    }),
  };
  try {
    const [recetas, total, medicos, paciente] = await Promise.all([
      prisma.receta.findMany({
        where,
        include: {
          paciente: true,
          medico: { include: { personal: true } },
          items: { include: { medicamento: true }, orderBy: { orden: "asc" } },
        },
        orderBy: { numero: "desc" },
        skip: (pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
      }),
      prisma.receta.count({ where }),
      opcionesMedicos(),
      f.pacienteId ? prisma.paciente.findUnique({ where: { id: f.pacienteId } }) : null,
    ]);
    return { recetas, total, medicos, paciente };
  } catch {
    return null;
  }
}

export default async function Recetas({ searchParams }: { searchParams: Promise<Partial<Filtros> & { pagina?: string }> }) {
  const params = await searchParams;
  const f: Filtros = { q: params.q?.trim() ?? "", medicoId: params.medicoId ?? "", pacienteId: params.pacienteId ?? "" };
  const pagina = leerPagina(params.pagina);
  const r = await buscar(f, pagina);
  const filtrando = Object.values(f).some(Boolean);

  return (
    <>
      <Encabezado caption="Prescripción"
        titulo={r?.paciente ? `Récipes de ${nombreCompleto(r.paciente)}` : "Récipes"}
        subtitulo={r && `${r.total} ${r.total === 1 ? "récipe" : "récipes"}`}
      >
        <Link href="/recetas/protocolos" className="boton">
          Protocolos
        </Link>
        <Link href="/recetas/plantillas" className="boton">
          Mis plantillas
        </Link>
        <Link href={enlaceConFiltros("/recetas/nuevo", { pacienteId: f.pacienteId })} className="boton primario">
          Crear récipe
        </Link>
      </Encabezado>

      <Busqueda q={f.q} placeholder="Buscar por N°, paciente o medicamento" limpiar={filtrando ? "/recetas" : undefined}>
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
        <SinConexion que="los récipes" />
      ) : r.recetas.length === 0 ? (
        <Vacio
          texto={filtrando ? "No hay récipes que coincidan con la búsqueda." : "Todavía no ha creado récipes."}
          accion={{ href: enlaceConFiltros("/recetas/nuevo", { pacienteId: f.pacienteId }), texto: "Crear récipe", primaria: true }}
        />
      ) : (
        <>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Fecha</th>
                  <th>Paciente</th>
                  <th>Médico</th>
                  <th>Medicamentos</th>
                </tr>
              </thead>
              <tbody>
                {r.recetas.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <Link href={`/recetas/${x.id}`}>{x.numero}</Link>
                    </td>
                    <td className="cifra">{fechaDia(x.fecha)}</td>
                    <td>
                      <Link href={`/pacientes/${x.pacienteId}`}>{nombreCompleto(x.paciente)}</Link>
                    </td>
                    <td>{nombreCompleto(x.medico.personal)}</td>
                    <td className="recorte">{x.items.map((i) => nombreItem(i)).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion
            pagina={pagina}
            paginas={Math.ceil(r.total / POR_PAGINA)}
            enlace={(n) => enlaceConFiltros("/recetas", { ...f, pagina: String(n) })}
          />
        </>
      )}
    </>
  );
}
