import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';
import Restriccion from '../../../models/Restriccion.js';
import {
  obtenerOCrearRolRestringido,
  obtenerRestriccionActiva
} from '../../utils/gestorRestricciones.js';

const ROL_ALTO_COMANDO = '1528870731629465752';
const CANAL_LOG = '1505015805891579934';

export default {
  data: new SlashCommandBuilder()
    .setName('desrestringir')
    .setDescription('Quita la restricción a un miembro y restaura roles guardados.')
    .addUserOption(o =>
      o.setName('usuario').setDescription('Miembro a desrestringir').setRequired(true)
    ),

  async execute(interaction) {
    if (
      !interaction.member.roles.cache.has(ROL_ALTO_COMANDO) &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: '<:cruz:1534937767652495360> Solo **Alto Comando** puede usar `/desrestringir`.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const targetUser = interaction.options.getUser('usuario');
    const restriccion = await obtenerRestriccionActiva(interaction.guildId, targetUser.id);

    const doc =
      restriccion ||
      (await Restriccion.findOne({
        guildId: interaction.guildId,
        userId: targetUser.id,
        activa: true
      }).sort({ createdAt: -1 }));

    if (!doc) {
      return interaction.editReply({
        content: `<@${targetUser.id}> no tiene una restricción activa en el sistema.`
      });
    }

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    let rolRestringido = null;
    try {
      rolRestringido = await obtenerOCrearRolRestringido(interaction.guild);
    } catch (_) {}

    if (member) {
      try {
        if (rolRestringido && member.roles.cache.has(rolRestringido.id)) {
          await member.roles.remove(rolRestringido, 'Desrestricción');
        }
        const rolesOk = (doc.rolesGuardados || []).filter(id =>
          interaction.guild.roles.cache.has(id)
        );
        if (rolesOk.length) {
          await member.roles.add(rolesOk, 'Desrestricción — restauración de roles');
        }
      } catch (e) {
        await interaction.editReply({
          content:
            `<:warn:1534937002695327837> Restricción marcada como inactiva, pero falló la restauración de roles: **${e.message}**\n` +
            `-# Revisá jerarquía del bot.`
        });
        doc.activa = false;
        await doc.save();
        return;
      }
    }

    doc.activa = false;
    await doc.save();

    const embed = new EmbedBuilder()
      .setColor('#57f287')
      .setTitle('Restricción removida')
      .setDescription(
        `**Usuario:** <@${targetUser.id}>\n` +
        `**Motivo original:** ${doc.motivo}\n` +
        `**Roles restaurados:** ${(doc.rolesGuardados || []).length}\n` +
        `**Por:** <@${interaction.user.id}>`
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    const logCh = await interaction.guild.channels.fetch(CANAL_LOG).catch(() => null);
    if (logCh?.isTextBased()) {
      await logCh.send({ embeds: [embed] }).catch(() => null);
    }

    try {
      await targetUser.send(
        `✅ **Restricción levantada en 00Y4n**\n\n` +
        `Tu restricción fue removida y se intentaron restaurar tus roles.\n` +
        `Si falta algún rol, contactá a Alto Comando.`
      ).catch(() => null);
    } catch (_) {}
  }
};
