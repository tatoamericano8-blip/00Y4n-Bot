import { EmbedBuilder } from 'discord.js';
import { getFromDb, setInDb } from './database.js';

export const ROL_WARRANT_ID = '1529152491545952316';
const KEY_MULTAS = 'multas:globales';
export const DIAS_PARA_PAGAR = 7;
const SIETE_DIAS_MS = DIAS_PARA_PAGAR * 24 * 60 * 60 * 1000;

export const multasDB = new Map();

export async function obtenerTodasLasMultas() {
  return (await getFromDb(KEY_MULTAS, {})) || {};
}

export async function obtenerMulta(ticketId) {
  const multas = await obtenerTodasLasMultas();
  return multas[String(ticketId)] || multas[ticketId] || null;
}

export async function guardarMulta(ticketId, datosMulta) {
  const multas = await obtenerTodasLasMultas();
  multas[String(ticketId)] = datosMulta;
  await setInDb(KEY_MULTAS, multas);
}

export async function guardarMultas() {
  return true;
}

export async function generarIDMulta() {
  const multas = await obtenerTodasLasMultas();
  const ids = Object.keys(multas)
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));
  const ultimoID = ids.length > 0 ? Math.max(...ids) : 0;
  return (ultimoID + 1).toString();
}

/** Fecha de vencimiento (7 días desde emisión). */
export function calcularVencimiento(fechaIso) {
  const base = fechaIso ? new Date(fechaIso).getTime() : Date.now();
  return new Date(base + SIETE_DIAS_MS).toISOString();
}

export function multaEstaVencida(ticket) {
  if (!ticket || ticket.estado !== 'PENDIENTE') return false;
  const vence = ticket.venceEn
    ? new Date(ticket.venceEn).getTime()
    : ticket.fecha
      ? new Date(ticket.fecha).getTime() + SIETE_DIAS_MS
      : 0;
  if (!vence) return false;
  return Date.now() >= vence;
}

/**
 * Compatibilidad: ya no usa setTimeout (se perdía en cada reinicio de Render).
 * El cron de ready.js llama a procesarMultasVencidas.
 */
export function programarWarrant(_client, _guildId, _usuarioId, _ticketId) {
  // no-op: persistencia + cron
}

/**
 * Revisa multas PENDIENTE vencidas (>7 días), asigna rol de orden de arresto y avisa por DM.
 * Idempotente: marca warrantAplicado para no repetir.
 */
export async function procesarMultasVencidas(client) {
  const multas = await obtenerTodasLasMultas();
  const entries = Object.entries(multas || {});
  let aplicadas = 0;

  for (const [id, ticket] of entries) {
    if (!ticket || ticket.estado !== 'PENDIENTE') continue;
    if (ticket.warrantAplicado === true) continue;
    if (!multaEstaVencida(ticket)) continue;

    const usuarioId = ticket.usuarioId || ticket.usuario_id;
    const guildId = ticket.guildId;
    if (!usuarioId || !guildId) continue;

    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) {
        console.warn(`[WARRANT] Guild ${guildId} no disponible (multa #${id})`);
        continue;
      }

      const miembro = await guild.members.fetch(usuarioId).catch(() => null);
      if (miembro && ROL_WARRANT_ID) {
        if (!miembro.roles.cache.has(ROL_WARRANT_ID)) {
          await miembro.roles.add(ROL_WARRANT_ID).catch((e) => {
            console.error(`[WARRANT] No se pudo dar rol a ${usuarioId}:`, e?.message || e);
          });
        }
      }

      try {
        const user = miembro?.user || (await client.users.fetch(usuarioId).catch(() => null));
        if (user) {
          const embed = new EmbedBuilder()
            .setColor('#ff3333')
            .setTitle('🚨 Orden de Arresto — Multa impaga')
            .setDescription(
              `Tu multa **#${id}** no fue abonada dentro de los **${DIAS_PARA_PAGAR} días**.\n\n` +
                `• **Infracción:** ${ticket.razon || '—'}\n` +
                `• **Monto:** $${Number(ticket.monto || 0).toLocaleString('es-AR')}\n` +
                `• **Estado:** Orden de Arresto activa\n\n` +
                `Pagá con \`/pagar-multa id:${id}\` lo antes posible. Al pagar se removerá la orden si no tenés otras multas vencidas.`
            )
            .setFooter({ text: 'Southwest Florida Comunidad 00Y4n — Departamento Policial' })
            .setTimestamp();
          await user.send({ embeds: [embed] });
        }
      } catch {
        console.log(`[WARRANT] No se pudo enviar DM al usuario ${usuarioId} (multa #${id})`);
      }

      ticket.warrantAplicado = true;
      ticket.warrantAplicadoEn = new Date().toISOString();
      multas[id] = ticket;
      aplicadas += 1;
      console.log(`[WARRANT] Orden aplicada por multa #${id} → usuario ${usuarioId}`);
    } catch (error) {
      console.error(`[WARRANT] Error procesando multa #${id}:`, error?.message || error);
    }
  }

  if (aplicadas > 0) {
    await setInDb(KEY_MULTAS, multas);
  }

  return aplicadas;
}

/** Multas de un usuario (más recientes primero) */
export async function obtenerMultasPorUsuario(usuarioId) {
  const multas = await obtenerTodasLasMultas();
  const arr = Array.isArray(multas) ? multas : Object.values(multas || {});
  return arr
    .filter((m) => String(m.usuarioId || m.usuario_id) === String(usuarioId))
    .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
}

/**
 * Tras pagar: si no quedan multas PENDIENTE vencidas, quitar warrant.
 */
export async function revisarWarrantTrasPago(member, usuarioId) {
  if (!member || !ROL_WARRANT_ID) return;
  if (!member.roles.cache.has(ROL_WARRANT_ID)) return;

  const propias = await obtenerMultasPorUsuario(usuarioId);
  const sigueDebiendoVencida = propias.some(
    (m) => m.estado === 'PENDIENTE' && multaEstaVencida(m)
  );
  if (!sigueDebiendoVencida) {
    await member.roles.remove(ROL_WARRANT_ID).catch(() => null);
  }
}
