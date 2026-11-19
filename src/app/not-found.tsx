import { Vacio } from "@/components/ui";

export default function NoEncontrado() {
  return (
    <>
      <h1>No encontramos esta página</h1>
      <Vacio
        texto="Puede que el registro haya sido eliminado o que el enlace esté incompleto."
        accion={{ href: "/", texto: "Volver al panel principal", primaria: true }}
      />
    </>
  );
}
