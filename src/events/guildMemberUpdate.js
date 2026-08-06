import { Events, EmbedBuilder } from 'discord.js';
import { logEvent, EVENT_TYPES } from '../services/loggingService.js';
import { logger } from '../utils/logger.js';
import { getFromDb, setInDb } from '../utils/database.js';

/**
 * Canal de anuncios de boost. También se usa desde messageCreate (mensaje del sistema).
 * Si es null, se usa el canal de sistema del servidor.
 */
export const CANAL_BOOST_ID = process.env.BOOST_CHANNEL_ID || null;

/**
 * Anuncia un boost y actualiza el contador persistente.
 * @param {import('discord.js').GuildMember | import('discord.js').User} memberOrUser
 * @param {import('discord.js').Guild} guild
 * @param {number} vecesEstaAccion  boosts en esta acción (1, 2, ...)
 * @param {import('discord.js').Client} client
 */
export async function anunciarBoostAutomatico(memberOrUser, guild, vecesEstaAccion = 1, client = null) {
  const user = memberOrUser.user ? memberOrUser.user : memberOrUser;
  const veces = Math.max(1, Number(vecesEstaAccion) || 1);

  const key = `boosts:${guild.id}:${user.id}`;
  const prev = Number(await getFromDb(key, 0)) || 0;
  const totalBoosts = prev + veces;
  await setInDb(key, totalBoosts);

  const embedBoost = new EmbedBuilder()
    .setTitle(
      `<a:soad:1532515659269935256> 00Y4n SWFL | Notificación de Mejora <a:soad:1532515659269935256>`
    )
    .setDescription(
      `¡Gracias, <@${user.id}>!\n\n` +
        `<:si:1534938142665084938> ¡Has mejorado el servidor **${totalBoosts} ${totalBoosts === 1 ? 'vez' : 'veces'}**! Lo apreciamos muchísimo. ` +
        `Tu mejora ha sido registrada dentro de 00Y4n SWFL, ¡y se han aplicado automáticamente tus beneficios de Booster según el total de mejoras!\n\n` +
        `<:afa:1534982812116062370> *¿Tienes algún problema o te falta algún beneficio? ¡No dudes en abrir un ticket de asistencia si necesitas soporte adicional!*`
    )
    .setColor('#74d4fc')
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
    .setFooter({
      text: '00Y4n SWFL™',
      iconURL: guild.iconURL()
    });

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
    return totalBoosts;
  }

  await canal.send({
    content: `> __**¡Miren quién acaba de mejorar el servidor! <@${user.id}>**__`,
    embeds: [embedBoost]
  });

  logger.info(`[boost] Anuncio automático: ${user.tag} +${veces} (total ${totalBoosts}x) en #${canal.name}`);
  return totalBoosts;
}

export default {
  name: Events.GuildMemberUpdate,
  once: false,

  async execute(oldMember, newMember) {
    try {
      if (!newMember.guild) return;

      // Boost preferido: mensaje del sistema (messageCreate) para contar 1, 2, 3...
      // Fallback si no llega el mensaje del sistema en ~2.5s
      const antesBoost = Boolean(oldMember.premiumSince);
      const ahoraBoost = Boolean(newMember.premiumSince);

      if (!antesBoost && ahoraBoost) {
        const dedupeKey = `boost_dedupe:${newMember.guild.id}:${newMember.id}`;
        setTimeout(async () => {
          try {
            const recent = Number(await getFromDb(dedupeKey, 0)) || 0;
            if (Date.now() - recent < 15_000) return;
            await anunciarBoostAutomatico(newMember, newMember.guild, 1);
            await setInDb(dedupeKey, Date.now());
          } catch (e) {
            logger.error('Error boost fallback:', e);
          }
        }, 2500);
      }

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
