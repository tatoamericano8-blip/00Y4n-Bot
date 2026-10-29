import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { reclamarOportunidadPorMensaje, crearEmbedBanner } from '../../utils/gestorOportunidades.js';
import { E, EMOJI_DEF } from '../../config/emojis.js';

export default {
  id: 'reclamar_oportunidad',
  customId: 'reclamar_oportunidad',
  name: 'reclamar_oportunidad',

  async execute(interaction) {
    const messageId = interaction.message?.id;
    if (!messageId) {
      return interaction.reply({
        content: E.cruz + ' No se pudo identificar la oportunidad.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferUpdate().catch(() => null);

    const result = await reclamarOportunidadPorMensaje(messageId, interaction.user.id);

    if (!result.ok) {
      if (result.reason === 'ya_reclamada') {
        return interaction
          .followUp({
            content: E.lock + ' Esta oportunidad **ya fue reclamada**.',
            flags: MessageFlags.Ephemeral
          })
          .catch(() => null);
      }
      return interaction
        .followUp({
          content:
            E.cruz +
            ' Esta oportunidad ya no está disponible (mensaje viejo o sin registro).',
          flags: MessageFlags.Ephemeral
        })
        .catch(() => null);
    }

    const montoFmt = Number(result.monto).toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    const historia = result.historia || '';

    const embedBanner = crearEmbedBanner();

    const embedGanador = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle(E.a2alas + ' ¡Oportunidad Economica!')
      .setDescription(
        `${E.gift || E.dinero} **$${montoFmt}** ${historia}\n\n` +
          `${E.flecha} **Reclamado por:** <@${interaction.user.id}>`
      )
      .setTimestamp();

    const botonDesactivado = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('reclamado_done')
        .setLabel('Reclamado')
        .setEmoji(EMOJI_DEF.lock?.id ? { id: EMOJI_DEF.lock.id } : undefined)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    try {
      await interaction.message.edit({
        embeds: [embedBanner, embedGanador],
        components: [botonDesactivado]
      });
    } catch (e) {
      console.error('[reclamar_oportunidad] edit mensaje:', e?.message || e);
    }

    return interaction
      .followUp({
        content: `${E.tilde} Reclamaste **$${montoFmt}**. Ya fue sumado a tu balance.`,
        flags: MessageFlags.Ephemeral
      })
      .catch(() => null);
  },

  async run(client, interaction) {
    return this.execute(interaction, client);
  }
};
