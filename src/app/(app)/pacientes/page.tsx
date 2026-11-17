import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { idsPacientes } from "@/lib/busqueda";
import { GradoConArte } from "@/components/Marca";
import { edad, fechaCorta, nombreSexo } from "@/lib/formato";
import { Busqueda, Encabezado, enlaceConFiltros, leerPagina, Paginacion, SinConexion, Vacio } from "@/components/ui";

export const dynamic = "force-dynamic";

const POR_PAGINA = 20;

async function buscar(q: string, pagina: number) {
  const where: Prisma.PacienteWhereInput = q
    ? { id: { in: await idsPacientes(q).catch(() => []) } } // Sin distinguir acentos: «perez» encuentra «Pérez».
    : {};
  try {
    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        where,
        orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
        skip: (pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
      }),
      prisma.paciente.count({ where }),
    ]);
    return { pacientes, total };
  } catch {
    return null;
  }
}

export default async function Pacientes({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const pagina = leerPagina(params.pagina);
  const r = await buscar(q, pagina);

  return (
    <>
      <Encabezado caption="Admisión"
        titulo="Pacientes"
        subtitulo={r && `${r.total} ${r.total === 1 ? "paciente" : "pacientes"}${q ? ` que coinciden con «${q}»` : ""}`}
      >
        <Link href="/pacientes/nuevo" className="boton primario">
          Registrar paciente
        </Link>
      </Encabezado>

      <Busqueda q={q} placeholder="Buscar por cédula, nombre o apellido" />

      {!r ? (
        <SinConexion que="los pacientes" />
      ) : r.pacientes.length === 0 ? (
        q ? (
          <Vacio texto={`Ningún paciente coincide con «${q}».`} accion={{ href: "/pacientes", texto: "Ver todos los pacientes" }} />
        ) : (
          <Vacio
            texto="Todavía no hay pacientes registrados."
            accion={{ href: "/pacientes/nuevo", texto: "Registrar el primer paciente", primaria: true }}
          />
        )
      ) : (
        <>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Cédula</th>
                  <th>Edad</th>
                  <th>Sexo</th>
                  <th>Afiliación</th>
                  <th>Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {r.pacientes.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/pacientes/${p.id}`}>
                        {p.apellidos}, {p.nombres}
                      </Link>
                    </td>
                    <td>{p.cedula ?? "—"}</td>
                    <td title={fechaCorta(p.fechaNacimiento)}>{edad(p.fechaNacimiento)} años</td>
                    <td>{nombreSexo[p.sexo]}</td>
                    <td>{p.componente ? <GradoConArte componente={p.componente} grado={p.grado} compacto /> : <span className="suave">Civil</span>}</td>
                    <td>{p.telefono ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion
            pagina={pagina}
            paginas={Math.ceil(r.total / POR_PAGINA)}
            enlace={(n) => enlaceConFiltros("/pacientes", { q, pagina: String(n) })}
          />
        </>
      )}
    </>
  );
}
