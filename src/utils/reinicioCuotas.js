import { EmbedBuilder } from 'discord.js';
import Staff from '../../models/Staff.js';
import StaffLog from '../../models/StaffLog.js';
import { logger } from './logger.js';
import { obtenerRangoDeUsuario } from './rangoStaff.js';
import {
  calcularScore,
  evaluarCumplimiento,
  idSemanaActual,
  textoScore
} from './scoreCuota.js';
import { sesionesSemana } from './metasCuota.js';
import { formatearHoras } from './formatearTiempo.js';

export const CANAL_STAFF_ANUNCIOS = '1505015531793678466';

/**
 * Genera informe semanal, actualiza rachas y reinicia cuotas.
 */
export async function reiniciarCuotasGuild(client, guildId, {
  anunciosChannelId = CANAL_STAFF_ANUNCIOS,
  executorId = null,
  automatico = true
} = {}) {
  const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));
  const lista = await Staff.find({
    guildId,
    estado: { $nin: ['DESPEDIDO', 'RENUNCIADO'] }
  });

  const semanaId = idSemanaActual();
  const cumplieron = [];
  const fallaron = [];
  const exentosLoa = [];
  let topScore = null;

  for (const staff of lista) {
    let rango = staff.rango || 'Staff';
    if (guild) {
      const r = await obtenerRangoDeUsuario(guild, staff.userId, rango);
      rango = r.rango;
    }

    const cuotas = staff.cuotas || {};
    const ses = sesionesSemana(cuotas);
    const tkt = Number(cuotas.ticketsCerrados) || 0;
    const horas = Number(cuotas.horasServicio) || 0;
    const score = calcularScore(cuotas, rango);
    const evalC = evaluarCumplimiento(staff, rango);

    if (!Array.isArray(staff.historialCumplimiento)) staff.historialCumplimiento = [];
    staff.historialCumplimiento.push({
      semanaId,
      cumplio: evalC.cumplio,
      enLoa: evalC.enLoa,
      sesiones: ses,
      tickets: tkt,
      horas,
      score,
      rango,
      fecha: new Date()
    });
    if (staff.historialCumplimiento.length > 26) {
      staff.historialCumplimiento = staff.historialCumplimiento.slice(-26);
    }

    if (evalC.cumplio === true) {
      staff.rachaActual = (Number(staff.rachaActual) || 0) + 1;
      staff.rachaMaxima = Math.max(Number(staff.rachaMaxima) || 0, staff.rachaActual);
      cumplieron.push({ userId: staff.userId, ses, tkt, horas, score, rango });
    } else if (evalC.cumplio === false) {
      staff.rachaActual = 0;
      fallaron.push({ userId: staff.userId, ses, tkt, horas, score, rango, motivo: evalC.motivo });
    } else {
      exentosLoa.push({ userId: staff.userId, rango });
    }

    // MVP solo entre quienes CUMPLIERON la cuota
    if (evalC.cumplio === true && (!topScore || score > topScore.score)) {
      topScore = { userId: staff.userId, score, rango };
    }

    staff.cuotas = staff.cuotas || {};
    staff.cuotas.horasServicio = 0;
    staff.cuotas.sesionesOrganizadas = 0;
    staff.cuotas.sesionesSupervisadas = 0;
    staff.cuotas.ticketsCerrados = 0;

    await staff.save().catch(e => logger.warn(`No se pudo guardar staff ${staff.userId}: ${e.message}`));
  }

  const afectados = lista.length;

  try {
    await StaffLog.create({
      guildId,
      tipo: 'CUOTA_RESET',
      targetUserId: executorId || client.user?.id || 'SYSTEM',
      executorId: executorId || client.user?.id || 'SYSTEM',
      detalles: {
        motivo: automatico ? 'Reinicio automático semanal (Domingo 22:00)' : 'Reinicio manual',
        usuariosAfectados: afectados,
        cumplieron: cumplieron.length,
        fallaron: fallaron.length,
        exentosLoa: exentosLoa.length,
        semanaId,
        automatico
      }
    });
  } catch (e) {
    logger.warn(`StaffLog CUOTA_RESET falló: ${e.message}`);
  }

  // Un solo embed (reinicio + informe). Solo anuncia si hay staff en ESTE guild
  // y el canal pertenece a este guild (evita duplicados al tener 2 servidores).
  try {
    if (afectados === 0 && cumplieron.length === 0 && fallaron.length === 0 && exentosLoa.length === 0) {
      logger.info(`Cuotas guild ${guildId}: sin staff para anunciar (omitido).`);
    } else {
      const channel =
        client.channels.cache.get(anunciosChannelId) ||
        (await client.channels.fetch(anunciosChannelId).catch(() => null));

      if (!channel?.isTextBased?.()) {
        logger.warn(`Canal de anuncios staff no encontrado: ${anunciosChannelId}`);
      } else if (channel.guildId && channel.guildId !== guildId) {
        logger.info(
          `Cuotas guild ${guildId}: canal ${anunciosChannelId} pertenece a ${channel.guildId}, se omite anuncio.`
        );
      } else {
        const fmtCumplieron = (arr, max = 10) => {
          if (!arr.length) return '> —';
          const orden = [...arr].sort((a, b) => (b.score || 0) - (a.score || 0));
          return (
            orden
              .slice(0, max)
              .map(
                x =>
                  `> <@${x.userId}> · score **${textoScore(x.score || 0)}** · ${x.ses || 0} ses` +
                  (x.tkt ? ` · ${x.tkt} tkt` : '') +
                  (x.horas ? ` · ${formatearHoras(x.horas)}` : '')
              )
              .join('\n') + (orden.length > max ? `\n> _…y ${orden.length - max} más_` : '')
          );
        };

        const fmtFallaron = (arr, max = 10) => {
          if (!arr.length) return '> Nadie 🎉';
          return (
            arr
              .slice(0, max)
              .map(x => `> <@${x.userId}> · ${x.motivo || 'meta incompleta'}`)
              .join('\n') + (arr.length > max ? `\n> _…y ${arr.length - max} más_` : '')
          );
        };

        const fmtLoa = (arr, max = 8) => {
          if (!arr.length) return '> —';
          return (
            arr
              .slice(0, max)
              .map(x => `> <@${x.userId}>`)
              .join('\n') + (arr.length > max ? `\n> _…y ${arr.length - max} más_` : '')
          );
        };

        let desc =
          (automatico
            ? 'Se reiniciaron las **cuotas semanales** de todo el Staff.\n'
            : 'Reinicio **manual** de cuotas.\n') +
          `📅 Semana cerrada: **${semanaId}** · próximo reinicio: **Domingo 22:00 (AR)**\n` +
          '📈 El **histórico** y las **rachas** se mantienen. Las cuotas de esta semana quedan en **0**.\n';

        if (topScore) {
          desc +=
            `\n🏆 **MVP de la semana:** <@${topScore.userId}> — score **${textoScore(topScore.score)}** (${topScore.rango})\n`;
        }

        desc += `\n> Staff procesados: **${afectados}** · ✅ ${cumplieron.length} · ❌ ${fallaron.length} · 🟡 LOA ${exentosLoa.length}`;

        const embed = new EmbedBuilder()
          .setTitle(`📊 Cierre Semanal de Cuotas — ${semanaId}`)
          .setColor('#74d4fc')
          .setDescription(desc)
          .addFields(
            {
              name: `✅ Cumplieron (${cumplieron.length})`,
              value: fmtCumplieron(cumplieron),
              inline: false
            },
            {
              name: `❌ No cumplieron (${fallaron.length})`,
              value: fmtFallaron(fallaron),
              inline: false
            },
            {
              name: `🟡 Exentos por LOA (${exentosLoa.length})`,
              value: fmtLoa(exentosLoa),
              inline: false
            }
          )
          .setFooter({
            text: '00Y4n Comunidad SWFL • Sistema de Cuotas • LOA no cuenta como fallo',
            iconURL: channel.guild?.iconURL?.() || undefined
          })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    }
  } catch (e) {
    logger.error(`Error anunciando reinicio de cuotas: ${e.message}`);
  }

  return { afectados, cumplieron: cumplieron.length, fallaron: fallaron.length, exentosLoa: exentosLoa.length };
}

export async function reiniciarCuotasTodosLosGuilds(client) {
  let total = 0;
  for (const [guildId] of client.guilds.cache) {
    try {
      const r = await reiniciarCuotasGuild(client, guildId, { automatico: true });
      total += r.afectados;
      logger.info(`Cuotas reiniciadas en guild ${guildId}: ${r.afectados} staff`);
    } catch (e) {
      logger.error(`Error reiniciando cuotas en guild ${guildId}: ${e.message}`);
    }
  }
  return total;
}

/**
 * Recordatorio mid-week: DM a staff activos con < 50% de meta de sesiones.
 * Miércoles 18:00 Argentina.
 */
export async function recordatorioCuotaMidWeek(client) {
  let enviados = 0;
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      const lista = await Staff.find({
        guildId,
        estado: { $nin: ['DESPEDIDO', 'RENUNCIADO', 'LOA'] },
        'loa.activo': { $ne: true }
      });

      for (const staff of lista) {
        const { rango } = await obtenerRangoDeUsuario(guild, staff.userId, staff.rango || 'Staff');
        const { obtenerMetasPorRango } = await import('./metasCuota.js');
        const metas = obtenerMetasPorRango(rango);

        if (metas.sesionesMeta <= 0) continue;

        const ses = sesionesSemana(staff.cuotas || {});
        const ratio = ses / metas.sesionesMeta;
        if (ratio >= 0.5) continue;

        try {
          const user = await client.users.fetch(staff.userId);
          const embed = new EmbedBuilder()
            .setTitle('⏰ Recordatorio de Cuota Semanal')
            .setColor('#faa61a')
            .setDescription(
              `Hola <@${staff.userId}>, vas **por debajo del 50%** de tu meta semanal en **${guild.name}**.\n\n` +
                `> **Rango:** ${rango}\n` +
                `> **Sesiones:** **${ses} / ${metas.sesionesMeta}**\n` +
                `> **Tickets:** **${staff.cuotas?.ticketsCerrados || 0} / ${metas.ticketsMeta}**\n` +
                `> **Tiempo:** ${formatearHoras(staff.cuotas?.horasServicio || 0)}\n\n` +
                `Quedan días hasta el domingo 22:00 (reinicio). ¡Todavía podés recuperar!`
            )
            .setFooter({ text: '00Y4n Comunidad SWFL • Recordatorio automático (miércoles)' })
            .setTimestamp();

          await user.send({ embeds: [embed] });
          enviados++;
        } catch {
          // DMs cerrados
        }
      }
    } catch (e) {
      logger.error(`Recordatorio cuota guild ${guildId}: ${e.message}`);
    }
  }
  logger.info(`Recordatorio mid-week: ${enviados} DMs enviados`);
  return enviados;
}
