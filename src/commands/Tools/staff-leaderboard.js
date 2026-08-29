import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import {
  construirRankingSemanal,
  guardarMensajeClasificacion,
  obtenerMensajeClasificacion
} from '../../utils/clasificacionStaffLive.js';

const ROL_PROPIETARIOS = '1528877296977711256';

export default {
  data: new SlashCommandBuilder()
    .setName('staff-clasificacion')
    .setDescription(
      'Publica la clasificación semanal de Staff (mensaje vivo que se actualiza solo).'
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ROL_PROPIETARIOS)) {
      return interaction.reply({
        content: 'Solo el **Equipo de Propietarios** puede usar `/staff-clasificacion`.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const { embed } = await construirRankingSemanal(guild);

    const refExistente = await obtenerMensajeClasificacion(guild.id);
    if (refExistente) {
      try {
        const ch = await guild.channels.fetch(refExistente.channelId).catch(() => null);
        const msg = ch
          ? await ch.messages.fetch(refExistente.messageId).catch(() => null)
          : null;
        if (msg) {
          await msg.edit({ embeds: [embed] });
          return interaction.editReply({
            content:
              `Clasificación actualizada en el mensaje vivo: ${msg.url}\n` +
              `Solo hay **un** mensaje por servidor; se edita solo cuando hay actividad de cuotas.`
          });
        }
      } catch (_) {}
    }

    const enviado = await interaction.channel.send({ embeds: [embed] });
    await guardarMensajeClasificacion(guild.id, interaction.channel.id, enviado.id);

    return interaction.editReply({
      content:
        `Clasificación publicada.\n` +
        `Este mensaje se **actualizará automáticamente** al hostear, supervisar, cerrar tickets o cargar cuota.\n` +
        `Al reiniciar cuotas semanales, la tabla vuelve a cero.`
    });
  }
};
