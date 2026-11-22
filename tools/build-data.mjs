// Genera data/bundle.js a partir de los JSON de data/.
// Uso: node tools/build-data.mjs   (desde la carpeta web/)
// El bundle permite abrir index.html con doble clic (file://), donde fetch() de JSON no funciona.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'data');
const out = {};
for (const f of readdirSync(dataDir).filter(f => f.endsWith('.json')).sort()) {
  const key = f.replace(/\.json$/, '');
  try { out[key] = JSON.parse(readFileSync(join(dataDir, f), 'utf8')); }
  catch (e) { console.error(`ERROR en ${f}: ${e.message}`); process.exit(1); }
}
const stamp = new Date().toISOString();
writeFileSync(join(dataDir, 'bundle.js'),
  `/* Generado automáticamente por tools/build-data.mjs el ${stamp}. NO editar a mano: edita los .json y vuelve a ejecutar el script. */\nwindow.APP_DATA = ${JSON.stringify(out)};\nwindow.APP_DATA_BUILD = ${JSON.stringify(stamp)};\n`);
console.log(`bundle.js generado con: ${Object.keys(out).join(', ')}`);
