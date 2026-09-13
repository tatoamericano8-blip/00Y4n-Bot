import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';
import Investigacion from '../../../models/Investigacion.js';
import {
  ROL_EQUIPO_PROPIETARIOS,
  ROL_BAJO_INVESTIGACION,
  CANAL_LOG_INVESTIGACION,
  rolesRemoviblesInvestigacion,
  obtenerInvestigacionActiva
} from '../../utils/gestorInvestigaciones.js';
import { E } from '../../config/emojis.js';
import { PRIMARIO } from '../../utils/colores.js';

function puedeInvestigar(member) {
  return (
    member.roles.cache.has(ROL_EQUIPO_PROPIETARIOS) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

async function enviarLog(guild, embed) {
  const ch = await guild.channels.fetch(CANAL_LOG_INVESTIGACION).catch(() => null);
  if (ch?.isTextBased()) {
    await ch.send({ embeds: [embed] }).catch(() => null);
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('investigacion')
    .setDescription('Sistema de investigación: quita roles y asigna Bajo investigación.')
    .addSubcommand((sc) =>
      sc
        .setName('iniciar')
        .setDescription('Inicia una investigación sobre un miembro.')
        .addUserOption((o) =>
          o.setName('usuario').setDescription('Miembro a investigar').setRequired(true)
        )
        .addStringOption((o) =>
          o.setName('motivo').setDescription('Motivo de la investigación').setRequired(true)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('finalizar')
        .setDescription('Finaliza la investigación y restaura los roles guardados.')
        .addUserOption((o) =>
          o.setName('usuario').setDescription('Miembro a restaurar').setRequired(true)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('consultar')
        .setDescription('Consulta si un miembro está bajo investigación activa.')
        .addUserOption((o) =>
          o.setName('usuario').setDescription('Miembro a consultar').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!puedeInvestigar(interaction.member)) {
      return interaction.reply({
        content:
          E.cruz +
          ' Solo **Equipo de Propietarios** puede usar `/investigacion`.',
        flags: MessageFlags.Ephemeral
      });
    }

    const sub = interaction.options.getSubcommand();
    if (sub === 'iniciar') return ejecutarIniciar(interaction);
    if (sub === 'finalizar') return ejecutarFinalizar(interaction);
    if (sub === 'consultar') return ejecutarConsultar(interaction);
  }
};

async function ejecutarIniciar(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const targetUser = interaction.options.getUser('usuario');
  const motivo = interaction.options.getString('motivo')?.trim();

  if (!motivo) {
    return interaction.editReply({ content: E.cruz + ' Debés indicar un motivo.' });
  }

  if (targetUser.bot) {
    return interaction.editReply({ content: E.cruz + ' No podés investigar a un bot.' });
  }

  if (targetUser.id === interaction.user.id) {
    return interaction.editReply({
      content: E.cruz + ' No podés iniciar una investigación sobre vos mismo.'
    });
  }

  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
  if (!member) {
    return interaction.editReply({
      content: E.cruz + ' El usuario no está en el servidor.'
    });
  }

  if (member.roles.cache.has(ROL_EQUIPO_PROPIETARIOS)) {
    return interaction.editReply({
      content: E.cruz + ' No podés investigar a un miembro del **Equipo de Propietarios**.'
    });
  }

  const yaActiva = await obtenerInvestigacionActiva(interaction.guildId, targetUser.id);
  if (yaActiva) {
    return interaction.editReply({
      content:
        E.warn +
        ` <@${targetUser.id}> ya tiene una investigación **activa**.\n` +
        `Motivo: ${yaActiva.motivo}\n` +
        `Iniciada: <t:${Math.floor(new Date(yaActiva.iniciadoEn).getTime() / 1000)}:R>\n` +
        `Usá \`/investigacion finalizar\` para cerrarla.`
    });
  }

  const rolInv =
    interaction.guild.roles.cache.get(ROL_BAJO_INVESTIGACION) ||
    (await interaction.guild.roles.fetch(ROL_BAJO_INVESTIGACION).catch(() => null));

  if (!rolInv) {
    return interaction.editReply({
      content:
        E.cruz +
        ' No se encontró el rol **Bajo investigación**. Verificá que el ID sea correcto.'
    });
  }

  const botMember =
    interaction.guild.members.me ||
    (await interaction.guild.members.fetchMe().catch(() => null));

  if (!botMember?.permissions?.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.editReply({
      content: E.cruz + ' El bot necesita el permiso **Gestionar roles**.'
    });
  }

  if (rolInv.position >= botMember.roles.highest.position) {
    return interaction.editReply({
      content:
        E.cruz +
        ' El rol **Bajo investigación** está por encima (o al mismo nivel) del rol más alto del bot. Subí el rol del bot en la jerarquía.'
    });
  }

  const removibles = rolesRemoviblesInvestigacion(member, botMember, rolInv.id);
  const rolesGuardados = [...removibles.keys()];

  try {
    if (rolesGuardados.length) {
      await member.roles.remove(rolesGuardados, `Investigación: ${motivo}`);
    }
    await member.roles.add(rolInv, `Investigación: ${motivo}`);
  } catch (e) {
    return interaction.editReply({
      content:
        `${E.cruz} Error al cambiar roles: **${e.message}**\n` +
        `-# Revisá jerarquía de roles y permisos del bot.`
    });
  }

  await Investigacion.create({
    guildId: interaction.guildId,
    userId: targetUser.id,
    motivo,
    iniciadoPor: interaction.user.id,
    rolesGuardados,
    activa: true,
    iniciadoEn: new Date()
  });

  const embed = new EmbedBuilder()
    .setColor('#faa61a')
    .setTitle(`${E.warn} Investigación iniciada`)
    .setDescription(
      `**Usuario:** <@${targetUser.id}> (\`${targetUser.id}\`)\n` +
        `**Motivo:** ${motivo}\n` +
        `**Roles quitados:** ${rolesGuardados.length}\n` +
        `**Rol asignado:** <@&${rolInv.id}>\n` +
        `**Iniciada por:** <@${interaction.user.id}>\n` +
        `**Restauración:** solo manual (\`/investigacion finalizar\`)`
    )
    .setTimestamp()
    .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

  await interaction.editReply({ embeds: [embed] });
  await enviarLog(interaction.guild, embed);

  try {
    await targetUser
      .send(
        `${E.warn} **Investigación en Southwest Florida 00Y4n**\n\n` +
          `Se inició una investigación sobre tu cuenta.\n` +
          `**Motivo:** ${motivo}\n\n` +
          `Se te quitaron los roles y se te asignó **Bajo investigación**.\n` +
          `Podés seguir abriendo y escribiendo en tickets de asistencia.\n` +
          `Si creés que es un error, contactá al Equipo de Propietarios.`
      )
      .catch(() => null);
  } catch (_) {}
}

async function ejecutarFinalizar(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const targetUser = interaction.options.getUser('usuario');
  const doc = await obtenerInvestigacionActiva(interaction.guildId, targetUser.id);

  if (!doc) {
    return interaction.editReply({
      content: E.warn + ` <@${targetUser.id}> no tiene una investigación **activa**.`
    });
  }

  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
  const rolInv =
    interaction.guild.roles.cache.get(ROL_BAJO_INVESTIGACION) ||
    (await interaction.guild.roles.fetch(ROL_BAJO_INVESTIGACION).catch(() => null));

  let errorRoles = null;

  if (member) {
    try {
      if (rolInv && member.roles.cache.has(rolInv.id)) {
        await member.roles.remove(rolInv, 'Investigación finalizada');
      }
      const rolesOk = (doc.rolesGuardados || []).filter((id) =>
        interaction.guild.roles.cache.has(id)
      );
      if (rolesOk.length) {
        await member.roles.add(rolesOk, 'Investigación finalizada — restauración de roles');
      }
    } catch (e) {
      errorRoles = e.message;
    }
  }

  doc.activa = false;
  doc.finalizadoPor = interaction.user.id;
  doc.finalizadoEn = new Date();
  await doc.save();

  const embed = new EmbedBuilder()
    .setColor(PRIMARIO)
    .setTitle(`${E.tilde} Investigación finalizada`)
    .setDescription(
      `**Usuario:** <@${targetUser.id}> (\`${targetUser.id}\`)\n` +
        `**Motivo original:** ${doc.motivo}\n` +
        `**Roles restaurados:** ${(doc.rolesGuardados || []).length}\n` +
        `**Finalizada por:** <@${interaction.user.id}>\n` +
        `**Iniciada:** <t:${Math.floor(new Date(doc.iniciadoEn).getTime() / 1000)}:f>` +
        (errorRoles
          ? `\n\n${E.warn} **Aviso:** la investigación se cerró en base de datos, pero falló la restauración de roles: \`${errorRoles}\`\n-# Revisá jerarquía del bot.`
          : '')
    )
    .setTimestamp()
    .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

  await interaction.editReply({ embeds: [embed] });
  await enviarLog(interaction.guild, embed);

  if (member && !errorRoles) {
    try {
      await targetUser
        .send(
          `${E.tilde} **Investigación finalizada — Southwest Florida 00Y4n**\n\n` +
            `Tu investigación fue cerrada y se restauraron tus roles.\n` +
            `Si tenés dudas, abrí un ticket de asistencia.`
        )
        .catch(() => null);
    } catch (_) {}
  }
}

async function ejecutarConsultar(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const targetUser = interaction.options.getUser('usuario');
  const doc = await obtenerInvestigacionActiva(interaction.guildId, targetUser.id);

  if (!doc) {
    return interaction.editReply({
      content: `${E.dot} <@${targetUser.id}> **no** tiene una investigación activa.`
    });
  }

  const embed = new EmbedBuilder()
    .setColor('#faa61a')
    .setTitle(`${E.warn} Investigación activa`)
    .setDescription(
      `**Usuario:** <@${targetUser.id}> (\`${targetUser.id}\`)\n` +
        `**Motivo:** ${doc.motivo}\n` +
        `**Roles guardados:** ${(doc.rolesGuardados || []).length}\n` +
        `**Iniciada por:** <@${doc.iniciadoPor}>\n` +
        `**Iniciada:** <t:${Math.floor(new Date(doc.iniciadoEn).getTime() / 1000)}:f> · <t:${Math.floor(new Date(doc.iniciadoEn).getTime() / 1000)}:R>`
    )
    .setTimestamp()
    .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

  return interaction.editReply({ embeds: [embed] });
}
