/**
 * Sistema de Licencia de Conducir SWFL (teorico + emision + tienda express)
 */
import Licencia from '../../models/Licencia.js';
import { restarSaldoExacto, obtenerSaldo } from './gestorEconomia.js';
import { logger } from './logger.js';

export const ROL_LICENCIA = '1529872838557962431';
export const CANAL_REGLAMENTO = '1540355602704764968';
export const PRECIO_EMISION = 5000;
export const EXAMEN_VALIDEZ_MS = 72 * 60 * 60 * 1000;
export const EXAMEN_COOLDOWN_MS = 12 * 60 * 60 * 1000;
export const EXAMEN_PREGUNTAS = 8;
export const EXAMEN_MIN_CORRECTAS = 6;

export const BANCO_PREGUNTAS = [
  { q: 'En que carril se debe circular de forma constante?', opciones: ['Carril izquierdo', 'Carril derecho', 'El que este mas vacio', 'El del medio si hay tres'], correcta: 1 },
  { q: 'Para que se usa el carril izquierdo segun la normativa?', opciones: ['Circular siempre', 'Estacionar', 'Solo para rebasar / adelantar', 'Solo emergencias'], correcta: 2 },
  { q: 'Que es la distancia por desync?', opciones: ['La distancia minima al spawn', 'Un margen de seguridad entre vehiculos para evitar choques por ping/latencia/wifi', 'La distancia maxima permitida en autopista', 'El espacio en el parking del meet'], correcta: 1 },
  { q: 'Si una unidad de emergencia viene con sirenas activas, que debes hacer?', opciones: ['Acelerar para no molestar', 'Ignorarla si vas en peacetime', 'Ceder el paso hacia la derecha y facilitar el paso', 'Frenar en medio del carril'], correcta: 2 },
  { q: 'Tras un accidente / colision, el protocolo indica:', opciones: ['Seguir de largo para no trabar el trafico', 'Orillar, activar luces de emergencia e interactuar roleando antes de reanudar', 'Solo escribir en el chat sorry y seguir', 'Desconectarse del juego'], correcta: 1 },
  { q: 'La licencia de conducir es obligatoria para entrar a una sesion?', opciones: ['Si, sin licencia no podes reaccionar al inicio', 'No es obligatoria, pero se recomienda para evitar multas graves o arrestos', 'Solo es obligatoria en Car Meets', 'Solo la necesitan los policias'], correcta: 1 },
  { q: 'Donde podes leer el reglamento oficial de manejo?', opciones: ['Solo en tickets', 'En el canal de reglamento de manejo del servidor', 'No existe reglamento escrito', 'Solo en el MDT policial'], correcta: 1 },
  { q: 'Conducir sin licencia en sesion puede derivar en:', opciones: ['Nada, es cosmetico', 'Solo un warn de Discord', 'Multas elevadas y posible orden de arresto / accion policial', 'Ban permanente automatico del bot'], correcta: 2 },
  { q: 'Al rebasar a otro vehiculo, lo correcto es:', opciones: ['Usar el carril izquierdo, adelantar y volver al derecho', 'Empujar al otro auto con el tuyo', 'Circular en contramano', 'Pitar hasta que se aparte'], correcta: 0 },
  { q: 'Si tu licencia esta Suspendida o Revocada:', opciones: ['Podes manejar igual sin consecuencias', 'No deberias conducir; la policia puede multarte o arrestarte', 'Solo vale en meets', 'Se reactiva sola a las 24 h'], correcta: 1 },
  { q: 'El objetivo de la normativa de manejo en 00Y4n es:', opciones: ['Cobrar mas multas nomas', 'Elevar el realismo y reducir colisiones innecesarias en sesion', 'Prohibir todos los vehiculos deportivos', 'Obligar a usar solo autos stock'], correcta: 1 },
  { q: 'Se puede comprar la licencia en la tienda sin rendir examen?', opciones: ['No, jamas', 'Si: es la via express (pagas y evitas la prueba teorica)', 'Solo con rango Staff', 'Solo los boosters'], correcta: 1 }
];

export function mezclarPreguntas(cantidad = EXAMEN_PREGUNTAS) {
  const copia = [...BANCO_PREGUNTAS];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, Math.min(cantidad, copia.length)).map((p, idx) => ({
    idx, q: p.q, opciones: p.opciones, correcta: p.correcta
  }));
}

export async function getLicencia(userId) {
  return Licencia.findOne({ usuario_id: String(userId) });
}

export async function asegurarLicenciaDoc(userId) {
  let doc = await getLicencia(userId);
  if (!doc) {
    doc = await Licencia.create({ usuario_id: String(userId), estado: 'Sin licencia' });
  }
  return doc;
}

export async function sincronizarRolLicencia(member, estado) {
  if (!member?.roles) return;
  const tiene = member.roles.cache.has(ROL_LICENCIA);
  try {
    if (estado === 'Activa' && !tiene) {
      await member.roles.add(ROL_LICENCIA, 'Licencia de conducir SWFL activa');
    } else if (estado !== 'Activa' && tiene) {
      await member.roles.remove(ROL_LICENCIA, `Licencia SWFL: ${estado}`);
    }
  } catch (e) {
    logger.warn(`[licencia] No se pudo sync rol: ${e.message}`);
  }
}

export async function registrarLicenciaPorCompra(userId, member = null) {
  const doc = await Licencia.findOneAndUpdate(
    { usuario_id: String(userId) },
    {
      estado: 'Activa',
      metodo: 'compra',
      fechaEmision: new Date(),
      fecha: new Date(),
      motivo: 'Emision express por compra en Server Tienda',
      examenAprobadoHasta: null,
      puntos: 12
    },
    { upsert: true, new: true }
  );
  if (member) await sincronizarRolLicencia(member, 'Activa');
  return doc;
}

export async function marcarExamenAprobado(userId, puntaje) {
  const hasta = new Date(Date.now() + EXAMEN_VALIDEZ_MS);
  return Licencia.findOneAndUpdate(
    { usuario_id: String(userId) },
    {
      $set: { examenAprobadoHasta: hasta, examenPuntaje: puntaje, examenCooldownHasta: null },
      $setOnInsert: { usuario_id: String(userId), estado: 'Sin licencia', puntos: 12 }
    },
    { upsert: true, new: true }
  );
}

export async function marcarExamenFallido(userId) {
  const hasta = new Date(Date.now() + EXAMEN_COOLDOWN_MS);
  return Licencia.findOneAndUpdate(
    { usuario_id: String(userId) },
    {
      $set: { examenCooldownHasta: hasta },
      $setOnInsert: { usuario_id: String(userId), estado: 'Sin licencia', puntos: 12 }
    },
    { upsert: true, new: true }
  );
}

export async function tramitarLicencia(userId, member) {
  const doc = await asegurarLicenciaDoc(userId);
  if (doc.estado === 'Activa') {
    return { ok: false, mensaje: 'Ya tenes la licencia **Activa**.' };
  }
  if (doc.estado === 'Suspendida' || doc.estado === 'Revocada') {
    return {
      ok: false,
      mensaje: `Tu licencia esta **${doc.estado}**. Debes resolverlo con el Departamento de Policia (no se tramita por aca).`
    };
  }
  const hasta = doc.examenAprobadoHasta ? new Date(doc.examenAprobadoHasta).getTime() : 0;
  if (!hasta || hasta < Date.now()) {
    return {
      ok: false,
      mensaje:
        `No tenes un examen aprobado vigente.\n` +
        `• Rinde con \`/licencia examen\`\n` +
        `• O compra la via express en \`/tienda abrir\` (Permisos y Seguros).`
    };
  }
  const saldo = await obtenerSaldo(userId);
  if (saldo < PRECIO_EMISION) {
    return {
      ok: false,
      mensaje: `Necesitas **$${PRECIO_EMISION.toLocaleString('es-AR')}** para la tasa de emision. Tenes **$${saldo.toLocaleString('es-AR')}**.`
    };
  }
  const cobro = await restarSaldoExacto(userId, PRECIO_EMISION, {
    tipo: 'EGRESO',
    motivo: 'Tasa emision licencia de conducir SWFL'
  });
  if (!cobro.ok) {
    return { ok: false, mensaje: 'No se pudo debitar el dinero. Intenta de nuevo.' };
  }
  doc.estado = 'Activa';
  doc.metodo = 'examen';
  doc.fechaEmision = new Date();
  doc.fecha = new Date();
  doc.motivo = 'Aprobo examen teorico y pago tasa de emision';
  doc.examenAprobadoHasta = null;
  doc.puntos = 12;
  await doc.save();
  if (member) await sincronizarRolLicencia(member, 'Activa');
  return { ok: true, doc };
}
