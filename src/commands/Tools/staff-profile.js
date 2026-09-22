import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import Staff from '../../../models/Staff.js';
import Sesion from '../../../models/Session.js';
import { obtenerRangoDeUsuario } from '../../utils/rangoStaff.js';
import { formatearHoras } from '../../utils/formatearTiempo.js';
import { obtenerMetasPorRango, sesionesSemana } from '../../utils/metasCuota.js';
import { calcularScore, evaluarCumplimiento } from '../../utils/scoreCuota.js';
import { obtenerScoreHost } from '../../utils/gestorHostScore.js';
import { obtenerScoreSupervision } from '../../utils/gestorSupervisionScore.js';
import { discordToRoblox, obtenerUsuarioRoblox } from '../../utils/gestorBloxlink.js';
import { E, EMOJI_DEF } from '../../config/emojis.js';

const ROL_STAFF = '1512120103771050005';
const COLOR = '#8ae6fa';

function textoEstado(staffData) {
  const est = staffData.estado || 'ACTIVO';
  const enLoa = est === 'LOA' || staffData.loa?.activo === true;
  if (est === 'DESPEDIDO') return `${E.cruz} DESPEDIDO`;
  if (est === 'RENUNCIADO') return `${E.menos} RENUNCIADO`;
  if (enLoa) return `${E.warn} LOA`;
  return `${E.tilde} ACTIVO`;
}

function esAltoComando(rango) {
  const n = String(rango || '').toLowerCase();
  return (
    n.includes('alto comando') ||
    n.includes('alto mando') ||
    n.includes('gerente') ||
    n.includes('fundador') ||
    n.includes('propietario')
  );
}

function fmtDuracionMin(min) {
  const m = Math.max(0, Number(min) || 0);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

function fmtRelativo(fecha) {
  if (!fecha) return 'Sin registro';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return 'Sin registro';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `hace ${hrs} h`;
  const dias = Math.floor(hrs / 24);
  if (dias < 30) return `hace ${dias} día${dias === 1 ? '' : 's'}`;
  return d.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
}

/** Puntaje mixto para ranking: sesiones, horas y score de cuota */
function puntajeRanking({ host, horas, score }) {
  return Number(host || 0) * 10 + Number(horas || 0) * 3 + Number(score || 0);
}

async function calcularPosiciones(guildId, guild, targetId) {
  const lista = await Staff.find({
    guildId,
    estado: { $nin: ['DESPEDIDO', 'RENUNCIADO'] }
  }).lean();

  const filasSem = [];
  const filasAll = [];

  for (const s of lista) {
    if (guild) {
      const m = guild.members.cache.get(s.userId);
      if (m && !m.roles.cache.has(ROL_STAFF)) continue;
    }
    const c = s.cuotas || {};
    const h = s.estadisticasHistoricas || {};
    const { rango } = await obtenerRangoDeUsuario(guild, s.userId, s.rango || 'Sin rango');
    const score = calcularScore(c, rango);
    const hostSem = Number(c.sesionesOrganizadas) || 0;
    const horasSem = Number(c.horasServicio) || 0;
    const hostAll =
      (Number(h.sesionesHosteadasTotales) || 0) + (Number(h.sesionesSupervisadasTotales) || 0);
    const horasAll = Number(h.horasTotales) || 0;

    filasSem.push({
      userId: s.userId,
      pts: puntajeRanking({ host: hostSem, horas: horasSem, score })
    });
    filasAll.push({
      userId: s.userId,
      pts: puntajeRanking({ host: hostAll, horas: horasAll, score: 0 })
    });
  }

  filasSem.sort((a, b) => b.pts - a.pts);
  filasAll.sort((a, b) => b.pts - a.pts);

  const posSem = filasSem.findIndex((x) => x.userId === targetId) + 1;
  const posAll = filasAll.findIndex((x) => x.userId === targetId) + 1;

  return {
    semanal: posSem > 0 ? posSem : null,
    historico: posAll > 0 ? posAll : null,
    totalSem: filasSem.length,
    totalAll: filasAll.length
  };
}

export default {
  data: new SlashCommandBuilder()
    .setName('staff-perfil')
    .setDescription('Perfil completo de estadísticas de un integrante del Staff.')
    .addUserOption((opt) =>
      opt.setName('usuario').setDescription('Staff a consultar.').setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ROL_STAFF)) {
      return interaction.reply({
        content: E.cruz + ' Solo el **Staff 00Y4n** puede usar `/staff-perfil`.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const guild = interaction.guild;
    const guildId = interaction.guildId;

    const staffData = await Staff.findOne({ guildId, userId: targetUser.id });
    if (!staffData) {
      return interaction.editReply({
        content: `${E.cruz} <@${targetUser.id}> no posee registro en la base de datos del Staff.`
      });
    }

    const { rango } = await obtenerRangoDeUsuario(
      guild,
      targetUser.id,
      staffData.rango || 'Sin rango'
    );

    // Nombre tipo servidor (Bloxlink display)
    let nombreTitulo = targetUser.username;
    try {
      const member =
        guild.members.cache.get(targetUser.id) ||
        (await guild.members.fetch(targetUser.id).catch(() => null));
      if (member?.displayName) nombreTitulo = member.displayName;
      const bl = await discordToRoblox(guildId, targetUser.id);
      if (bl.ok) {
        const ru = await obtenerUsuarioRoblox(bl.robloxId);
        if (ru?.smartName) nombreTitulo = `${ru.smartName} (@${targetUser.username})`;
        else if (ru?.name) nombreTitulo = `${ru.name} (@${targetUser.username})`;
      } else {
        nombreTitulo = `${nombreTitulo} (@${targetUser.username})`;
      }
    } catch {
      nombreTitulo = `${targetUser.username}`;
    }

    const metas = obtenerMetasPorRango(rango);
    const sesActual = sesionesSemana(staffData.cuotas || {});
    const strikesActivos = staffData.strikes
      ? staffData.strikes.filter((s) => s.activo).length
      : 0;
    const c = staffData.cuotas || {};
    const h = staffData.estadisticasHistoricas || {};
    const score = calcularScore(c, rango);
    const evalC = evaluarCumplimiento(staffData, rango);
    const racha = Number(staffData.rachaActual) || 0;
    const rachaMax = Number(staffData.rachaMaxima) || 0;

    let estadoCuota = `${E.tiempo} En curso`;
    if (evalC?.enLoa) estadoCuota = `${E.warn} Exento (LOA)`;
    else if (evalC?.cumplio) estadoCuota = `${E.tilde} Meta cumplida`;

    // Sesiones del host (cerradas)
    const sesionesHost = await Sesion.find({
      guildId,
      hostId: targetUser.id,
      estado: 'cerrada'
    })
      .sort({ fechaCierre: -1 })
      .lean()
      .catch(() => []);

    const sesionesSup = await Sesion.find({
      guildId,
      supervisorId: targetUser.id,
      estado: 'cerrada'
    })
      .lean()
      .catch(() => []);

    const hosteadasHist =
      (Number(h.sesionesHosteadasTotales) || 0) ||
      sesionesHost.length;
    const horasHist = Number(h.horasTotales) || 0;

    let longestMin = 0;
    let peakReac = 0;
    let lastSession = null;
    for (const s of sesionesHost) {
      const dur = Number(s.duracionMinutos) || 0;
      if (dur > longestMin) longestMin = dur;
      const peak =
        Number(s.reaccionesPico) ||
        (Array.isArray(s.reacciones) ? s.reacciones.length : 0);
      if (peak > peakReac) peakReac = peak;
      if (s.fechaCierre && (!lastSession || new Date(s.fechaCierre) > new Date(lastSession))) {
        lastSession = s.fechaCierre;
      }
    }
    // También considerar última actividad como supervisor
    for (const s of sesionesSup) {
      if (s.fechaCierre && (!lastSession || new Date(s.fechaCierre) > new Date(lastSession))) {
        lastSession = s.fechaCierre;
      }
    }

    const civil = await obtenerScoreHost(guildId, targetUser.id);
    const sup = await obtenerScoreSupervision(guildId, targetUser.id);

    // Civil 1-10 → escala 1-5 para mostrar tipo GRU
    const civil5 =
      civil.cantidad > 0
        ? Math.round((Number(civil.promedio) / 2) * 10) / 10
        : null;
    const sup5 = sup.cantidad > 0 ? Number(sup.promedio) : null;
    let overall = null;
    if (civil5 != null && sup5 != null) overall = Math.round(((civil5 + sup5) / 2) * 10) / 10;
    else if (civil5 != null) overall = civil5;
    else if (sup5 != null) overall = sup5;

    const posiciones = await calcularPosiciones(guildId, guild, targetUser.id);

    const badgeHC = esAltoComando(rango)
      ? `${E.carpeta} __**Alto Comando**__\n\n`
      : '';

    const rankSem =
      posiciones.semanal != null
        ? `#${posiciones.semanal} en la clasificación semanal`
        : 'Sin posición semanal';
    const rankAll =
      posiciones.historico != null
        ? `#${posiciones.historico} en la clasificación histórica`
        : 'Sin posición histórica';

    const metaSesTxt =
      metas.sesionesMeta > 0 ? `${sesActual} / ${metas.sesionesMeta}` : `${sesActual}`;
    const metaTktTxt =
      metas.ticketsMeta > 0
        ? `${c.ticketsCerrados || 0} / ${metas.ticketsMeta}`
        : `${c.ticketsCerrados || 0}`;

    const ratingLines = [];
    ratingLines.push(
      `${E.dot} **Civil:** ${civil5 != null ? `**${civil5}** / 5 (${civil.cantidad} opiniones)` : 'Sin datos'}`
    );
    ratingLines.push(
      `${E.dot} **Supervisión:** ${sup5 != null ? `**${sup5}** / 5 (${sup.cantidad} logs)` : 'Sin datos'}`
    );
    if (overall != null) ratingLines.push(`${E.dot} **General:** **${overall}** / 5`);

    const embed = new EmbedBuilder()
      .setTitle(`${rango} | ${nombreTitulo}`)
      .setDescription(
        badgeHC +
          `${E.triostar} **Clasificación**\n` +
          `${E.flecha} ${rankSem}\n` +
          `${E.flecha} ${rankAll}\n\n` +
          `${E.perfil} **Estadísticas de hosting**\n` +
          `${E.dot} Sesiones hosteadas: **${hosteadasHist}**\n` +
          `${E.dot} Horas hosteadas: **${formatearHoras(horasHist)}**\n` +
          `${E.dot} Sesión más larga: **${longestMin > 0 ? fmtDuracionMin(longestMin) : '—'}**\n` +
          `${E.dot} Pico de reacciones: **${peakReac > 0 ? peakReac : '—'}**\n\n` +
          `${E.form} **Rating del staff**\n` +
          ratingLines.join('\n') +
          `\n\n` +
          `${E.dot} **Estado:** ${textoEstado(staffData)} · **Strikes:** \`${strikesActivos}/3\`\n` +
          `${E.dot} **Cuota semanal:** ${estadoCuota} · Sesiones \`${metaSesTxt}\` · Tickets \`${metaTktTxt}\`\n` +
          `${E.dot} **Score semanal:** **${score}**/100 · Racha ${E.aestrellitas} \`${racha}\` (máx. \`${rachaMax}\`)`
      )
      .setColor(COLOR)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setFooter({
        text:
          `Ingreso: ${
            staffData.ingreso
              ? new Date(staffData.ingreso).toLocaleString('es-AR', {
                  timeZone: 'America/Argentina/Buenos_Aires'
                })
              : 'Sin fecha'
          } · Última sesión: ${fmtRelativo(lastSession)} · ID: ${targetUser.id}`
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`staff_perfil_logros:${targetUser.id}`)
        .setLabel('Logros')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(EMOJI_DEF.trofeo?.id || EMOJI_DEF.estrella?.id || '🏆'),
      new ButtonBuilder()
        .setCustomId(`staff_perfil_ses_sem:${targetUser.id}`)
        .setLabel('Sesiones semanales')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(EMOJI_DEF.lista?.id || '📋'),
      new ButtonBuilder()
        .setCustomId(`staff_perfil_ses_all:${targetUser.id}`)
        .setLabel('Sesiones históricas')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(EMOJI_DEF.carpeta?.id || '📁')
    );

    return interaction.editReply({ embeds: [embed], components: [row] });
  }
};
