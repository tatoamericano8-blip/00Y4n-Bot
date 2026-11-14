import sharp from 'sharp';

/**
 * Quita fondos sólidos (blanco / negro / auto por esquinas) → PNG con transparencia.
 * Ideal para banners y logos con fondo liso. No reemplaza IA tipo remove.bg.
 */

function dist(r, g, b, tr, tg, tb) {
  const dr = r - tr;
  const dg = g - tg;
  const db = b - tb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * @param {Buffer} input
 * @param {{ modo?: 'auto'|'blanco'|'negro', tolerancia?: number }} opts
 * @returns {Promise<Buffer>}
 */
export async function quitarFondoSolido(input, opts = {}) {
  const modo = opts.modo || 'auto';
  const tolerancia = Math.min(140, Math.max(5, Number(opts.tolerancia) || 36));

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels < 4) throw new Error('Imagen inválida.');

  let targets = [];
  if (modo === 'blanco') {
    targets = [[255, 255, 255]];
  } else if (modo === 'negro') {
    targets = [[0, 0, 0]];
  } else {
    const pts = [
      [0, 0],
      [width - 1, 0],
      [0, height - 1],
      [width - 1, height - 1],
      [Math.floor(width / 2), 0],
      [Math.floor(width / 2), height - 1],
      [0, Math.floor(height / 2)],
      [width - 1, Math.floor(height / 2)]
    ];
    const samples = [];
    for (const [x, y] of pts) {
      const i = (y * width + x) * channels;
      samples.push([data[i], data[i + 1], data[i + 2]]);
    }
    const avg = samples
      .reduce((a, s) => [a[0] + s[0], a[1] + s[1], a[2] + s[2]], [0, 0, 0])
      .map((v) => Math.round(v / samples.length));
    targets = [avg];
    const lum = (avg[0] + avg[1] + avg[2]) / 3;
    if (lum > 200) targets.push([255, 255, 255]);
    if (lum < 45) targets.push([0, 0, 0]);
  }

  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += channels) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    for (const [tr, tg, tb] of targets) {
      if (dist(r, g, b, tr, tg, tb) <= tolerancia) {
        out[i + 3] = 0;
        break;
      }
    }
  }

  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/**
 * remove.bg (opcional). Env: REMOVE_BG_API_KEY
 */
export async function quitarFondoRemoveBg(input, apiKey) {
  const blob = new Blob([input], { type: 'image/png' });
  const form = new FormData();
  form.append('image_file', blob, 'image.png');
  form.append('size', 'auto');

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: form
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`remove.bg ${res.status}: ${t.slice(0, 180)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
