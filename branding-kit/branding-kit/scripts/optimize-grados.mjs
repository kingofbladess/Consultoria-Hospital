// Optimiza las insignias de grado militar: assets/grados/*.png → public/grados/
// {CODIGO}.webp, y genera lib/military/grade-insignia-manifest.ts con
// sus medidas. Uso: pnpm grados:optimize (re-ejecutar al agregar o cambiar una).
//
// Destino configurable (por omisión, el de un proyecto Next.js; un monorepo lo cambia):
//   node optimize-grados.mjs --public <dir> --manifest <archivo.ts> [--assets <dir>]
// El CÓDIGO de cada archivo es la ABREVIATURA oficial sin barra (S/A → SA, C/N → CN):
// ver assets/grados/indice.csv. No es el código del catálogo ni el nivel.
//
// Solo WebP: a este tamaño AVIF no pesa menos (medido: 113 KB AVIF vs 108 KB
// WebP para las 23) y WebP decodifica más rápido en imágenes chicas.
//
// Todas las fuentes comparten el mismo lienzo (525×120) y el arte cambia de
// ancho: una barra (S2) ocupa 46 px, los cuatro soles (GJ) casi todo. Se
// recorta cada imagen a su arte en horizontal y se conserva el alto completo
// del lienzo, que todas llenan: así, mostradas a la misma altura, una estrella
// del capitán mide lo mismo que la del primer teniente.

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
const SOURCE_DIR = path.resolve(arg("assets") ?? path.join(ROOT, "assets/grados"));
const OUTPUT_DIR = path.resolve(arg("public") ?? path.join(ROOT, "public"), "grados");
const MANIFEST = path.resolve(arg("manifest") ?? path.join(ROOT, "lib/military/grade-insignia-manifest.ts"));

// 2× de la mayor altura en la que se muestran (36 px) para pantallas densas.
const OUTPUT_HEIGHT = 72;
// Píxeles con alfa por debajo de esto cuentan como lienzo vacío (halo del
// antialias).
const ALPHA_THRESHOLD = 8;
// Aire a cada lado del arte, en píxeles de la fuente, para no cortar el halo.
const SIDE_PADDING = 2;

async function horizontalBounds(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width;
  let right = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > ALPHA_THRESHOLD) {
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (right < 0) throw new Error(`${path.basename(file)} no tiene arte visible`);
  left = Math.max(0, left - SIDE_PADDING);
  right = Math.min(info.width - 1, right + SIDE_PADDING);
  return { left, width: right - left + 1, height: info.height };
}

const files = (await fs.readdir(SOURCE_DIR)).filter((f) => f.toLowerCase().endsWith(".png")).sort();
await fs.mkdir(OUTPUT_DIR, { recursive: true });

const manifest = {};
let before = 0;
let after = 0;

for (const file of files) {
  const code = path.basename(file, path.extname(file)).toUpperCase();
  const source = path.join(SOURCE_DIR, file);
  const { left, width, height } = await horizontalBounds(source);

  const cropped = sharp(source)
    .extract({ left, top: 0, width, height })
    .resize({ height: OUTPUT_HEIGHT, kernel: "lanczos3" });

  const webp = await cropped
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toBuffer({ resolveWithObject: true });
  await fs.writeFile(path.join(OUTPUT_DIR, `${code}.webp`), webp.data);

  manifest[code] = { width: webp.info.width, height: webp.info.height };
  before += (await fs.stat(source)).size;
  after += webp.data.length;
  console.log(`${code.padEnd(6)} ${String(webp.info.width).padStart(4)}×${webp.info.height}  ${webp.data.length} B`);
}

const entries = Object.entries(manifest)
  .map(([code, { width, height }]) => `  ${JSON.stringify(code)}: { width: ${width}, height: ${height} },`)
  .join("\n");

await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
await fs.writeFile(
  MANIFEST,
  `// Generado por docs/branding-kit/scripts/optimize-grados.mjs — no editar a mano.
// Medidas (px) de public/grados/{CODIGO}.webp tras recortar el lienzo.

export const GRADE_INSIGNIA_SIZES = {
${entries}
} as const satisfies Record<string, { width: number; height: number }>;

export type GradeInsigniaCode = keyof typeof GRADE_INSIGNIA_SIZES;
`,
);

console.log(`\n${files.length} insignias · PNG ${before} B → WebP ${after} B`);
