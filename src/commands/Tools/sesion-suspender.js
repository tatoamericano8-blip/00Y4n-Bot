import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import {
  suspenderSesiones,
  quitarSuspension,
  obtenerSuspension
} from '../../utils/gestorSesionesRestricciones.js';

const ROLE_HIGH_COMMAND = '1528870731629465752';
const ROLE_SUSPEND = '1533180544630788166';
const CANAL_LOGS = '1533132365814169820';
const DIAS_DEFAULT = 3;
const DIAS_MAX = 15;

export default {
  data: new SlashCommandBuilder()
    .setName('sesion-suspender')
    .setDescription('Suspende a un miembro de las sesiones por un tiempo limitado.')
    .addSubcommand(sub =>
      sub
        .setName('aplicar')
        .setDescription('Suspender a un miembro de las sesiones.')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a suspender.').setRequired(true))
        .addStringOption(o => o.setName('motivo').setDescription('Motivo de la suspensión.').setRequired(true))
        .addIntegerOption(o =>
          o
            .setName('dias')
            .setDescription(`Días de suspensión (default ${DIAS_DEFAULT}, máx ${DIAS_MAX}).`)
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(DIAS_MAX)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remover')
        .setDescription('Quitar la suspensión de sesiones anticipadamente.')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario.').setRequired(true))
    ),

  async execute(interaction) {
    if (
      !interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> Solo **Alto Comando** puede suspender de sesiones.',
        flags: MessageFlags.Ephemeral
      });
    }

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('usuario');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (sub === 'aplicar') {
      const motivo = interaction.options.getString('motivo');
      const dias = interaction.options.getInteger('dias') || DIAS_DEFAULT;

      const data = await suspenderSesiones(interaction.guildId, target.id, {
        dias,
        motivo,
        por: interaction.user.id
      });

      if (member) {
        await member.roles.add(ROLE_SUSPEND).catch(() => null);
      }

      const hastaUnix = Math.floor(new Date(data.hasta).getTime() / 1000);

      const embed = new EmbedBuilder()
        .setColor('#faa61a')
        .setTitle('⏸️ Suspensión de Sesiones')
        .setDescription(
          `> **Usuario:** <@${target.id}>\n` +
            `> **Días:** **${dias}**\n` +
            `> **Hasta:** <t:${hastaUnix}:F> (<t:${hastaUnix}:R>)\n` +
            `> **Motivo:** ${motivo}\n` +
            `> **Por:** <@${interaction.user.id}>\n\n` +
            `El rol se quitará **automáticamente** al vencer.`
        )
        .setTimestamp();

      const logs = interaction.guild.channels.cache.get(CANAL_LOGS);
      if (logs) await logs.send({ embeds: [embed] });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'remover') {
      const prev = await quitarSuspension(interaction.guildId, target.id);
      if (!prev) {
        // Igual intentar quitar rol
        if (member) await member.roles.remove(ROLE_SUSPEND).catch(() => null);
        return interaction.reply({
          content: `<:cruz00y4n:1523041302764191844> <@${target.id}> no tenía una suspensión activa en DB.`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (member) await member.roles.remove(ROLE_SUSPEND).catch(() => null);

      const embed = new EmbedBuilder()
        .setColor('#57f287')
        .setTitle('✅ Suspensión de Sesiones Removida')
        .setDescription(
          `> **Usuario:** <@${target.id}>\n` +
            `> **Motivo original:** ${prev.motivo || '—'}\n` +
            `> **Removido por:** <@${interaction.user.id}>`
        )
        .setTimestamp();

      const logs = interaction.guild.channels.cache.get(CANAL_LOGS);
      if (logs) await logs.send({ embeds: [embed] });

      return interaction.reply({ embeds: [embed] });
    }
  }
};
