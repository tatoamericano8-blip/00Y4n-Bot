import { EmbedBuilder } from 'discord.js';
import Staff from '../../models/Staff.js';
import { getFromDb, setInDb, deleteFromDb } from './database.js';
import { obtenerRangoDeUsuario } from './rangoStaff.js';
import { formatearHoras } from './formatearTiempo.js';
import { sesionesSemana } from './metasCuota.js';
import { calcularScore } from './scoreCuota.js';

const KEY = (guildId) => `staff:clasificacion:live:${guildId}`;
const TOP_MAX = 25;
const pendingTimers = new Map();
const ROL_STAFF = '1512120103771050005';

export async function guardarMensajeClasificacion(guildId, channelId, messageId) {
  await setInDb(KEY(guildId), {
    channelId: String(channelId),
    messageId: String(messageId),
    updatedAt: new Date().toISOString()
  });
}

export async function obtenerMensajeClasificacion(guildId) {
  const data = await getFromDb(KEY(guildId), null);
  if (!data || !data.channelId || !data.messageId) return null;
  return data;
}

export async function limpiarMensajeClasificacion(guildId) {
  await deleteFromDb(KEY(guildId));
}

export async function construirRankingSemanal(guild) {
  const guildId = guild.id;

  const listaStaff = await Staff.find({
    guildId,
    estado: { $nin: ['DESPEDIDO', 'RENUNCIADO'] }
  }).lean();

  if (!listaStaff.length) {
    return {
      filas: [],
      embed: new EmbedBuilder()
        .setColor('#74d4fc')
        .setTitle('Clasificación semanal de Staff')
        .setDescription('No hay miembros del Staff registrados en este servidor.')
        .setTimestamp()
    };
  }

  try {
    if (!guild.members.cache.size) {
      await guild.members.fetch().catch(() => null);
    }
  } catch (_) {}

  const listaActiva = [];
  for (const staff of listaStaff) {
    const member =
      guild.members.cache.get(staff.userId) ||
      (await guild.members.fetch(staff.userId).catch(() => null));
    if (!member) continue;
    if (!member.roles.cache.has(ROL_STAFF)) continue;
    listaActiva.push(staff);
  }

  if (!listaActiva.length) {
    return {
      filas: [],
      embed: new EmbedBuilder()
        .setColor('#74d4fc')
        .setTitle('Clasificación semanal de Staff')
        .setDescription('No hay staff activos en el servidor para mostrar en la clasificación.')
        .setTimestamp()
    };
  }

  const enriquecidos = await Promise.all(
    listaActiva.map(async (staff) => {
      const { rango } = await obtenerRangoDeUsuario(
        guild,
        staff.userId,
        staff.rango || 'Sin rango'
      );
      const cuotas = staff.cuotas || {};
      const host = Number(cuotas.sesionesOrganizadas) || 0;
      const sup = Number(cuotas.sesionesSupervisadas) || 0;
      const tickets = Number(cuotas.ticketsCerrados) || 0;
      const horas = Number(cuotas.horasServicio) || 0;
      const ses = sesionesSemana(cuotas);
      const score = calcularScore(cuotas, rango);
      const enLoa = staff.estado === 'LOA' || staff.loa?.activo === true;
      const racha = Number(staff.rachaActual) || Number(staff.racha) || 0;

      return {
        userId: staff.userId,
        rango,
        host,
        sup,
        tickets,
        horas,
        ses,
        score,
        enLoa,
        racha
      };
    })
  );

  enriquecidos.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.ses !== a.ses) return b.ses - a.ses;
    if (b.tickets !== a.tickets) return b.tickets - a.tickets;
    return b.horas - a.horas;
  });

  const top = enriquecidos.slice(0, TOP_MAX);
  const lineas = top.map((s, i) => {
    const pos = String(i + 1).padStart(2, ' ');
    const loa = s.enLoa ? ' · LOA' : '';
    const rachaTxt = s.racha > 0 ? ` · Racha ${s.racha}` : '';
    return (
      `**${pos}.** <@${s.userId}>\n` +
      `Score **${s.score}** · Host **${s.host}** · Sup **${s.sup}** · Tickets **${s.tickets}** · Tiempo **${formatearHoras(s.horas)}**\n` +
      `${s.rango}${loa}${rachaTxt}`
    );
  });

  const total = enriquecidos.length;
  const embed = new EmbedBuilder()
    .setColor('#74d4fc')
    .setTitle('Clasificación semanal de Staff')
    .setDescription(
      (lineas.join('\n\n') || 'Sin actividad registrada esta semana.') +
        `\n\n---\nOrden: **score semanal** · Mostrando **${top.length}** de **${total}** staff activos.\n` +
        `Se actualiza al hostear, supervisar, cerrar tickets o cargar cuota.`
    )
    .setThumbnail(guild.iconURL({ size: 128 }) || null)
    .setFooter({ text: 'Southwest Florida 00Y4n · Cuotas de la semana en curso' })
    .setTimestamp();

  return { filas: top, embed };
}

export async function refreshClasificacionLive(client, guildId) {
  if (!client || !guildId) return false;
  const ref = await obtenerMensajeClasificacion(guildId);
  if (!ref) return false;

  try {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return false;

    const channel = await guild.channels.fetch(ref.channelId).catch(() => null);
    if (!channel || !channel.isTextBased?.()) {
      await limpiarMensajeClasificacion(guildId);
      return false;
    }

    const message = await channel.messages.fetch(ref.messageId).catch(() => null);
    if (!message) {
      await limpiarMensajeClasificacion(guildId);
      return false;
    }

    const { embed } = await construirRankingSemanal(guild);
    await message.edit({ embeds: [embed] });
    await setInDb(KEY(guildId), {
      ...ref,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (e) {
    console.error('[clasificacionLive] refresh:', e?.message || e);
    return false;
  }
}

export function programarRefreshClasificacion(client, guildId, delayMs = 2500) {
  if (!client || !guildId) return;
  if (pendingTimers.has(guildId)) {
    clearTimeout(pendingTimers.get(guildId));
  }
  const t = setTimeout(() => {
    pendingTimers.delete(guildId);
    refreshClasificacionLive(client, guildId).catch(() => null);
  }, delayMs);
  pendingTimers.set(guildId, t);
}
