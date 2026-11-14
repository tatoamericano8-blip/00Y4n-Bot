import sharp from 'sharp';

/**
 * Quita fondos sólidos con flood-fill acotado al borde.
 * Modo blanco exige casi-puro (#fff) para no comer cielo/metal/bote.
 */

function dist(r, g, b, tr, tg, tb) {
  const dr = r - tr;
  const dg = g - tg;
  const db = b - tb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Blanco de lienzo (no cielo, no metal).
 * tolerancia 5–100: a 12 ≈ min canal ≥ 249; a 22 ≈ ≥ 244; a 40 ≈ ≥ 235
 */
function esBlancoLienzo(r, g, b, tolerancia) {
  const minC = Math.min(r, g, b);
  const maxC = Math.max(r, g, b);
  const umbral = Math.max(230, 255 - Math.floor(tolerancia * 0.5));
  const delta = 8 + Math.floor(tolerancia / 6);
  return minC >= umbral && maxC - minC <= delta;
}

function esNegroLienzo(r, g, b, tolerancia) {
  const maxC = Math.max(r, g, b);
  const umbral = Math.min(40, Math.floor(tolerancia * 0.55));
  return maxC <= umbral;
}

function matchesBg(r, g, b, modo, targets, tolerancia) {
  if (modo === 'blanco') return esBlancoLienzo(r, g, b, tolerancia);
  if (modo === 'negro') return esNegroLienzo(r, g, b, tolerancia);
  // auto
  for (const [tr, tg, tb] of targets) {
    if (dist(r, g, b, tr, tg, tb) <= tolerancia * 0.85) {
      // si el target es claro, exigir también poca saturación
      const lum = (tr + tg + tb) / 3;
      if (lum > 200) return esBlancoLienzo(r, g, b, tolerancia);
      if (lum < 50) return esNegroLienzo(r, g, b, tolerancia);
      return true;
    }
  }
  if (esBlancoLienzo(r, g, b, tolerancia)) return true;
  if (esNegroLienzo(r, g, b, Math.max(8, tolerancia * 0.5))) return true;
  return false;
}

/** Qué tan “puro” es el match (0 = borderline, 1 = puro). */
function purezaBlanco(r, g, b) {
  const minC = Math.min(r, g, b);
  return Math.max(0, Math.min(1, (minC - 230) / 25));
}

export async function redondearEsquinas(input, radio = null) {
  const meta = await sharp(input).metadata();
  const width = meta.width;
  const height = meta.height;
  let r = radio != null ? Number(radio) : Math.floor(Math.min(width, height) / 2);
  r = Math.max(0, Math.min(r, Math.floor(Math.min(width, height) / 2)));
  if (r <= 0) return sharp(input).png().toBuffer();
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

function limpiarHalo(out, width, height, channels, modo, targets, tolerancia, pasadas = 2) {
  for (let p = 0; p < pasadas; p++) {
    const mark = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const i = idx * channels;
        if (out[i + 3] === 0) continue;
        let tocado = false;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            tocado = true;
            break;
          }
          if (out[(ny * width + nx) * channels + 3] === 0) {
            tocado = true;
            break;
          }
        }
        if (!tocado) continue;
        // solo limpia si sigue pareciendo lienzo (más estricto en halo)
        if (matchesBg(out[i], out[i + 1], out[i + 2], modo, targets, tolerancia + 6)) {
          mark[idx] = 1;
        } else if (modo === 'blanco' || modo === 'auto') {
          const minC = Math.min(out[i], out[i + 1], out[i + 2]);
          if (minC > 236) out[i + 3] = Math.min(out[i + 3], 60);
        }
      }
    }
    for (let idx = 0; idx < mark.length; idx++) {
      if (mark[idx]) out[idx * channels + 3] = 0;
    }
  }
}

/**
 * @param {Buffer} input
 * @param {{ modo?: 'auto'|'blanco'|'negro', tolerancia?: number, redondear?: boolean, radio?: number|null }} opts
 */
export async function quitarFondoSolido(input, opts = {}) {
  const modo = opts.modo || 'auto';
  const tolerancia = Math.min(100, Math.max(5, Number(opts.tolerancia) || 18));
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
      [2, 2],
      [width - 3, 2],
      [2, height - 3],
      [width - 3, height - 3],
      [Math.floor(width / 2), 2],
      [Math.floor(width / 2), height - 3],
      [2, Math.floor(height / 2)],
      [width - 3, Math.floor(height / 2)]
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
  }

  // Profundidad máxima desde el borde:
  // - píxeles casi #fff pueden ir más lejos (esquinas de banner redondeado)
  // - matches débiles solo cerca del borde (evita cielo → bote)
  const minSide = Math.min(width, height);
  const maxDepthDebil = Math.max(24, Math.floor(minSide * 0.06));
  const maxDepthPuro = Math.max(80, Math.floor(minSide * 0.22));

  const visited = new Uint8Array(width * height);
  const depthArr = new Int16Array(width * height);
  depthArr.fill(-1);
  const queue = [];

  const tryPush = (x, y, depth, fromPure) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (!matchesBg(r, g, b, modo, targets, tolerancia)) return;

    const pure =
      modo === 'negro'
        ? Math.max(r, g, b) <= 10
        : purezaBlanco(r, g, b) >= 0.75 || (Math.min(r, g, b) >= 252);

    const limit = pure || fromPure ? maxDepthPuro : maxDepthDebil;
    if (depth > limit) return;

    visited[idx] = 1;
    depthArr[idx] = depth;
    queue.push(idx);
  };

  for (let x = 0; x < width; x++) {
    tryPush(x, 0, 0, true);
    tryPush(x, height - 1, 0, true);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y, 0, true);
    tryPush(width - 1, y, 0, true);
  }

  // BFS (cola al inicio = profundidad creciente)
  let qh = 0;
  while (qh < queue.length) {
    const idx = queue[qh++];
    const x = idx % width;
    const y = (idx / width) | 0;
    const d = depthArr[idx];
    const i = idx * channels;
    const pure =
      modo === 'negro'
        ? Math.max(data[i], data[i + 1], data[i + 2]) <= 10
        : purezaBlanco(data[i], data[i + 1], data[i + 2]) >= 0.75 ||
          Math.min(data[i], data[i + 1], data[i + 2]) >= 252;
    tryPush(x + 1, y, d + 1, pure);
    tryPush(x - 1, y, d + 1, pure);
    tryPush(x, y + 1, d + 1, pure);
    tryPush(x, y - 1, d + 1, pure);
  }

  const out = Buffer.from(data);
  for (let idx = 0; idx < visited.length; idx++) {
    if (visited[idx]) out[idx * channels + 3] = 0;
  }

  limpiarHalo(out, width, height, channels, modo, targets, tolerancia, 2);

  let buf = await sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
  if (redondear) {
    buf = await redondearEsquinas(buf, radio);
    const raw2 = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const o2 = Buffer.from(raw2.data);
    limpiarHalo(o2, raw2.info.width, raw2.info.height, 4, modo, targets, tolerancia, 1);
    buf = await sharp(o2, {
      raw: { width: raw2.info.width, height: raw2.info.height, channels: 4 }
    })
      .png()
      .toBuffer();
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
