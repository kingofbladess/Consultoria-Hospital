import Link from "next/link";
import { notFound } from "next/navigation";
import BotonEliminar from "@/components/BotonEliminar";
import { Encabezado, Migas, SinConexion } from "@/components/ui";
import { edad, fechaLarga, nombreCompleto, nombreItem, posologia } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { conGrado } from "@/lib/marca/grados";
import EnviarReceta from "./EnviarReceta";

export const dynamic = "force-dynamic";

export default async function FichaReceta({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const receta = await prisma.receta
    .findUnique({
      where: { id },
      include: {
        paciente: true,
        medico: { include: { personal: true, especialidades: true } },
        items: { include: { medicamento: true }, orderBy: { orden: "asc" } },
      },
    })
    .catch(() => undefined);
  if (receta === undefined) return <SinConexion que="el récipe" />;
  if (!receta) notFound();

  const paciente = nombreCompleto(receta.paciente);
  const medico = conGrado(nombreCompleto(receta.medico.personal), receta.medico.personal.grado);
  const m = receta.medico;
  const faltan = [!m.firmaUrl && "firma", !m.selloUrl && "sello"].filter(Boolean);

  return (
    <>
      <Migas items={[{ href: "/recetas", texto: "Récipes" }, { texto: `N° ${receta.numero}` }]} />
      <Encabezado titulo={`Récipe N° ${receta.numero}`} subtitulo={`${paciente} · ${fechaLarga(receta.fecha)}`}>
        <Link href={`/recetas/nuevo?desde=${id}`} className="boton">
          Repetir récipe
        </Link>
        <BotonEliminar accion={`/api/recetas/${id}`} nombre={`el récipe N° ${receta.numero}`} volverA="/recetas" />
      </Encabezado>

      {nuevo && (
        <p className="aviso exito" role="status">
          Récipe creado. Envíelo al paciente por WhatsApp o descárguelo.
        </p>
      )}
      {faltan.length > 0 && (
        <p className="aviso">
          El récipe sale sin {faltan.join(" ni ")} porque el médico no los ha cargado.{" "}
          <Link href={`/medicos/${m.id}/editar`}>Cargar {faltan.join(" y ")}</Link>
        </p>
      )}

      <EnviarReceta id={id} numero={receta.numero} paciente={receta.paciente.nombres} telefono={receta.paciente.telefono} medico={medico} />

      {/* Vista previa con la misma información que el PDF. */}
      <article className="hoja-receta" aria-label="Vista previa del récipe">
        <header>
          {m.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.logoUrl} alt="Logo" className="logo" />
          )}
          <div>
            <strong className="medico">{medico}</strong>
            <span>{m.especialidades.map((e) => e.nombre).join(" · ")}</span>
            <span>{[m.numeroColegio && `COL ${m.numeroColegio}`, `MPPS ${m.numeroMpps}`].filter(Boolean).join(" · ")}</span>
          </div>
          <span className="original">ORIGINAL</span>
        </header>
        <div className="paciente">
          <p>
            <strong>Paciente:</strong> <Link href={`/pacientes/${receta.pacienteId}`}>{paciente}</Link>
          </p>
          <p className="suave">
            {[receta.paciente.cedula && `C.I. ${receta.paciente.cedula}`, `${edad(receta.paciente.fechaNacimiento, receta.fecha)} años`]
              .filter(Boolean)
              .join(" · ")}{" "}
            · {fechaLarga(receta.fecha)}
          </p>
        </div>
        <p className="rp">Rp/</p>
        <ol className="medicamentos">
          {receta.items.map((item) => (
            <li key={item.id}>
              <strong>{nombreItem(item)}</strong>
              {item.cantidad && <span className="suave"> — Cant.: {item.cantidad}</span>}
              <span className="posologia">{posologia(item)}</span>
              {item.indicaciones && <span className="suave nota">{item.indicaciones}</span>}
            </li>
          ))}
        </ol>
        {receta.indicacionesGenerales && (
          <div className="indicaciones">
            <strong>Indicaciones</strong>
            <p className="texto-largo">{receta.indicacionesGenerales}</p>
          </div>
        )}
        <footer>
          <div className="firma">
            {m.selloUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.selloUrl} alt="Sello" className="sello" />
            )}
            {m.firmaUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.firmaUrl} alt="Firma" className="firma-img" />
            )}
          </div>
          <span className="linea">{medico}</span>
        </footer>
      </article>
    </>
  );
}
