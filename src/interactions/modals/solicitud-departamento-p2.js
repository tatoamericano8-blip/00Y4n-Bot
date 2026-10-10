import { EmbedBuilder, MessageFlags } from 'discord.js';
import {
  DEPARTAMENTOS,
  CANAL_FORMULARIOS,
  getSolicitudPending,
  clearSolicitudPending
} from '../../commands/Tools/solicitud-departamento.js';

/**
 * Modal parte 2 — customId: solicitud_depto2:KEY
 * Combina parte 1 + 2 y envía al canal de formularios.
 */
export default {
  name: 'solicitud_depto2',
  async execute(interaction, client, args = []) {
    const departamentoKey = args[0] || interaction.customId.split(':')[1];
    const dep = DEPARTAMENTOS[departamentoKey];

    if (!dep) {
      return interaction.reply({
        content: '❌ Departamento no reconocido.',
        flags: MessageFlags.Ephemeral
      });
    }

    const pending = getSolicitudPending(interaction.user.id);
    if (!pending || pending.departamentoKey !== departamentoKey) {
      return interaction.reply({
        content:
          '❌ No hay una **parte 1** válida o expiró.\n' +
          'Volvé a usar `/solicitud-departamento` y completá las dos partes.',
        flags: MessageFlags.Ephemeral
      });
    }

    const etica = interaction.fields.getTextInputValue('etica')?.trim() || '';
    const operativa = interaction.fields.getTextInputValue('operativa')?.trim() || '';
    const criterio = interaction.fields.getTextInputValue('criterio')?.trim() || '';
    const escenario = interaction.fields.getTextInputValue('escenario')?.trim() || '';
    const aporte = interaction.fields.getTextInputValue('aporte')?.trim() || '';

    const embed = new EmbedBuilder()
      .setColor(dep.color)
      .setTitle(`${dep.emoji} Nueva solicitud – ${dep.nombre}`)
      .setDescription(
        `**Postulante:** <@${interaction.user.id}>\n` +
          `**Usuario:** \`${interaction.user.tag}\`\n` +
          `**ID:** \`${interaction.user.id}\`\n` +
          `**Departamento:** ${dep.nombre}`
      )
      .addFields(
        { name: '📅 Edad aproximada', value: pending.edad.slice(0, 1024) || '—', inline: true },
        { name: '🎙️ Micrófono', value: pending.mic.slice(0, 1024) || '—', inline: true },
        { name: '⏰ Experiencia y disponibilidad', value: pending.experiencia.slice(0, 1024) || '—' },
        { name: '🎯 ¿Por qué este departamento?', value: pending.motivacion.slice(0, 1024) || '—' },
        { name: '👥 Órdenes y trabajo en equipo', value: pending.cadena.slice(0, 1024) || '—' },
        { name: '⚖️ Ética / conducta', value: etica.slice(0, 1024) || '—' },
        { name: '🔧 Operativa del depto', value: operativa.slice(0, 1024) || '—' },
        { name: '🧠 Criterio', value: criterio.slice(0, 1024) || '—' },
        { name: '🚨 Escenario de emergencia', value: escenario.slice(0, 1024) || '—' },
        { name: '🤝 Aporte al departamento', value: aporte.slice(0, 1024) || '—' },
        {
          name: '📋 Rúbrica sugerida (staff)',
          value:
            'Disponibilidad · Motivación · Cadena de mando · Ética · Criterio operativo · Escenario — cada uno **1 a 5**.'
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: '00Y4n Comunidad SWFL • Solicitudes de Departamentos (2/2)',
        iconURL: interaction.guild?.iconURL()
      })
      .setTimestamp();

    const canal =
      interaction.guild.channels.cache.get(CANAL_FORMULARIOS) ||
      (await interaction.guild.channels.fetch(CANAL_FORMULARIOS).catch(() => null));

    if (!canal) {
      return interaction.reply({
        content: '❌ No se encontró el canal de formularios. Avisá a un administrador.',
        flags: MessageFlags.Ephemeral
      });
    }

    await canal.send({ embeds: [embed] });
    clearSolicitudPending(interaction.user.id);

    return interaction.reply({
      content:
        `✅ Tu solicitud para **${dep.nombre}** fue enviada correctamente.\n` +
        `El equipo la revisará pronto. ¡Éxitos!`,
      flags: MessageFlags.Ephemeral
    });
  }
};
