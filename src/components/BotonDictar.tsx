"use client";

import { useEffect, useRef, useState } from "react";

// Dictado por voz con el reconocimiento del navegador (Chrome, Edge y Safari).
// Si el navegador no lo soporta, el botón no aparece.

type Reconocimiento = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function crearReconocimiento(): Reconocimiento | null {
  const w = window as unknown as Record<string, (new () => Reconocimiento) | undefined>;
  const Clase = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Clase ? new Clase() : null;
}

export default function BotonDictar({ alTexto, etiqueta = "Dictar por voz" }: { alTexto: (texto: string) => void; etiqueta?: string }) {
  const [disponible, setDisponible] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [error, setError] = useState("");
  const rec = useRef<Reconocimiento | null>(null);

  useEffect(() => setDisponible(Boolean(crearReconocimiento())), []);

  function alternar() {
    if (escuchando) {
      rec.current?.stop();
      return;
    }
    const r = crearReconocimiento();
    if (!r) return;
    r.lang = "es-VE";
    r.interimResults = false;
    r.continuous = true;
    r.onresult = (e) => {
      const ultimo = e.results[e.results.length - 1];
      if (ultimo?.[0]) alTexto(ultimo[0].transcript.trim());
    };
    r.onerror = (e) =>
      setError(e.error === "not-allowed" ? "Permita el uso del micrófono en el navegador para dictar." : "No se entendió el dictado. Intente de nuevo.");
    r.onend = () => setEscuchando(false);
    setError("");
    rec.current = r;
    r.start();
    setEscuchando(true);
  }

  if (!disponible) return null;
  return (
    <>
      <button type="button" className={`boton chico ${escuchando ? "grabando" : ""}`} onClick={alternar} aria-pressed={escuchando}>
        {escuchando ? "Escuchando… toque para detener" : etiqueta}
      </button>
      {error && <span className="error-campo">{error}</span>}
    </>
  );
}
