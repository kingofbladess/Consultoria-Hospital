import { notFound } from "next/navigation";
import BotonEliminar from "@/components/BotonEliminar";
import Formulario from "@/components/Formulario";
import { Migas, SinConexion } from "@/components/ui";
import { opcionesPersonal } from "@/lib/opciones";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesionServidor";
import { camposUsuario, valoresUsuario } from "../../campos";

export const dynamic = "force-dynamic";

export default async function EditarUsuario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [datos, sesion] = await Promise.all([
    Promise.all([prisma.usuario.findUnique({ where: { id } }), opcionesPersonal()]).catch(() => null),
    sesionActual(),
  ]);
  if (!datos) return <SinConexion que="el usuario" />;
  const [usuario, personal] = datos;
  if (!usuario) notFound();
  const esUstedMismo = sesion?.id === id;

  return (
    <>
      <Migas items={[{ href: "/usuarios", texto: "Usuarios" }, { texto: usuario.nombre }]} />
      <div className="encabezado">
        <div>
          <h1>{usuario.nombre}</h1>
          <p className="suave cifra">{usuario.email}</p>
        </div>
        <BotonEliminar
          accion={`/api/usuarios/${id}`}
          nombre={`la cuenta de ${usuario.nombre}`}
          volverA="/usuarios"
          bloqueado={esUstedMismo ? "No puede eliminar su propia cuenta." : undefined}
        />
      </div>
      <Formulario
        secciones={camposUsuario(personal, true)}
        inicial={valoresUsuario(usuario)}
        accion={`/api/usuarios/${id}`}
        metodo="PATCH"
        destino="/usuarios"
        cancelar="/usuarios"
        textoGuardar="Guardar cambios"
        mensajeDuplicado="Ya existe un usuario con ese nombre de usuario o correo, o esa persona ya tiene cuenta."
      />
    </>
  );
}
