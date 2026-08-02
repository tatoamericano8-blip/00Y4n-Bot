import { Events, EmbedBuilder } from 'discord.js';
import { logEvent, EVENT_TYPES } from '../services/loggingService.js';
import { logger } from '../utils/logger.js';
import { getFromDb, setInDb } from '../utils/database.js';

/**
 * Canal donde se publican los anuncios de boost automáticos.
 * Podés cambiarlo por el ID de tu canal de boosts / anuncios.
 * Si queda null, usa el canal de sistema del servidor.
 */
const CANAL_BOOST_ID = process.env.BOOST_CHANNEL_ID || null;

export default {
  name: Events.GuildMemberUpdate,
  once: false,

  async execute(oldMember, newMember) {
    try {
      if (!newMember.guild) return;

      // ═══════════════════════════════════════
      //  BOOST AUTOMÁTICO
      //  Detecta cuando alguien empieza a boostear
      // ═══════════════════════════════════════
      const antesBoost = Boolean(oldMember.premiumSince);
      const ahoraBoost = Boolean(newMember.premiumSince);

      if (!antesBoost && ahoraBoost) {
        try {
          await anunciarBoostAutomatico(newMember);
        } catch (boostErr) {
          logger.error('Error al anunciar boost automático:', boostErr);
        }
      }

      // ═══════════════════════════════════════
      //  CAMBIO DE NICK (logs existentes)
      // ═══════════════════════════════════════
      const fields = [];

      fields.push({
        name: '👤 Member',
        value: `${newMember.user.tag} (${newMember.user.id})`,
        inline: true
      });

      if (oldMember.nickname !== newMember.nickname) {
        fields.push({
          name: '🏷️ Old Nickname',
          value: oldMember.nickname || '*(no nickname)*',
          inline: true
        });

        fields.push({
          name: '🏷️ New Nickname',
          value: newMember.nickname || '*(no nickname)*',
          inline: true
        });

        await logEvent({
          client: newMember.client,
          guildId: newMember.guild.id,
          eventType: EVENT_TYPES.MEMBER_NAME_CHANGE,
          data: {
            description: `Member nickname changed: ${newMember.user.tag}`,
            userId: newMember.user.id,
            fields
          }
        });
      }
    } catch (error) {
      logger.error('Error in guildMemberUpdate event:', error);
    }
  }
};

/**
 * Envía el embed de agradecimiento por boost (mismo estilo que /anunciar_boost)
 * y lleva un contador de veces que esa persona boosteó el servidor.
 */
async function anunciarBoostAutomatico(member) {
  const guild = member.guild;
  const user = member.user;

  // Contador persistente de boosts por usuario
  const key = `boosts:${guild.id}:${user.id}`;
  const prev = Number(await getFromDb(key, 0)) || 0;
  const totalBoosts = prev + 1;
  await setInDb(key, totalBoosts);

  const embedBoost = new EmbedBuilder()
    .setTitle(
      `<a:soad:1523026183028084768> 00Y4n SWFL | Notificación de Mejora <a:soad:1523026183028084768>`
    )
    .setDescription(
      `¡Gracias, <@${user.id}>! <a:cora:1523026545340449002>\n\n` +
        `<a:si:1523027371735777503> ¡Has mejorado el servidor **${totalBoosts} ${totalBoosts === 1 ? 'vez' : 'veces'}**! Lo apreciamos muchísimo. ` +
        `Tu mejora ha sido registrada dentro de 00Y4n SWFL, ¡y se han aplicado automáticamente tus beneficios de Booster según el total de mejoras!\n\n` +
        `<:afa:1523028004983406787> *¿Tienes algún problema o te falta algún beneficio? ¡No dudes en abrir un ticket de asistencia si necesitas soporte adicional!*`
    )
    .setColor('#74d4fc')
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
    .setFooter({
      text: '00Y4n SWFL™',
      iconURL: guild.iconURL()
    });

  // Resolver canal de destino
  let canal = null;
  if (CANAL_BOOST_ID) {
    canal = await guild.channels.fetch(CANAL_BOOST_ID).catch(() => null);
  }
  if (!canal && guild.systemChannelId) {
    canal = await guild.channels.fetch(guild.systemChannelId).catch(() => null);
  }

  if (!canal || !canal.isTextBased()) {
    logger.warn(
      `[boost] No se encontró canal para anunciar boost de ${user.tag}. Configurá BOOST_CHANNEL_ID.`
    );
    return;
  }

  await canal.send({
    content: `> __**¡Miren quién acaba de mejorar el servidor! <@${user.id}> 🎉**__`,
    embeds: [embedBoost]
  });

  logger.info(`[boost] Anuncio automático enviado para ${user.tag} (${totalBoosts}x) en #${canal.name}`);
}
