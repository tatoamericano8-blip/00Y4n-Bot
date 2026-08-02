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

    // Historial de cumplimiento
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
    // Mantener últimas 26 semanas
    if (staff.historialCumplimiento.length > 26) {
      staff.historialCumplimiento = staff.historialCumplimiento.slice(-26);
    }

    // Rachas: solo cuentan cumplimientos reales (no LOA)
    if (evalC.cumplio === true) {
      staff.rachaActual = (Number(staff.rachaActual) || 0) + 1;
      staff.rachaMaxima = Math.max(Number(staff.rachaMaxima) || 0, staff.rachaActual);
      cumplieron.push({ userId: staff.userId, ses, tkt, horas, score, rango });
    } else if (evalC.cumplio === false) {
      staff.rachaActual = 0;
      fallaron.push({ userId: staff.userId, ses, tkt, horas, score, rango, motivo: evalC.motivo });
    } else {
      // LOA: no rompe racha, no suma
      exentosLoa.push({ userId: staff.userId, rango });
    }

    if (!topScore || score > topScore.score) {
      topScore = { userId: staff.userId, score, rango };
    }

    // Reset cuota semanal
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

  // Anuncio + informe
  try {
    const channel =
      client.channels.cache.get(anunciosChannelId) ||
      (await client.channels.fetch(anunciosChannelId).catch(() => null));

    if (channel?.isTextBased?.()) {
      const fmtLista = (arr, max = 8) => {
        if (!arr.length) return '> —';
        return arr
          .slice(0, max)
          .map(x => `> <@${x.userId}> · score ${textoScore(x.score || 0)} · ${x.ses || 0} ses`)
          .join('\n') + (arr.length > max ? `\n> _…y ${arr.length - max} más_` : '');
      };

      const embedReset = new EmbedBuilder()
        .setTitle('🔄 Reinicio Semanal de Cuotas')
        .setColor('#74d4fc')
        .setDescription(
          (automatico
            ? 'Se reiniciaron automáticamente las **cuotas semanales** de todo el Staff.\n'
            : 'Reinicio **manual** de cuotas.\n') +
            `📅 Semana: **${semanaId}** · Domingos 22:00 (AR)\n` +
            '📈 El **histórico** y las **rachas** se mantienen.\n\n' +
            `> Staff procesados: **${afectados}**`
        )
        .setFooter({
          text: '00Y4n Comunidad SWFL • Sistema de Cuotas',
          iconURL: channel.guild?.iconURL?.() || undefined
        })
        .setTimestamp();

      const embedInforme = new EmbedBuilder()
        .setTitle(`📊 Informe Semanal de Cuotas — ${semanaId}`)
        .setColor(0xf1c40f)
        .addFields(
          {
            name: `✅ Cumplieron (${cumplieron.length})`,
            value: fmtLista(cumplieron.sort((a, b) => b.score - a.score)),
            inline: false
          },
          {
            name: `❌ No cumplieron (${fallaron.length})`,
            value:
              fallaron.length === 0
                ? '> Nadie 🎉'
                : fallaron
                    .slice(0, 8)
                    .map(x => `> <@${x.userId}> · ${x.motivo}`)
                    .join('\n') +
                  (fallaron.length > 8 ? `\n> _…y ${fallaron.length - 8} más_` : ''),
            inline: false
          },
          {
            name: `🟡 Exentos por LOA (${exentosLoa.length})`,
            value:
              exentosLoa.length === 0
                ? '> —'
                : exentosLoa
                    .slice(0, 8)
                    .map(x => `> <@${x.userId}>`)
                    .join('\n') +
                  (exentosLoa.length > 8 ? `\n> _…y ${exentosLoa.length - 8} más_` : ''),
            inline: false
          }
        )
        .setFooter({
          text:
            topScore
              ? `MVP de la semana: score ${topScore.score} • LOA no cuenta como fallo`
              : 'LOA no cuenta como fallo de cuota'
        })
        .setTimestamp();

      if (topScore) {
        embedInforme.setDescription(
          `🏆 **MVP de la semana:** <@${topScore.userId}> — score **${topScore.score}** (${topScore.rango})`
        );
      }

      await channel.send({ embeds: [embedReset, embedInforme] });
    } else {
      logger.warn(`Canal de anuncios staff no encontrado: ${anunciosChannelId}`);
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

        if (metas.sesionesMeta <= 0) continue; // sin meta

        const ses = sesionesSemana(staff.cuotas || {});
        const ratio = ses / metas.sesionesMeta;
        if (ratio >= 0.5) continue; // va bien

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
          // DMs cerrados — ignorar
        }
      }
    } catch (e) {
      logger.error(`Recordatorio cuota guild ${guildId}: ${e.message}`);
    }
  }
  logger.info(`Recordatorio mid-week: ${enviados} DMs enviados`);
  return enviados;
}
