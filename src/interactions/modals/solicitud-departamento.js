import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import {
  DEPARTAMENTOS,
  setSolicitudPending
} from '../../commands/Tools/solicitud-departamento.js';

/**
 * Modal parte 1 — customId: solicitud_depto:KEY
 * Guarda respuestas y ofrece botón para abrir parte 2.
 */
export default {
  name: 'solicitud_depto',
  async execute(interaction, client, args = []) {
    const departamentoKey = args[0] || interaction.customId.split(':')[1];
    const dep = DEPARTAMENTOS[departamentoKey];

    if (!dep) {
      return interaction.reply({
        content: '❌ Departamento no reconocido.',
        flags: MessageFlags.Ephemeral
      });
    }

    const edad = interaction.fields.getTextInputValue('edad')?.trim() || '';
    const mic = interaction.fields.getTextInputValue('mic')?.trim() || '';
    const experiencia = interaction.fields.getTextInputValue('experiencia')?.trim() || '';
    const motivacion = interaction.fields.getTextInputValue('motivacion')?.trim() || '';
    const cadena = interaction.fields.getTextInputValue('cadena')?.trim() || '';

    setSolicitudPending(interaction.user.id, {
      departamentoKey,
      edad,
      mic,
      experiencia,
      motivacion,
      cadena
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`solicitud_depto_p2:${departamentoKey}:${interaction.user.id}`)
        .setLabel('Continuar parte 2')
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      content:
        `✅ **Parte 1/2 guardada** para **${dep.nombre}**.\n` +
        `Tocá el botón para completar la **parte 2** (preguntas del departamento).\n` +
        `-# Tenés **15 minutos**. Si expira, volvé a usar \`/solicitud-departamento\`.`,
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
};
