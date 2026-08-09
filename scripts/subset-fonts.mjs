/**
 * Genera los subsets de public/fonts/ a partir de las fuentes originales.
 *
 * Por qué existe. `@fontsource-variable/*` declara un `@font-face` por subset con su
 * `unicode-range`, y el navegador descarga el que necesite. El símbolo del colón
 * (**₡**, U+20A1) vive en `latin-ext`, así que **cada precio de la tienda arrastraba el
 * subset latin-ext entero**: 83 KB de Inter y 15 KB de Sora, casi 99 KB por un glifo.
 *
 * Un solo archivo por familia con latín + español + monedas resuelve las dos cosas:
 * elimina esos 99 KB y baja de cuatro peticiones de fuente a dos.
 *
 * Si algún glifo llegara a faltar no se rompe nada: el fallback de CSS es por carácter,
 * así que ese carácter suelto se pinta con la familia siguiente de la pila.
 *
 * Uso:
 *   node scripts/subset-fonts.mjs <carpeta-con-Inter.ttf-y-Sora.ttf>
 *   node scripts/subset-fonts.mjs --check     # solo verifica la cobertura actual
 *
 * Las originales no viven en el repo. Se bajan de:
 *   https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf
 *   https://github.com/google/fonts/raw/main/ofl/sora/Sora%5Bwght%5D.ttf
 */

import fs from "node:fs";
import path from "node:path";
import subsetFont from "subset-font";
import * as fontkit from "fontkit";

const FONTS_DIR = path.join(process.cwd(), "public", "fonts");

const expand = (ranges) =>
  ranges
    .flatMap(([from, to]) => {
      const out = [];
      for (let cp = from; cp <= to; cp++) out.push(String.fromCodePoint(cp));
      return out;
    })
    .join("");

const ASCII = [[0x0020, 0x007e]];
const LATIN1 = [[0x00a0, 0x00ff]]; // acentos, ñ, ¿ ¡ º ª ° « »
const OCCIDENTE = [
  [0x0152, 0x0153], [0x0160, 0x0161], [0x0178, 0x0178],
  [0x017d, 0x017e], [0x0192, 0x0192], [0x02c6, 0x02c7], [0x02da, 0x02dc],
];
const PUNTUACION = [
  [0x2010, 0x2015], [0x2018, 0x201e], [0x2020, 0x2022],
  [0x2026, 0x2026], [0x2030, 0x2030], [0x2039, 0x203a], [0x2044, 0x2044],
];
const MONEDAS = [[0x20a0, 0x20bf]]; // acá vive el ₡ (U+20A1)
const SIMBOLOS = [
  [0x2113, 0x2113], [0x2122, 0x2122], [0x2190, 0x2193],
  [0x2605, 0x2606], [0x2713, 0x2714], [0x2726, 0x2727],
  [0x25a0, 0x25a0], [0x25cf, 0x25cf], [0x2022, 0x2022],
];
const LATIN_EXT_A = [[0x0100, 0x017f]]; // Č ł Ń Ő Ř Ș Ț Ū Ż…

/**
 * Cobertura amplia a propósito: los nombres y descripciones de producto vienen de
 * Bilbildin y lo que teclea el cliente en el checkout tampoco se puede predecir.
 */
const COBERTURA = expand([
  ...ASCII, ...LATIN1, ...OCCIDENTE, ...PUNTUACION,
  ...MONEDAS, ...SIMBOLOS, ...LATIN_EXT_A,
]);

const OBJETIVOS = [
  {
    salida: "inter-var.woff2",
    original: "Inter.ttf",
    // Eje `opsz` fijo en su valor por defecto: es lo que ya hacía fontsource con
    // su archivo `-wght-`, así que el dibujo no cambia, pero dejar el eje óptico
    // completo costaba 34 KB de más.
    ejes: { wght: { min: 300, max: 800 }, opsz: { min: 14, max: 14 } },
    exigeColon: true,
  },
  {
    salida: "sora-var.woff2",
    original: "Sora.ttf",
    ejes: { wght: { min: 300, max: 800 } },
    // Sora no trae el glifo del colón en ninguna versión. Las cifras se pintan con
    // Inter (--font-body); si alguna vez cae en un título, el fallback por carácter
    // lo resuelve.
    exigeColon: false,
  },
];

/** Lo mínimo que toda fuente del sitio debe poder pintar, incluido el colón. */
const IMPRESCINDIBLE =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" +
  "áéíóúüñÁÉÍÓÚÜÑ¿¡.,:;!?()-–—…·%&@/";

function verificar() {
  let fallos = 0;
  for (const { salida, exigeColon } of OBJETIVOS) {
    const ruta = path.join(FONTS_DIR, salida);
    if (!fs.existsSync(ruta)) {
      console.error(`  FALTA  ${salida}`);
      fallos++;
      continue;
    }

    const cubiertos = new Set(fontkit.openSync(ruta).characterSet);
    const exigido = IMPRESCINDIBLE + (exigeColon ? "₡" : "");
    const faltan = [...new Set(exigido)].filter(
      (ch) => !cubiertos.has(ch.codePointAt(0)),
    );

    if (faltan.length) {
      fallos++;
      console.error(`  FALLA  ${salida.padEnd(20)} faltan: ${faltan.join("")}`);
    } else {
      console.log(
        `  OK     ${salida.padEnd(20)} ${String(cubiertos.size).padStart(4)} codepoints` +
          ` · ${(fs.statSync(ruta).size / 1024).toFixed(1).padStart(5)} KB` +
          (exigeColon ? " · ₡ presente" : " · sin ₡ (no lo trae la fuente)"),
      );
    }
  }
  return fallos;
}

if (process.argv.includes("--check")) {
  console.log("Verificando cobertura de public/fonts/\n");
  process.exit(verificar() === 0 ? 0 : 1);
}

const origenes = process.argv[2];
if (!origenes) {
  console.error("Uso: node scripts/subset-fonts.mjs <carpeta-con-los-originales>");
  console.error("     node scripts/subset-fonts.mjs --check");
  process.exit(1);
}

fs.mkdirSync(FONTS_DIR, { recursive: true });

for (const { salida, original, ejes } of OBJETIVOS) {
  const entrada = path.join(origenes, original);
  if (!fs.existsSync(entrada)) {
    console.warn(`  omitido (sin original): ${salida}`);
    continue;
  }

  const antes = fs.readFileSync(entrada);
  const despues = await subsetFont(antes, COBERTURA, {
    targetFormat: "woff2",
    ...(ejes ? { variationAxes: ejes } : {}),
  });
  fs.writeFileSync(path.join(FONTS_DIR, salida), despues);
  console.log(
    `  ${salida.padEnd(20)} ${(antes.length / 1024).toFixed(1).padStart(7)} KB` +
      ` -> ${(despues.length / 1024).toFixed(1).padStart(6)} KB`,
  );
}

console.log("\nVerificación:\n");
process.exit(verificar() === 0 ? 0 : 1);
