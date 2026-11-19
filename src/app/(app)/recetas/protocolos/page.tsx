import type { Metadata } from "next";
import BotonEliminar from "@/components/BotonEliminar";
import Icono from "@/components/Icono";
import { Encabezado, Insignia, Migas, SinConexion, Vacio } from "@/components/ui";
import { nombreItem, posologia } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { describirRegla, EDAD_PEDIATRICA, nombreGrupo } from "@/lib/protocolos";

export const metadata: Metadata = { title: "Protocolos" };
export const dynamic = "force-dynamic";

export default async function Protocolos() {
  const protocolos = await prisma.protocolo
    .findMany({
      orderBy: [{ enfermedad: { codigoCie10: "asc" } }, { grupo: "asc" }],
      include: { enfermedad: true, items: { include: { medicamento: true }, orderBy: { orden: "asc" } } },
    })
    .catch(() => null);

  // Agrupa por enfermedad: adulto y pediátrico lado a lado.
  const porEnfermedad = new Map<string, NonNullable<typeof protocolos>>();
  for (const p of protocolos ?? []) porEnfermedad.set(p.enfermedadId, [...(porEnfermedad.get(p.enfermedadId) ?? []), p]);

  return (
    <>
      <Migas items={[{ href: "/recetas", texto: "Récipes" }, { texto: "Protocolos" }]} />
      <Encabezado caption="Prescripción"
        titulo="Protocolos de tratamiento"
        subtitulo={`Llenan el récipe solos según el diagnóstico y la edad. Pediátrico: menores de ${EDAD_PEDIATRICA} años.`}
      />
      <p className="aviso">
        Los protocolos de ejemplo son un punto de partida: el equipo médico del centro debe revisarlos. Para crear o cambiar uno, emita un
        récipe con ese diagnóstico y marque «Guardar como protocolo».
      </p>

      {!protocolos ? (
        <SinConexion que="los protocolos" />
      ) : protocolos.length === 0 ? (
        <Vacio
          texto="Todavía no hay protocolos. Emita un récipe con diagnóstico y guárdelo como protocolo."
          accion={{ href: "/recetas/nuevo", texto: "Crear récipe", primaria: true }}
        />
      ) : (
        [...porEnfermedad.values()].map((grupo) => (
          <section key={grupo[0].enfermedadId} className="protocolo-enfermedad">
            <h2>
              <Insignia>{grupo[0].enfermedad.codigoCie10}</Insignia> {grupo[0].enfermedad.nombre}
            </h2>
            <div className="paneles">
              {grupo.map((p) => (
                <article key={p.id} className="panel protocolo">
                  <div className="panel-titulo">
                    <span className="grupo-etario">
                      <span className="chip-icono">
                        <Icono nombre="pacientes" tamano={18} />
                      </span>
                      {nombreGrupo[p.grupo]}
                    </span>
                    <BotonEliminar
                      accion={`/api/protocolos/${p.id}`}
                      nombre={`el protocolo ${nombreGrupo[p.grupo].toLowerCase()} de ${p.enfermedad.nombre}`}
                      volverA="/recetas/protocolos"
                    />
                  </div>
                  <ol className="lista numerada">
                    {p.items.map((i) => (
                      <li key={i.id}>
                        <strong>{nombreItem(i)}</strong>
                        <br />
                        <span className="suave">
                          {i.dosisMgKg
                            ? `${describirRegla({ dosisMgKg: i.dosisMgKg, dosisMaxMg: i.dosisMaxMg, mgPorMl: i.mgPorMl })} · ${i.frecuencia}, ${i.duracion}`
                            : posologia(i)}
                        </span>
                      </li>
                    ))}
                  </ol>
                  {p.indicacionesGenerales && <p className="texto-largo suave">{p.indicacionesGenerales}</p>}
                  {p.notas && (
                    <p className="nota-protocolo">
                      <strong>Nota:</strong> {p.notas}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
