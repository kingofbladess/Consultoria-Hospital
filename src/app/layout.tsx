import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consultoría Hospital",
  description: "Gestión de plantilla, consultorios, pacientes, récipes, especialidades y vademécum.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="barra">
          <strong>Consultoría Hospital</strong>
        </header>
        <main className="contenido">{children}</main>
      </body>
    </html>
  );
}
