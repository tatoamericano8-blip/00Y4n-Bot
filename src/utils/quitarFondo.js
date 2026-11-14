import sharp from 'sharp';

/**
 * Quita fondos sólidos con flood-fill desde bordes (no toca interior).
 * Redondeo de esquinas opcional (default semicírculo).
 */

function dist(r, g, b, tr, tg, tb) {
  const dr = r - tr;
  const dg = g - tg;
  const db = b - tb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function matchesBg(r, g, b, targets, tolerancia) {
  for (const [tr, tg, tb] of targets) {
    if (dist(r, g, b, tr, tg, tb) <= tolerancia) return true;
  }
  return false;
}

export async function redondearEsquinas(input, radio = null) {
  const meta = await sharp(input).metadata();
  const width = meta.width;
  const height = meta.height;
  let r = radio != null ? Number(radio) : Math.floor(Math.min(width, height) / 2);
  r = Math.max(0, Math.min(r, Math.floor(Math.min(width, height) / 2)));
  if (r <= 0) {
    return sharp(input).png().toBuffer();
  }
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}">` +
      `<rect x="0" y="0" width="${width}" height="${height}" rx="${r}" ry="${r}" fill="#fff"/>` +
      `</svg>`
  );
  return sharp(input)
    .ensureAlpha()
    .composite([{ input: svg, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/**
 * @param {Buffer} input
 * @param {{ modo?: 'auto'|'blanco'|'negro', tolerancia?: number, redondear?: boolean, radio?: number|null }} opts
 */
export async function quitarFondoSolido(input, opts = {}) {
  const modo = opts.modo || 'auto';
  const tolerancia = Math.min(140, Math.max(5, Number(opts.tolerancia) || 28));
  const redondear = opts.redondear !== false;
  const radio = opts.radio != null ? Number(opts.radio) : null;

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

  const visited = new Uint8Array(width * height);
  const queue = [];

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * channels;
    if (!matchesBg(data[i], data[i + 1], data[i + 2], targets, tolerancia)) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < width; x++) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (queue.length) {
    const idx = queue.pop();
    const x = idx % width;
    const y = (idx / width) | 0;
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }

  const out = Buffer.from(data);
  for (let idx = 0; idx < visited.length; idx++) {
    if (visited[idx]) out[idx * channels + 3] = 0;
  }

  let buf = await sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
  if (redondear) {
    buf = await redondearEsquinas(buf, radio);
  }
  return buf;
}

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
