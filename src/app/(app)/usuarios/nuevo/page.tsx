import Formulario from "@/components/Formulario";
import { Migas, SinConexion } from "@/components/ui";
import { opcionesPersonal } from "@/lib/opciones";
import { camposUsuario } from "../campos";

export const dynamic = "force-dynamic";

export default async function NuevoUsuario() {
  const personal = await opcionesPersonal().catch(() => null);
  return (
    <>
      <Migas items={[{ href: "/usuarios", texto: "Usuarios" }, { texto: "Crear" }]} />
      <h1>Crear usuario</h1>
      {!personal ? (
        <SinConexion que="la plantilla" />
      ) : (
        <Formulario
          secciones={camposUsuario(personal)}
          inicial={{ rol: "RECEPCION" }}
          accion="/api/usuarios"
          metodo="POST"
          destino="/usuarios"
          cancelar="/usuarios"
          textoGuardar="Crear usuario"
          mensajeDuplicado="Ya existe un usuario con ese nombre de usuario o correo, o esa persona ya tiene cuenta."
        />
      )}
    </>
  );
}
