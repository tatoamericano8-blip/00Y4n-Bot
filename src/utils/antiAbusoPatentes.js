/**
 * Anti-abuso del sistema de matriculación SWFL.
 */

const cooldownRegistro = new Map(); // userId -> timestamp último registro
const registrosHoy = new Map(); // `${userId}:${dia}` -> count

const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutos entre registros
const MAX_POR_DIA = 6;

const PALABRAS_BLOQUEADAS = [
  'admin', 'mod', 'staff', 'nazi', 'hitler', 'puto', 'puta', 'mierda',
  'verga', 'pito', 'coon', 'fag', 'nigga', 'nigger', 'kill yourself',
  'discord.gg', 'http://', 'https://', 'www.', '.com', '.gg',
  '00y4n staff', 'alto mando', 'owner', 'fundador'
];

function normalizar(txt) {
  return String(txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function contienePalabraBloqueada(...campos) {
  const texto = campos.map(normalizar).join(' ');
  for (const p of PALABRAS_BLOQUEADAS) {
    if (texto.includes(normalizar(p))) {
      return p;
    }
  }
  return null;
}

export function patenteValida(patente) {
  const p = String(patente || '').toUpperCase().trim();
  if (p.length < 3 || p.length > 8) return { ok: false, motivo: 'La matrícula debe tener entre 3 y 8 caracteres.' };
  if (!/^[A-Z0-9]+$/.test(p)) {
    return { ok: false, motivo: 'La matrícula solo puede tener letras y números (sin espacios ni símbolos).' };
  }
  if (/^(.)\1{4,}$/.test(p)) {
    return { ok: false, motivo: 'La matrícula no puede ser una secuencia repetida (ej: AAAAAA).' };
  }
  return { ok: true, patente: p };
}

function keyDia(userId) {
  const d = new Date();
  return `${userId}:${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

export function checkCooldownYLimite(userId) {
  const ahora = Date.now();
  const ultimo = cooldownRegistro.get(userId) || 0;
  const restante = COOLDOWN_MS - (ahora - ultimo);
  if (restante > 0) {
    const seg = Math.ceil(restante / 1000);
    return {
      ok: false,
      motivo: `Esperá **${seg}s** antes de registrar otro vehículo (anti-spam).`
    };
  }

  const k = keyDia(userId);
  const count = registrosHoy.get(k) || 0;
  if (count >= MAX_POR_DIA) {
    return {
      ok: false,
      motivo: `Límite diario de registros alcanzado (**${MAX_POR_DIA}/día**). Probá mañana.`
    };
  }

  return { ok: true };
}

export function marcarRegistroExitoso(userId) {
  cooldownRegistro.set(userId, Date.now());
  const k = keyDia(userId);
  registrosHoy.set(k, (registrosHoy.get(k) || 0) + 1);
}

export function validarRegistroVehiculo(userId, { marca, modelo, anio, color, patente }) {
  const lim = checkCooldownYLimite(userId);
  if (!lim.ok) return lim;

  const pat = patenteValida(patente);
  if (!pat.ok) return pat;

  const bloqueada = contienePalabraBloqueada(marca, modelo, anio, color, patente);
  if (bloqueada) {
    return {
      ok: false,
      motivo: 'Uno de los campos contiene texto no permitido. Revisá marca, modelo, color o patente.'
    };
  }

  if (String(marca).length > 40 || String(modelo).length > 40 || String(color).length > 30) {
    return { ok: false, motivo: 'Marca/modelo/color demasiado largos.' };
  }

  const anioNum = parseInt(anio, 10);
  if (!Number.isNaN(anioNum) && (anioNum < 1900 || anioNum > 2035)) {
    return { ok: false, motivo: 'El año del vehículo no es válido.' };
  }

  return { ok: true, patente: pat.patente };
}
