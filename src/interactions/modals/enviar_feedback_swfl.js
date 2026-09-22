import { EmbedBuilder } from 'discord.js';
import { registrarNotaHost } from '../../utils/gestorHostScore.js';

const CANAL_FEEDBACK = '1529286924362317974';

function parseNota(raw) {
  const m = String(raw || '').match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  if (Number.isNaN(n)) return null;
  return Math.max(1, Math.min(10, Math.round(n)));
}

export default {
  name: 'enviar_feedback_swfl',

  async execute(interaction, client, args = []) {
    const hostId = args[0] && args[0] !== 'none' ? args[0] : null;
    const sesionId = args[1] && args[1] !== 'none' ? args[1] : null;

    const notaEnviada = interaction.fields.getTextInputValue('feedback_nota');
    const comentariosEnviados = interaction.fields.getTextInputValue('feedback_comentarios');
    const notaNum = parseNota(notaEnviada);

    if (!hostId) {
      return interaction.reply({
        content: '❌ No se pudo vincular la opinión al host de la sesión.',
        ephemeral: true
      });
    }

    if (!notaNum) {
      return interaction.reply({
        content: '❌ La calificación debe ser un número del **1 al 10**.',
        ephemeral: true
      });
    }

    if (interaction.guildId) {
      try {
        await registrarNotaHost(interaction.guildId, hostId, {
          nota: notaNum,
          deUserId: interaction.user.id,
          comentario: comentariosEnviados,
          sesionId
        });
      } catch (e) {
        console.error('[feedback] score:', e?.message || e);
      }
    }

    const embedRespuesta = new EmbedBuilder()
      .setTitle('__SWFL | Nueva Opinión Recibida__')
      .setDescription('¡Un miembro ha dejado su reseña sobre la última sesión jugada!')
      .addFields(
        { name: '👤 Enviado por:', value: `<@${interaction.user.id}>`, inline: true },
        { name: '🚗 Anfitrión:', value: `<@${hostId}>`, inline: true },
        { name: '⭐ Calificación:', value: `**${notaNum} / 10**`, inline: true },
        {
          name: '💬 Comentarios y sugerencias:',
          value: `\`\`\`text\n${comentariosEnviados}\n\`\`\``,
          inline: false
        }
      )
      .setColor('#8ae6fa')
      .setTimestamp();

    await interaction.reply({
      content: '✅ **¡Muchas gracias!** Tu opinión fue registrada y suma al **rating civil** del host.',
      ephemeral: true
    });

    const canalDestino =
      interaction.client.channels.cache.get(CANAL_FEEDBACK) ||
      (await interaction.client.channels.fetch(CANAL_FEEDBACK).catch(() => null));

    if (canalDestino) {
      await canalDestino.send({ embeds: [embedRespuesta] });
    } else {
      await interaction.channel.send({ embeds: [embedRespuesta] }).catch(() => null);
    }
  }
};
