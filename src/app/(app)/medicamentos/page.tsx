import Link from "next/link";
import type { Prisma, ViaAdministracion } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { idsPorTexto } from "@/lib/busqueda";
import { nombreVia } from "@/lib/formato";
import { Busqueda, Encabezado, enlaceConFiltros, Insignia, leerPagina, Paginacion, SinConexion, Vacio } from "@/components/ui";

export const dynamic = "force-dynamic";

const POR_PAGINA = 25;

type Filtros = { q: string; via: string; especial: string };

async function buscar(f: Filtros, pagina: number) {
  const where: Prisma.MedicamentoWhereInput = {
    ...(f.via && { via: f.via as ViaAdministracion }),
    ...(f.especial && { requiereRecipeEspecial: true }),
    ...(f.q && {
      OR: [
        { id: { in: await idsPorTexto("medicamento", ["principioActivo", "nombreComercial", "laboratorio", "presentacion"], f.q).catch(() => []) } },
        { enfermedades: { some: { id: { in: await idsPorTexto("enfermedad", ["codigoCie10", "nombre"], f.q).catch(() => []) } } } },
      ],
    }),
  };
  try {
    const [medicamentos, total] = await Promise.all([
      prisma.medicamento.findMany({
        where,
        orderBy: [{ principioActivo: "asc" }, { concentracion: "asc" }],
        skip: (pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
      }),
      prisma.medicamento.count({ where }),
    ]);
    return { medicamentos, total };
  } catch {
    return null;
  }
}

export default async function Medicamentos({ searchParams }: { searchParams: Promise<Partial<Filtros> & { pagina?: string }> }) {
  const params = await searchParams;
  const f: Filtros = { q: params.q?.trim() ?? "", via: params.via ?? "", especial: params.especial ?? "" };
  const pagina = leerPagina(params.pagina);
  const r = await buscar(f, pagina);
  const filtrando = Object.values(f).some(Boolean);

  return (
    <>
      <Encabezado caption="Vademécum" titulo="Medicamentos" subtitulo={r && `Vademécum · ${r.total} ${r.total === 1 ? "medicamento" : "medicamentos"}`}>
        <Link href="/medicamentos/nuevo" className="boton primario">
          Agregar medicamento
        </Link>
      </Encabezado>

      <Busqueda q={f.q} placeholder="Buscar por principio activo, marca, laboratorio o enfermedad" limpiar={filtrando ? "/medicamentos" : undefined}>
        <label htmlFor="via" className="oculto">
          Vía
        </label>
        <select id="via" name="via" defaultValue={f.via}>
          <option value="">Todas las vías</option>
          {Object.entries(nombreVia).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
        <label className="filtro-casilla">
          <input type="checkbox" name="especial" value="1" defaultChecked={Boolean(f.especial)} />
          Solo récipe especial
        </label>
      </Busqueda>

      {!r ? (
        <SinConexion que="los medicamentos" />
      ) : r.medicamentos.length === 0 ? (
        filtrando ? (
          <Vacio texto="Ningún medicamento coincide con la búsqueda." accion={{ href: "/medicamentos", texto: "Ver todo el vademécum" }} />
        ) : (
          <Vacio
            texto="El vademécum está vacío. Puede cargar los medicamentos de ejemplo con npm run db:seed o agregarlos uno a uno."
            accion={{ href: "/medicamentos/nuevo", texto: "Agregar medicamento", primaria: true }}
          />
        )
      ) : (
        <>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Principio activo</th>
                  <th>Nombre comercial</th>
                  <th>Presentación</th>
                  <th>Vía</th>
                  <th>Laboratorio</th>
                </tr>
              </thead>
              <tbody>
                {r.medicamentos.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/medicamentos/${m.id}`}>
                        {m.principioActivo} {m.concentracion}
                      </Link>{" "}
                      {m.requiereRecipeEspecial && <Insignia tono="alerta">Récipe especial</Insignia>}
                    </td>
                    <td>{m.nombreComercial ?? "—"}</td>
                    <td>{m.presentacion}</td>
                    <td>{nombreVia[m.via]}</td>
                    <td>{m.laboratorio ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion
            pagina={pagina}
            paginas={Math.ceil(r.total / POR_PAGINA)}
            enlace={(n) => enlaceConFiltros("/medicamentos", { ...f, pagina: String(n) })}
          />
        </>
      )}
    </>
  );
}
