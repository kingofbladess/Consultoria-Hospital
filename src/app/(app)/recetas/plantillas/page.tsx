import Link from "next/link";
import BotonEliminar from "@/components/BotonEliminar";
import { Encabezado, Migas, SinConexion, Vacio } from "@/components/ui";
import { nombreCompleto, nombreItem, posologia } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Plantillas() {
  const plantillas = await prisma.plantillaReceta
    .findMany({
      orderBy: [{ medico: { personal: { apellidos: "asc" } } }, { nombre: "asc" }],
      include: {
        medico: { include: { personal: true } },
        items: { include: { medicamento: true }, orderBy: { orden: "asc" } },
      },
    })
    .catch(() => null);

  return (
    <>
      <Migas items={[{ href: "/recetas", texto: "Récipes" }, { texto: "Plantillas" }]} />
      <Encabezado caption="Prescripción" titulo="Plantillas" subtitulo="Los medicamentos que receta a diario, con su posología lista para reutilizar." />

      {!plantillas ? (
        <SinConexion que="las plantillas" />
      ) : plantillas.length === 0 ? (
        <Vacio
          texto="Todavía no hay plantillas. Al crear un récipe, marque «Guardar como plantilla» para reutilizar esos medicamentos."
          accion={{ href: "/recetas/nuevo", texto: "Crear récipe", primaria: true }}
        />
      ) : (
        <div className="paneles">
          {plantillas.map((p) => (
            <section className="panel" key={p.id}>
              <div className="panel-titulo">
                <h2>{p.nombre}</h2>
                <span className="suave">{nombreCompleto(p.medico.personal)}</span>
              </div>
              <ol className="lista numerada">
                {p.items.map((i) => (
                  <li key={i.id}>
                    <strong>{nombreItem(i)}</strong>
                    <span className="suave"> · {posologia(i)}</span>
                  </li>
                ))}
              </ol>
              {p.indicacionesGenerales && <p className="suave texto-largo">{p.indicacionesGenerales}</p>}
              <div className="acciones">
                <Link href={`/recetas/nuevo?plantillaId=${p.id}`} className="boton primario">
                  Usar en un récipe
                </Link>
                <BotonEliminar accion={`/api/plantillas/${p.id}`} nombre={`la plantilla «${p.nombre}»`} volverA="/recetas/plantillas" />
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
