import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { obtenerHistorialFinanciero } from '../../utils/gestorAuditoriaFinanciera.js';
import { obtenerSaldo } from '../../utils/gestorEconomia.js';

export default {
  data: new SlashCommandBuilder()
    .setName('auditoria-financiera')
    .setDescription('Ver el historial financiero (auditoría) de un usuario.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a auditar.').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt
        .setName('cantidad')
        .setDescription('Cantidad de movimientos a mostrar (máx 25).')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> Solo **Administradores** pueden ver la auditoría financiera.',
        flags: MessageFlags.Ephemeral
      });
    }

    const target = interaction.options.getUser('usuario');
    const limite = interaction.options.getInteger('cantidad') || 15;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const saldo = await obtenerSaldo(target.id);
    const historial = await obtenerHistorialFinanciero(target.id, limite);

    if (!historial.length) {
      return interaction.editReply({
        content:
          `📋 **Auditoría de <@${target.id}>**\n` +
          `> Saldo actual: **$${saldo.toLocaleString('es-AR')}**\n` +
          `> Sin movimientos registrados aún (el log empieza a contar desde ahora).`
      });
    }

    const lineas = historial.map((m, i) => {
      const signo = m.monto >= 0 ? '+' : '';
      const fecha = m.fecha ? `<t:${Math.floor(new Date(m.fecha).getTime() / 1000)}:d>` : '—';
      const por = m.executorId ? ` · por <@${m.executorId}>` : '';
      const motivo = m.motivo ? ` — ${m.motivo}` : '';
      return `**${i + 1}.** \`${m.tipo}\` ${signo}$${Number(m.monto).toLocaleString('es-AR')} → $${Number(m.saldoNuevo).toLocaleString('es-AR')} (${fecha})${motivo}${por}`;
    });

    const embed = new EmbedBuilder()
      .setColor('#74d4fc')
      .setTitle(`📋 Auditoría Financiera — ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `> **Saldo actual:** $${saldo.toLocaleString('es-AR')}\n` +
          `> **Movimientos mostrados:** ${historial.length}\n\n` +
          lineas.join('\n').slice(0, 4000)
      )
      .setFooter({ text: '00Y4n Comunidad SWFL • Solo movimientos desde la activación del log' })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
