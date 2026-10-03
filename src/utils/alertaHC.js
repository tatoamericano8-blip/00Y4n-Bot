import { EmbedBuilder } from 'discord.js';
import { logger } from './logger.js';

/** Canal técnico/bot (no staff-anuncios públicos) */
const CHANNEL_ALERTAS_HC = '1517331229303902432';

export async function avisarAltoComando(client, titulo, descripcion, color = '#E60404') {
  try {
    if (!client) return;
    const channel =
      client.channels.cache.get(CHANNEL_ALERTAS_HC) ||
      (await client.channels.fetch(CHANNEL_ALERTAS_HC).catch(() => null));
    if (!channel?.isTextBased?.()) return;
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(titulo)
      .setDescription(String(descripcion).slice(0, 4000))
      .setTimestamp();
    await channel.send({ embeds: [embed] });
  } catch (e) {
    logger.warn('No se pudo enviar alerta técnica del bot:', e?.message || e);
  }
}
