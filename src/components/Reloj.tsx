"use client";

import { useEffect, useState } from "react";

/** Hora local del centro en mono tabular, con la etiqueta VET (hora de Venezuela), como pide el kit. */
export default function Reloj() {
  const [ahora, setAhora] = useState<Date | null>(null);
  useEffect(() => {
    setAhora(new Date());
    const t = setInterval(() => setAhora(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="reloj" aria-label="Hora de Venezuela">
      <span className="status-dot en-linea" aria-hidden="true" />
      <span className="cifra">
        {ahora ? ahora.toLocaleTimeString("es-VE", { timeZone: "America/Caracas", hour: "2-digit", minute: "2-digit", hour12: false }) : "--:--"}
      </span>
      <span className="text-caption">VET</span>
    </span>
  );
}
