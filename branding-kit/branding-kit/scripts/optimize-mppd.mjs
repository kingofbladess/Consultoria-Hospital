// Optimiza el emblema del MPPD: assets/brand/mppd.png (432×577) → public/icons/.
// Uso: pnpm mppd:optimize (re-ejecutar si cambia la fuente).
//
// Cada AVIF de interfaz es 2× de la altura CSS en la que se pinta (pantalla
// densa). El adorno del detalle ya pide más píxeles de los que tiene la
// fuente —la tarjeta llega a ~135 % de su alto—, así que ese archivo se
// deja al tamaño nativo y no se agranda.
//
// Destino configurable: node optimize-mppd.mjs [--public <dir>] [--assets <dir>] (por omisión, <kit>/public).
//
// Favicon y apple-touch siguen en PNG: Safari no usa AVIF en esos huecos.
// Van en un cuadrado con el emblema contenido, sin recortar el retrato.

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
const SOURCE = path.resolve(arg("assets") ?? path.join(ROOT, "assets/brand"), "mppd.png");
const OUTPUT_DIR = path.resolve(arg("public") ?? path.join(ROOT, "public"), "icons");

// 4:4:4: el emblema es gráfico (oro, rojo, azul), no una foto. El submuestreo
// ensucia el filo de las cintas.
const AVIF = { effort: 6, chromaSubsampling: "4:4:4" };

const VARIANTS = [
  // Barra lateral y barra móvil: caja h-7 (28 px). 2× → alto 56.
  { file: "mppd-28.avif", height: 56, quality: 68 },
  // Login: el emblema se pinta a 72 px de alto dentro del disco. 2× → alto 144.
  { file: "mppd-72.avif", height: 144, quality: 65 },
  // Adorno del detalle del visitante. Tope de la fuente.
  { file: "mppd.avif", height: 577, quality: 55 },
];

const ICONS = [
  { file: "mppd-32.png", size: 32 },
  { file: "mppd-180.png", size: 180 },
];

const sourceStat = await fs.stat(SOURCE);
const master = sharp(SOURCE);
const meta = await master.metadata();
if (meta.width !== 432 || meta.height !== 577) {
  throw new Error(`La fuente cambió de medida (${meta.width}×${meta.height}); revisa las alturas de VARIANTS.`);
}

await fs.mkdir(OUTPUT_DIR, { recursive: true });

let after = 0;

for (const variant of VARIANTS) {
  const image = sharp(SOURCE).resize({
    height: variant.height,
    kernel: "lanczos3",
    withoutEnlargement: true,
  });
  const encoded = await image.avif({ ...AVIF, quality: variant.quality }).toBuffer({ resolveWithObject: true });
  await fs.writeFile(path.join(OUTPUT_DIR, variant.file), encoded.data);
  after += encoded.data.length;
  console.log(
    `${variant.file.padEnd(16)} ${String(encoded.info.width).padStart(4)}×${encoded.info.height}  q${variant.quality}  ${encoded.data.length} B`,
  );
}

for (const icon of ICONS) {
  const encoded = await sharp(SOURCE)
    .resize({
      width: icon.size,
      height: icon.size,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: "lanczos3",
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await fs.writeFile(path.join(OUTPUT_DIR, icon.file), encoded);
  after += encoded.length;
  console.log(`${icon.file.padEnd(16)} ${icon.size}×${icon.size}  png  ${encoded.length} B`);
}

console.log(`\nPNG fuente ${sourceStat.size} B → derivados ${after} B`);
