import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';
import Restriccion from '../../../models/Restriccion.js';
import {
  obtenerOCrearRolRestringido,
  listarRestriccionesVencidas,
  obtenerRestriccionActiva
} from '../../utils/gestorRestricciones.js';

const ROL_ALTO_COMANDO = '1528870731629465752';
const CANAL_LOG = '1505015805891579934';

async function limpiarUna(guild, doc, client) {
  const member = await guild.members.fetch(doc.userId).catch(() => null);
  let rolRestringido = null;
  try {
    rolRestringido = await obtenerOCrearRolRestringido(guild);
  } catch (_) {}

  if (member) {
    try {
      if (rolRestringido && member.roles.cache.has(rolRestringido.id)) {
        await member.roles.remove(rolRestringido, 'Restricción vencida — limpieza automática');
      }
      const rolesOk = (doc.rolesGuardados || []).filter(id => guild.roles.cache.has(id));
      if (rolesOk.length) {
        await member.roles.add(rolesOk, 'Restricción vencida — restauración');
      }
    } catch (_) {}
  }

  doc.activa = false;
  await doc.save();

  try {
    const user = await client.users.fetch(doc.userId).catch(() => null);
    if (user) {
      await user.send(
        `✅ **Restricción vencida en 00Y4n**\n\n` +
        `Tu restricción expiró y se intentaron restaurar tus roles.`
      ).catch(() => null);
    }
  } catch (_) {}
}

export default {
  data: new SlashCommandBuilder()
    .setName('restricciones')
    .setDescription('Consulta o limpia restricciones del servidor.')
    .addSubcommand(sub =>
      sub
        .setName('verificar')
        .setDescription('Limpia restricciones vencidas y restaura roles.')
    )
    .addSubcommand(sub =>
      sub
        .setName('consultar')
        .setDescription('Ver si un usuario tiene restricción activa.')
        .addUserOption(o =>
          o.setName('usuario').setDescription('Usuario a consultar').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (
      !interaction.member.roles.cache.has(ROL_ALTO_COMANDO) &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: '<:cruz:1534937767652495360> Solo **Alto Comando** puede usar `/restricciones`.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const sub = interaction.options.getSubcommand();

    if (sub === 'consultar') {
      const target = interaction.options.getUser('usuario');
      const r = await obtenerRestriccionActiva(interaction.guildId, target.id);
      if (!r) {
        const vencida = await Restriccion.findOne({
          guildId: interaction.guildId,
          userId: target.id,
          activa: true,
          permanente: false,
          expiraEn: { $lte: new Date() }
        });
        if (vencida) {
          await limpiarUna(interaction.guild, vencida, interaction.client);
          return interaction.editReply({
            content: `<@${target.id}> tenía restricción **vencida**; se limpió y se restauraron roles.`
          });
        }
        return interaction.editReply({
          content: `<@${target.id}> **no** tiene restricción activa.`
        });
      }

      const expira = r.permanente
        ? 'Permanente'
        : r.expiraEn
          ? `<t:${Math.floor(new Date(r.expiraEn).getTime() / 1000)}:F>`
          : '—';

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#992d22')
            .setTitle('Restricción activa')
            .setDescription(
              `**Usuario:** <@${target.id}>\n` +
              `**Motivo:** ${r.motivo}\n` +
              `**Expira:** ${expira}\n` +
              `**Aplicado por:** <@${r.aplicadoPor}>\n` +
              `**Roles guardados:** ${(r.rolesGuardados || []).length}`
            )
            .setTimestamp()
        ]
      });
    }

    const vencidas = await listarRestriccionesVencidas(interaction.guildId);
    let limpiadas = 0;
    for (const doc of vencidas) {
      await limpiarUna(interaction.guild, doc, interaction.client);
      limpiadas += 1;
    }

    const embed = new EmbedBuilder()
      .setColor('#57f287')
      .setTitle('Verificación de restricciones')
      .setDescription(
        limpiadas === 0
          ? 'No había restricciones vencidas pendientes.'
          : `Se limpiaron **${limpiadas}** restricción(es) vencida(s) y se restauraron roles cuando fue posible.`
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    if (limpiadas > 0) {
      const logCh = await interaction.guild.channels.fetch(CANAL_LOG).catch(() => null);
      if (logCh?.isTextBased()) {
        await logCh.send({ embeds: [embed] }).catch(() => null);
      }
    }
  }
};
