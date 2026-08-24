import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';
import Restriccion from '../../../models/Restriccion.js';
import {
  obtenerOCrearRolRestringido,
  parseDuracionRestriccion,
  rolesRemovibles,
  obtenerRestriccionActiva
} from '../../utils/gestorRestricciones.js';

const ROL_ALTO_COMANDO = '1528870731629465752';
const CANAL_LOG = '1505015805891579934';

export default {
  data: new SlashCommandBuilder()
    .setName('restringir')
    .setDescription('Aplica restricción a un miembro (quita roles y asigna rol Restringido).')
    .addUserOption(o =>
      o.setName('usuario').setDescription('Miembro a restringir').setRequired(true)
    )
    .addStringOption(o =>
      o
        .setName('duracion')
        .setDescription('Duración de la restricción')
        .setRequired(true)
        .addChoices(
          { name: '1 hora', value: '1h' },
          { name: '6 horas', value: '6h' },
          { name: '12 horas', value: '12h' },
          { name: '1 día', value: '1d' },
          { name: '7 días', value: '7d' },
          { name: 'Permanente', value: 'permanente' }
        )
    )
    .addStringOption(o =>
      o.setName('motivo').setDescription('Motivo de la restricción').setRequired(true)
    ),

  async execute(interaction) {
    if (
      !interaction.member.roles.cache.has(ROL_ALTO_COMANDO) &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: '<:cruz:1534937767652495360> Solo **Alto Comando** puede usar `/restringir`.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const targetUser = interaction.options.getUser('usuario');
    const motivo = interaction.options.getString('motivo');
    const duracionRaw = interaction.options.getString('duracion');
    const parsed = parseDuracionRestriccion(duracionRaw);

    if (!parsed.ok) {
      return interaction.editReply({ content: 'Duración inválida.' });
    }

    if (targetUser.bot) {
      return interaction.editReply({ content: 'No podés restringir a un bot.' });
    }

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.editReply({ content: 'El usuario no está en el servidor.' });
    }

    if (member.roles.cache.has(ROL_ALTO_COMANDO) || member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.editReply({
        content: 'No podés restringir a Alto Comando / administradores.'
      });
    }

    const ya = await obtenerRestriccionActiva(interaction.guildId, targetUser.id);
    if (ya) {
      return interaction.editReply({
        content: `<@${targetUser.id}> ya tiene una restricción **activa**. Usá \`/desrestringir\` primero.`
      });
    }

    const botMember = interaction.guild.members.me
      || await interaction.guild.members.fetchMe().catch(() => null);

    let rolRestringido;
    try {
      rolRestringido = await obtenerOCrearRolRestringido(interaction.guild);
    } catch (e) {
      return interaction.editReply({
        content:
          `<:cruz:1534937767652495360> No se pudo crear/obtener el rol Restringido: **${e.message}**\n` +
          `-# El bot necesita **Gestionar roles**.`
      });
    }

    if (botMember && rolRestringido.position >= botMember.roles.highest.position) {
      return interaction.editReply({
        content:
          '<:cruz:1534937767652495360> El rol **Restringido | 00Y4n** está por encima (o al mismo nivel) del rol más alto del bot. Subí el rol del bot en la lista de roles.'
      });
    }

    const removibles = rolesRemovibles(member, botMember, rolRestringido.id);
    const rolesGuardados = [...removibles.keys()];

    try {
      if (rolesGuardados.length) {
        await member.roles.remove(rolesGuardados, `Restricción: ${motivo}`);
      }
      await member.roles.add(rolRestringido, `Restricción: ${motivo}`);
    } catch (e) {
      return interaction.editReply({
        content:
          `<:cruz:1534937767652495360> Error al cambiar roles: **${e.message}**\n` +
          `-# Revisá jerarquía de roles y permisos del bot.`
      });
    }

    await Restriccion.create({
      guildId: interaction.guildId,
      userId: targetUser.id,
      motivo,
      aplicadoPor: interaction.user.id,
      rolesGuardados,
      permanente: parsed.permanente,
      expiraEn: parsed.expiraEn,
      activa: true,
      aplicadoEn: new Date()
    });

    const expiraTxt = parsed.permanente
      ? '**Permanente**'
      : `<t:${Math.floor(parsed.expiraEn.getTime() / 1000)}:R>`;

    const embed = new EmbedBuilder()
      .setColor('#992d22')
      .setTitle('Restricción aplicada')
      .setDescription(
        `**Usuario:** <@${targetUser.id}>\n` +
        `**Duración:** ${parsed.label}\n` +
        `**Expira:** ${expiraTxt}\n` +
        `**Motivo:** ${motivo}\n` +
        `**Roles quitados:** ${rolesGuardados.length}\n` +
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
        `⚠️ **Restricción en 00Y4n**\n\n` +
        `Se te aplicó una restricción en el servidor.\n` +
        `**Motivo:** ${motivo}\n` +
        `**Duración:** ${parsed.label}\n` +
        `**Expira:** ${expiraTxt}\n\n` +
        `Se te quitaron los roles y se te asignó el rol de restringido. ` +
        `Si creés que es un error, abrí un ticket cuando puedas o contactá a Alto Comando.`
      ).catch(() => null);
    } catch (_) {}
  }
};
