import { readFile } from "node:fs/promises";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { Especialidad, Medicamento, Medico, Paciente, Personal, Receta, RecetaItem } from "@prisma/client";
import path from "node:path";
import { edad, fechaLarga, nombreCompleto, nombreItem, posologia } from "./formato";
import { conGrado } from "./marca/grados";
import { rutaDeUrl, tipoImagen } from "./subidas";

export type RecetaCompleta = Receta & {
  paciente: Paciente;
  medico: Medico & { personal: Personal; especialidades: Especialidad[] };
  items: (RecetaItem & { medicamento: Medicamento | null })[];
};

// Media carta vertical (5,5 × 8,5 pulgadas), el tamaño habitual de un récipe.
const ANCHO = 396;
const ALTO = 612;
const MARGEN = 28;
const UTIL = ANCHO - MARGEN * 2;
const PIE = 120; // Espacio reservado abajo para la firma y el sello.

// Colores del kit de marca (sRGB de los tokens): texto #0C0C04, secundario #656454, marca oliva #3E3D0E.
const TINTA = rgb(12 / 255, 12 / 255, 4 / 255);
const SUAVE = rgb(101 / 255, 100 / 255, 84 / 255);
const ACENTO = rgb(62 / 255, 61 / 255, 14 / 255);
const EMBLEMA = path.join(process.cwd(), "public/icons/mppd-180.png");

/** Las fuentes estándar de PDF solo traen caracteres latinos: se reemplaza lo demás. */
function limpiar(texto: string): string {
  return texto
    .replace(/[\r\t]/g, " ")
    .replace(/[^\n\x20-\x7E\xA0-\xFF–—‘’“”•€]/g, "?");
}

function partir(texto: string, fuente: PDFFont, tamano: number, ancho: number): string[] {
  const lineas: string[] = [];
  for (const parrafo of limpiar(texto).split("\n")) {
    let linea = "";
    for (const palabra of parrafo.split(" ")) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (fuente.widthOfTextAtSize(prueba, tamano) <= ancho) linea = prueba;
      else {
        if (linea) lineas.push(linea);
        linea = palabra;
      }
    }
    lineas.push(linea);
  }
  return lineas;
}

async function cargarImagen(pdf: PDFDocument, url: string | null): Promise<PDFImage | null> {
  const ruta = rutaDeUrl(url);
  if (!ruta) return null;
  try {
    const bytes = await readFile(ruta);
    const tipo = tipoImagen(bytes);
    if (tipo?.extension === "png") return await pdf.embedPng(bytes);
    if (tipo?.extension === "jpg") return await pdf.embedJpg(bytes);
  } catch {
    // Si la imagen ya no existe, el récipe sale sin ella.
  }
  return null;
}

/** Ajusta una imagen dentro de una caja conservando su proporción. */
function encajar(img: PDFImage, anchoMax: number, altoMax: number) {
  const escala = Math.min(anchoMax / img.width, altoMax / img.height, 1);
  return { width: img.width * escala, height: img.height * escala };
}

export async function generarPdfReceta(receta: RecetaCompleta): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const medicoNombre = conGrado(nombreCompleto(receta.medico.personal), receta.medico.personal.grado);
  pdf.setTitle(`Récipe N° ${receta.numero} - ${nombreCompleto(receta.paciente)}`);
  pdf.setAuthor(medicoNombre);

  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const [logo, firma, sello] = await Promise.all([
    cargarImagen(pdf, receta.medico.logoUrl),
    cargarImagen(pdf, receta.medico.firmaUrl),
    cargarImagen(pdf, receta.medico.selloUrl),
  ]);
  // Emblema institucional del MPPD (arte original, sin recolorear).
  const emblema = await readFile(EMBLEMA).then((b) => pdf.embedPng(b)).catch(() => null);

  let pagina: PDFPage;
  let y = 0;

  const texto = (t: string, x: number, yy: number, opciones: { fuente?: PDFFont; tamano?: number; color?: typeof TINTA } = {}) =>
    pagina.drawText(limpiar(t), { x, y: yy, font: opciones.fuente ?? normal, size: opciones.tamano ?? 9, color: opciones.color ?? TINTA });

  const centro = process.env.CENTRO_NOMBRE;
  const especialidades = receta.medico.especialidades.map((e) => e.nombre).join(" · ");
  const credenciales = [receta.medico.numeroColegio && `COL ${receta.medico.numeroColegio}`, `MPPS ${receta.medico.numeroMpps}`]
    .filter(Boolean)
    .join("  ·  ");

  function nuevaPagina() {
    pagina = pdf.addPage([ANCHO, ALTO]);
    y = ALTO - MARGEN;

    // Encabezado con la identidad del médico.
    let x = MARGEN;
    if (logo) {
      const t = encajar(logo, 54, 54);
      pagina.drawImage(logo, { x, y: y - t.height, ...t });
      x += t.width + 10;
    }
    texto(medicoNombre, x, y - 12, { fuente: negrita, tamano: 13 });
    let yy = y - 25;
    for (const linea of [especialidades, credenciales, centro].filter(Boolean) as string[]) {
      texto(linea, x, yy, { tamano: 8, color: SUAVE });
      yy -= 11;
    }
    const derecha = (t: string, yy2: number, fuente: PDFFont, tamano: number, color = TINTA) =>
      texto(t, ANCHO - MARGEN - fuente.widthOfTextAtSize(limpiar(t), tamano), yy2, { fuente, tamano, color });
    if (emblema) pagina.drawImage(emblema, { x: ANCHO - MARGEN - 34, y: y - 34, width: 34, height: 34 });
    derecha("ORIGINAL", y - 46, negrita, 8, ACENTO);
    derecha(`N° ${receta.numero}`, y - 57, normal, 8, SUAVE);

    y = Math.min(yy, y - 58) - 6;
    pagina.drawLine({ start: { x: MARGEN, y }, end: { x: ANCHO - MARGEN, y }, thickness: 1, color: ACENTO });
    y -= 16;
  }

  function asegurar(alto: number) {
    if (y - alto < PIE) nuevaPagina();
  }

  nuevaPagina();

  // Datos del paciente.
  const p = receta.paciente;
  texto("Paciente:", MARGEN, y, { fuente: negrita });
  texto(nombreCompleto(p), MARGEN + 46, y);
  y -= 13;
  const datosPaciente = [p.cedula && `C.I. ${p.cedula}`, `${edad(p.fechaNacimiento, receta.fecha)} años`].filter(Boolean).join("   ·   ");
  texto(datosPaciente, MARGEN, y, { color: SUAVE });
  y -= 13;
  texto(`Fecha: ${fechaLarga(receta.fecha)}`, MARGEN, y, { color: SUAVE });
  y -= 26;

  texto("Rp/", MARGEN, y, { fuente: negrita, tamano: 16, color: ACENTO });
  y -= 22;

  // Medicamentos numerados con su posología.
  receta.items.forEach((item, i) => {
    const titulo = partir(`${i + 1}. ${nombreItem(item)}${item.cantidad ? `  —  Cant.: ${item.cantidad}` : ""}`, negrita, 10, UTIL);
    const lineasPosologia = partir(posologia(item), normal, 9.5, UTIL - 12);
    const nota = item.indicaciones ? partir(item.indicaciones, normal, 8.5, UTIL - 12) : [];
    asegurar(titulo.length * 13 + lineasPosologia.length * 12 + nota.length * 11 + 10);

    for (const l of titulo) {
      texto(l, MARGEN, y, { fuente: negrita, tamano: 10 });
      y -= 13;
    }
    for (const l of lineasPosologia) {
      texto(l, MARGEN + 12, y, { tamano: 9.5 });
      y -= 12;
    }
    for (const l of nota) {
      texto(l, MARGEN + 12, y, { tamano: 8.5, color: SUAVE });
      y -= 11;
    }
    y -= 8;
  });

  if (receta.indicacionesGenerales) {
    const lineas = partir(receta.indicacionesGenerales, normal, 9, UTIL);
    asegurar(lineas.length * 12 + 20);
    y -= 4;
    texto("Indicaciones", MARGEN, y, { fuente: negrita });
    y -= 13;
    for (const l of lineas) {
      texto(l, MARGEN, y);
      y -= 12;
    }
  }

  // Pie: firma y sello sobre la línea, en la última página.
  const base = 44;
  const centroX = ANCHO - MARGEN - 90;
  if (sello) {
    const t = encajar(sello, 76, 76);
    // A la izquierda de la firma, sin taparla.
    pagina!.drawImage(sello, { x: centroX - 80 - t.width - 6, y: base - 10, ...t, opacity: 0.9 });
  }
  if (firma) {
    const t = encajar(firma, 140, 56);
    pagina!.drawImage(firma, { x: centroX - t.width / 2, y: base + 6, ...t });
  }
  pagina!.drawLine({ start: { x: centroX - 80, y: base }, end: { x: centroX + 80, y: base }, thickness: 0.6, color: SUAVE });
  const centrar = (t: string, yy: number, fuente: PDFFont, tamano: number) =>
    texto(t, centroX - fuente.widthOfTextAtSize(limpiar(t), tamano) / 2, yy, { fuente, tamano });
  centrar(medicoNombre, base - 11, negrita, 8.5);
  centrar(credenciales, base - 21, normal, 7.5);

  const direccion = [process.env.CENTRO_DIRECCION, process.env.CENTRO_RIF && `RIF ${process.env.CENTRO_RIF}`]
    .filter(Boolean)
    .join("  ·  ");
  if (direccion) texto(direccion, MARGEN, 20, { tamano: 7, color: SUAVE });
  texto("Ministerio del Poder Popular para la Defensa · Venezuela", MARGEN, 11, { tamano: 7, color: SUAVE });

  return pdf.save();
}
