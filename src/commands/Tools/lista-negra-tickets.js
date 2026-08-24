import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';
import TicketBlacklist from '../../../models/TicketBlacklist.js';

const ROL_ALTO_COMANDO = '1528870731629465752';
const CANAL_LOG = '1505015805891579934';

function parseDuracionDias(dias) {
  if (dias == null) return { permanente: true, expiraEn: null };
  const n = Number(dias);
  if (!Number.isFinite(n) || n <= 0) return { permanente: true, expiraEn: null };
  return {
    permanente: false,
    expiraEn: new Date(Date.now() + n * 24 * 60 * 60 * 1000)
  };
}

export default {
  data: new SlashCommandBuilder()
    .setName('lista-negra-tickets')
    .setDescription('Gestiona la lista negra de tickets (quién no puede abrir tickets).')
    .addSubcommand(sub =>
      sub
        .setName('añadir')
        .setDescription('Añade a un usuario a la lista negra de tickets.')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a bloquear').setRequired(true))
        .addStringOption(o => o.setName('motivo').setDescription('Motivo').setRequired(true))
        .addIntegerOption(o =>
          o
            .setName('dias')
            .setDescription('Duración en días (omitir = permanente)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(365)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('quitar')
        .setDescription('Quita a un usuario de la lista negra de tickets.')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a desbloquear').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('lista').setDescription('Muestra la lista negra de tickets actual.')
    ),

  async execute(interaction) {
    if (
      !interaction.member.roles.cache.has(ROL_ALTO_COMANDO) &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: '<:cruz:1534937767652495360> Solo **Alto Comando** puede gestionar la lista negra de tickets.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'añadir') {
      const target = interaction.options.getUser('usuario');
      const motivo = interaction.options.getString('motivo');
      const dias = interaction.options.getInteger('dias');
      const { permanente, expiraEn } = parseDuracionDias(dias);

      await TicketBlacklist.findOneAndUpdate(
        { guildId, userId: target.id },
        {
          motivo,
          aplicadoPor: interaction.user.id,
          permanente,
          expiraEn,
          aplicadoEn: new Date()
        },
        { upsert: true, new: true }
      );

      const expiraTxt = permanente
        ? '**Permanente**'
        : `<t:${Math.floor(expiraEn.getTime() / 1000)}:R>`;

      const embed = new EmbedBuilder()
        .setColor('#ed4245')
        .setTitle('Lista negra de tickets — añadido')
        .setDescription(
          `**Usuario:** <@${target.id}>\n` +
          `**Motivo:** ${motivo}\n` +
          `**Duración:** ${expiraTxt}\n` +
          `**Por:** <@${interaction.user.id}>`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      const logCh = await interaction.guild.channels.fetch(CANAL_LOG).catch(() => null);
      if (logCh?.isTextBased()) await logCh.send({ embeds: [embed] }).catch(() => null);

      try {
        await target.send(
          `⚠️ **Lista negra de tickets — 00Y4n**\n\n` +
          `No podés abrir tickets por ahora.\n` +
          `**Motivo:** ${motivo}\n` +
          `**Hasta:** ${expiraTxt}`
        ).catch(() => null);
      } catch (_) {}
      return;
    }

    if (sub === 'quitar') {
      const target = interaction.options.getUser('usuario');
      const deleted = await TicketBlacklist.findOneAndDelete({ guildId, userId: target.id });
      if (!deleted) {
        return interaction.editReply({
          content: `<@${target.id}> no estaba en la lista negra de tickets.`
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#57f287')
        .setTitle('Lista negra de tickets — removido')
        .setDescription(
          `**Usuario:** <@${target.id}>\n` +
          `**Por:** <@${interaction.user.id}>`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      const logCh = await interaction.guild.channels.fetch(CANAL_LOG).catch(() => null);
      if (logCh?.isTextBased()) await logCh.send({ embeds: [embed] }).catch(() => null);
      return;
    }

    const rows = await TicketBlacklist.find({ guildId }).sort({ aplicadoEn: -1 }).limit(40);
    const vigentes = [];
    for (const r of rows) {
      if (!r.permanente && r.expiraEn && r.expiraEn.getTime() <= Date.now()) {
        await TicketBlacklist.deleteOne({ _id: r._id });
        continue;
      }
      const hasta = r.permanente
        ? 'permanente'
        : `<t:${Math.floor(new Date(r.expiraEn).getTime() / 1000)}:d>`;
      vigentes.push(`• <@${r.userId}> — ${r.motivo.slice(0, 80)} · ${hasta}`);
    }

    const embed = new EmbedBuilder()
      .setColor('#fb8b66')
      .setTitle('Lista negra de tickets')
      .setDescription(
        vigentes.length
          ? vigentes.join('\n')
          : 'No hay usuarios en la lista negra.'
      )
      .setFooter({ text: `Total: ${vigentes.length}` })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
