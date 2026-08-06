import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import {
  agregarBlacklistSesiones,
  removerBlacklistSesiones,
  estaEnBlacklistSesiones,
  obtenerBlacklistSesiones
} from '../../utils/gestorSesionesRestricciones.js';

const ROLE_HIGH_COMMAND = '1528870731629465752';
const CANAL_LOGS = '1517331229303902432';

export default {
  data: new SlashCommandBuilder()
    .setName('sesion-blacklist')
    .setDescription('Blacklist permanente de sesiones (bloquea todo).')
    .addSubcommand(sub =>
      sub
        .setName('añadir')
        .setDescription('Añadir a un usuario a la blacklist de sesiones.')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a bloquear.').setRequired(true))
        .addStringOption(o => o.setName('motivo').setDescription('Motivo del blacklist.').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('remover')
        .setDescription('Quitar a un usuario de la blacklist de sesiones.')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a desbloquear.').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('verificar')
        .setDescription('Ver si un usuario está en blacklist de sesiones.')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar.').setRequired(true))
    ),

  async execute(interaction) {
    if (
      !interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> Solo **Alto Comando** puede gestionar la blacklist de sesiones.',
        flags: MessageFlags.Ephemeral
      });
    }

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('usuario');
    const guildId = interaction.guildId;

    if (sub === 'añadir') {
      const motivo = interaction.options.getString('motivo');
      if (await estaEnBlacklistSesiones(guildId, target.id)) {
        return interaction.reply({
          content: `<:warn00y4n:1523041352714158240> <@${target.id}> ya está en la blacklist de sesiones.`,
          flags: MessageFlags.Ephemeral
        });
      }

      await agregarBlacklistSesiones(guildId, target.id, {
        motivo,
        por: interaction.user.id
      });

      const embed = new EmbedBuilder()
        .setColor('#ed4245')
        .setTitle('<:cruz:1534937767652495360> Blacklist de Sesiones — Añadido')
        .setDescription(
          `> <:dot:1534938142665084938> **Usuario:** <@${target.id}> (\`${target.id}\`)\n` +
            `> <:dot:1534938142665084938> **Motivo:** ${motivo}\n` +
            `> <:dot:1534938142665084938> **Por:** <@${interaction.user.id}>\n` +
            `> <:dot:1534938142665084938> **Efecto:** Bloqueo **permanente** de toda actividad de sesiones.`
        )
        .setTimestamp();

      const logs = interaction.guild.channels.cache.get(CANAL_LOGS);
      if (logs) await logs.send({ embeds: [embed] });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'remover') {
      const prev = await removerBlacklistSesiones(guildId, target.id);
      if (!prev) {
        return interaction.reply({
          content: `<:cruz00y4n:1523041302764191844> <@${target.id}> no está en la blacklist.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#57f287')
        .setTitle('<:lista:1534938422202994755> Blacklist de Sesiones — Removido')
        .setDescription(
          `> <:dot:1534938142665084938> **Usuario:** <@${target.id}>\n` +
            `> <:dot:1534938142665084938> **Motivo original:** ${prev.motivo || '—'}\n` +
            `> <:dot:1534938142665084938> **Removido por:** <@${interaction.user.id}>`
        )
        .setTimestamp();

      const logs = interaction.guild.channels.cache.get(CANAL_LOGS);
      if (logs) await logs.send({ embeds: [embed] });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'verificar') {
      const bl = await obtenerBlacklistSesiones(guildId);
      const entry = bl[target.id];
      if (!entry) {
        return interaction.reply({
          content: `<a:verificacion:1523027148326047878> <@${target.id}> **no** está en la blacklist de sesiones.`,
          flags: MessageFlags.Ephemeral
        });
      }
      return interaction.reply({
        content:
          `<:lock:1534938648665915577> <@${target.id}> **SÍ** está en blacklist.\n` +
          `> Motivo: ${entry.motivo}\n` +
          `> Desde: <t:${Math.floor(new Date(entry.fecha).getTime() / 1000)}:F>\n` +
          `> Por: <@${entry.por}>`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
