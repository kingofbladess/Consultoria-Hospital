"use client";

import { useState } from "react";
import Icono from "@/components/Icono";
import { telefonoWhatsapp } from "@/lib/formato";

export default function EnviarReceta({
  id,
  numero,
  paciente,
  telefono,
  medico,
}: {
  id: string;
  numero: number;
  paciente: string;
  telefono: string | null;
  medico: string;
}) {
  const [estado, setEstado] = useState<"" | "preparando" | "descargado">("");
  const [error, setError] = useState("");
  const pdf = `/api/recetas/${id}/pdf`;
  const mensaje = `Hola ${paciente}, le envío su récipe N° ${numero} de ${medico}.`;

  async function enviarWhatsapp() {
    setError("");
    setEstado("preparando");
    try {
      const respuesta = await fetch(pdf);
      if (!respuesta.ok) throw new Error();
      const archivo = new File([await respuesta.blob()], `Recipe-${numero}.pdf`, { type: "application/pdf" });

      // En el teléfono se abre el menú de compartir y el PDF va directo al chat.
      if (navigator.canShare?.({ files: [archivo] })) {
        try {
          await navigator.share({ files: [archivo], text: mensaje });
        } catch {
          // El médico cerró el menú de compartir: no es un error.
        }
        setEstado("");
        return;
      }

      // En la computadora: se descarga el PDF y se abre el chat para adjuntarlo.
      const enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(archivo);
      enlace.download = archivo.name;
      enlace.click();
      URL.revokeObjectURL(enlace.href);
      const numeroWa = telefonoWhatsapp(telefono);
      window.open(`https://wa.me/${numeroWa}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener");
      setEstado("descargado");
    } catch {
      setError("No se pudo preparar el PDF. Intente de nuevo.");
      setEstado("");
    }
  }

  return (
    <div className="enviar">
      <button type="button" className="boton primario whatsapp" onClick={enviarWhatsapp} disabled={estado === "preparando"}>
        {estado === "preparando" ? (
          <>
            <span className="girando" aria-hidden="true" /> Preparando PDF…
          </>
        ) : (
          <>
            <Icono nombre="enviar" tamano={18} /> Enviar por WhatsApp
          </>
        )}
      </button>
      <a href={`${pdf}?descargar=1`} className="boton">
        <Icono nombre="descargar" tamano={18} />
        Descargar PDF
      </a>
      <a href={pdf} target="_blank" rel="noopener" className="boton">
        <Icono nombre="imprimir" tamano={18} />
        Imprimir
      </a>
      {!telefono && estado !== "descargado" && (
        <span className="suave ayuda">El paciente no tiene teléfono registrado: podrá elegir el contacto en WhatsApp.</span>
      )}
      {estado === "descargado" && (
        <p className="aviso exito" role="status">
          El PDF se descargó y se abrió WhatsApp. Adjúntelo en el chat con el clip y envíelo.
        </p>
      )}
      {error && <span className="error-campo">{error}</span>}
    </div>
  );
}
