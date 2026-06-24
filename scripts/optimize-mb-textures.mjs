/**
 * Ottimizza un set curato di texture PBR dal prototipo (moodboard-3d/texture, gitignorato)
 * in public/mb-textures/<id>/{color,normal,rough}.jpg a 1024px (q80), per il moodboard 3D.
 * Uso: node scripts/optimize-mb-textures.mjs
 * Sorgenti = locali (non nel repo); output = leggero e committato.
 */
import sharp from 'sharp';
import { mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEX = join(ROOT, 'moodboard-3d', 'texture');
const OUT = join(ROOT, 'public', 'mb-textures');
const SIZE = 1024;
const Q = 80;

// [id, "categoria/Cartella_4K-JPG"]
const MATS = [
  ['leg-rovere', 'legno/Wood005_4K-JPG'],
  ['leg-parquet', 'legno/WoodFloor007_4K-JPG'],
  ['leg-doghe', 'legno/WoodSiding001_4K-JPG'],
  ['met-acciaio', 'metal/Metal034_4K-JPG'],
  ['met-spazzolato', 'metal/Metal047A_4K-JPG'],
  ['met-grezzo', 'metal/Metal063_4K-JPG'],
  ['pie-marmo', 'pavimenti e pietra/Marble012_4K-JPG'],
  ['pie-onice', 'pavimenti e pietra/Onyx013_4K-JPG'],
  ['pie-cemento', 'pavimenti e pietra/Concrete047A_4K-JPG'],
  ['pel-cuoio', 'pelle/Leather003_4K-JPG'],
  ['pel-nabuk', 'pelle/Leather026_4K-JPG'],
  ['tes-lino', 'tessuto/Fabric045_4K-JPG'],
  ['tes-boucle', 'tessuto/Fabric061_4K-JPG'],
  ['tes-velluto', 'tessuto/Fabric079_4K-JPG'],
];

const MAPS = [['Color', 'color'], ['NormalGL', 'normal'], ['Roughness', 'rough']];

const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

let ok = 0, miss = 0;
for (const [id, rel] of MATS) {
  const base = rel.split('/').pop(); // es. Wood005_4K-JPG
  const srcDir = join(TEX, rel);
  await mkdir(join(OUT, id), { recursive: true });
  for (const [suffix, outName] of MAPS) {
    const src = join(srcDir, `${base}_${suffix}.jpg`);
    const dst = join(OUT, id, `${outName}.jpg`);
    if (!(await exists(src))) { console.warn('MANCA', src); miss++; continue; }
    await sharp(src).resize(SIZE, SIZE, { fit: 'inside' }).jpeg({ quality: Q, mozjpeg: true }).toFile(dst);
    ok++;
  }
  console.log('✓', id);
}
console.log(`\nFatto: ${ok} mappe ottimizzate in ${OUT}${miss ? `, ${miss} mancanti` : ''}.`);
