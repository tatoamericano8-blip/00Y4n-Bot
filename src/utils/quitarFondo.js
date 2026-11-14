import sharp from 'sharp';

/**
 * Quita fondos sólidos con flood-fill desde bordes + limpieza de halo.
 * No borra blancos interiores desconectados del borde.
 */

function dist(r, g, b, tr, tg, tb) {
  const dr = r - tr;
  const dg = g - tg;
  const db = b - tb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/** Blanco “de fondo”: alto brillo y poca saturación (evita faros / metal claro). */
function esBlancoFondo(r, g, b, tolerancia) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  // umbral de brillo baja un poco si tolerancia sube
  const umbral = Math.max(210, 255 - tolerancia * 1.2);
  return max >= umbral && sat <= 0.12 + tolerancia / 800;
}

function esNegroFondo(r, g, b, tolerancia) {
  const max = Math.max(r, g, b);
  const umbral = Math.min(45, 0 + tolerancia * 0.6);
  return max <= umbral;
}

function matchesBg(r, g, b, modo, targets, tolerancia) {
  if (modo === 'blanco') return esBlancoFondo(r, g, b, tolerancia);
  if (modo === 'negro') return esNegroFondo(r, g, b, tolerancia);
  // auto: targets de esquinas + reglas si son claros/oscuros
  for (const [tr, tg, tb] of targets) {
    if (dist(r, g, b, tr, tg, tb) <= tolerancia) return true;
  }
  const lum = (r + g + b) / 3;
  if (lum > 235) return esBlancoFondo(r, g, b, tolerancia);
  if (lum < 25) return esNegroFondo(r, g, b, tolerancia);
  return false;
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

/**
 * Dilata transparencia 1–2 px solo sobre píxeles casi-fondo (limpia halo).
 */
function limpiarHalo(out, width, height, channels, modo, targets, tolerancia, pasadas = 2) {
  for (let p = 0; p < pasadas; p++) {
    const mark = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const i = idx * channels;
        if (out[i + 3] === 0) continue;
        // ¿vecino transparente?
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
        if (matchesBg(out[i], out[i + 1], out[i + 2], modo, targets, tolerancia + 12)) {
          mark[idx] = 1;
        } else {
          // fringe suave: bajar alpha si es muy claro u oscuro
          const lum = (out[i] + out[i + 1] + out[i + 2]) / 3;
          if (modo === 'blanco' && lum > 200) {
            out[i + 3] = Math.min(out[i + 3], 90);
          } else if (modo === 'negro' && lum < 50) {
            out[i + 3] = Math.min(out[i + 3], 90);
          }
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
  // default más bajo → menos falsos positivos en metal/cielo claro
  const tolerancia = Math.min(100, Math.max(5, Number(opts.tolerancia) || 22));
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

  const visited = new Uint8Array(width * height);
  const queue = [];

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * channels;
    if (!matchesBg(data[i], data[i + 1], data[i + 2], modo, targets, tolerancia)) return;
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

  // Limpieza de halo / bordes residuales blancos
  limpiarHalo(out, width, height, channels, modo, targets, tolerancia, 2);

  let buf = await sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
  if (redondear) {
    buf = await redondearEsquinas(buf, radio);
    // segunda pasada ligera de halo tras redondear (anti-alias del mask)
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
