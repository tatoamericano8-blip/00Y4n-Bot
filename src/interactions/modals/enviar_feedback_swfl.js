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

function parseHostId(raw, fallbackUserId) {
  const m = String(raw || '').match(/\d{15,20}/);
  return m ? m[0] : fallbackUserId;
}

export default {
  name: 'enviar_feedback_swfl',

  async execute(interaction) {
    const hostEnviado = interaction.fields.getTextInputValue('feedback_host');
    const notaEnviada = interaction.fields.getTextInputValue('feedback_nota');
    const comentariosEnviados = interaction.fields.getTextInputValue('feedback_comentarios');

    const notaNum = parseNota(notaEnviada);
    const hostId = parseHostId(hostEnviado, null);

    if (interaction.guildId && hostId && notaNum) {
      try {
        await registrarNotaHost(interaction.guildId, hostId, {
          nota: notaNum,
          deUserId: interaction.user.id,
          comentario: comentariosEnviados
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
        { name: '🚗 Anfitrión mencionado:', value: `${hostEnviado}`, inline: true },
        {
          name: '⭐ Calificación:',
          value: `**${notaNum != null ? notaNum : notaEnviada} / 10**`,
          inline: true
        },
        {
          name: '💬 Comentarios y sugerencias:',
          value: `\`\`\`text\n${comentariosEnviados}\n\`\`\``,
          inline: false
        }
      )
      .setColor('#74d4fc')
      .setTimestamp();

    await interaction.reply({
      content: '✅ **¡Muchas gracias!** Tu opinión fue registrada' +
        (notaNum && hostId ? ' y suma al **host score**.' : '.'),
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
