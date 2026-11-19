// Optimiza los escudos de la FANB: assets/componentes/*.png → public/componentes/escudos/.
// Uso: pnpm componentes:optimize (re-ejecutar si cambia una fuente).
//   node optimize-componentes.mjs [--public <dir>] [--assets <dir>]   (por omisión, <kit>/public)
// Correspondencia con el catálogo de componentes: assets/componentes/indice.csv.
//
// Cada escudo se pinta en dos huecos y por eso salen dos AVIF:
// - marca en línea: KPI a 20 px (h-5), fila y ficha a 32 px (h-8). El archivo
//   es 2× del mayor (alto 64) y el KPI comparte ese archivo.
// - adorno refractado: hero a h-[135%] y sección militar a h-[125%]. El alto
//   útil en pantalla densa ronda los 800 px; no se agranda más porque el
//   vidrio lo desenfoca 7 px y las fuentes no dan para un 3×.
//
// El lienzo se recorta al arte (alfa) antes de redimensionar: el PNG del
// Ejército trae ~28 % de margen transparente y, al escalar por alto, su escudo
// salía más chico que los demás.
//
// 4:4:4: son gráficos (oro, rojo, azul), no fotos.

import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// `sharp` se busca desde el directorio de trabajo (el del proyecto que lo instala), no desde esta carpeta:
// así el kit funciona copiado a un proyecto Next y ejecutado desde un paquete de un monorepo.
const sharp = (await import(pathToFileURL(createRequire(path.join(process.cwd(), "_")).resolve("sharp")).href)).default;

const ROOT = path.resolve(import.meta.dirname, "..");
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const SOURCE_DIR = path.resolve(arg("assets") ?? path.join(ROOT, "assets/componentes"));
const OUTPUT_DIR = path.resolve(arg("public") ?? path.join(ROOT, "public"), "componentes/escudos");

// El PNG de la Guardia se llama guardia.png; la URL pública conserva
// guardia-nacional, que es lo que ya reconocen las pruebas.
const SHIELDS = [
  { file: "aviacion.png", slug: "aviacion" },
  { file: "armada.png", slug: "armada" },
  { file: "ejercito.png", slug: "ejercito" },
  { file: "guardia.png", slug: "guardia-nacional" },
];

const AVIF = { effort: 6, chromaSubsampling: "4:4:4" };
const MARK_HEIGHT = 64;
const BACKDROP_HEIGHT = 800;

await fs.mkdir(OUTPUT_DIR, { recursive: true });

let before = 0;
let after = 0;

for (const shield of SHIELDS) {
  const source = path.join(SOURCE_DIR, shield.file);
  before += (await fs.stat(source)).size;

  const variants = [
    { file: `${shield.slug}-32.avif`, height: MARK_HEIGHT, quality: 65 },
    { file: `${shield.slug}.avif`, height: BACKDROP_HEIGHT, quality: 50 },
  ];

  for (const variant of variants) {
    const encoded = await sharp(source)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
      .resize({ height: variant.height, kernel: "lanczos3", withoutEnlargement: true })
      .avif({ ...AVIF, quality: variant.quality })
      .toBuffer({ resolveWithObject: true });
    await fs.writeFile(path.join(OUTPUT_DIR, variant.file), encoded.data);
    after += encoded.data.length;
    console.log(
      `${variant.file.padEnd(28)} ${String(encoded.info.width).padStart(4)}×${encoded.info.height}  q${variant.quality}  ${encoded.data.length} B`,
    );
  }
}

console.log(`\nPNG fuente ${before} B → AVIF ${after} B`);
