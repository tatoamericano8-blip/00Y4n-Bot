import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { E } from '../../config/emojis.js';

export default {
  // customId: roleall_confirm:ROLEID:USERID
  name: 'roleall_confirm',

  async execute(interaction) {
    const parts = interaction.customId.split(':');
    const roleId = parts[1];
    const ownerId = parts[2];

    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: E.cruz + ' Solo quien ejecutó el comando puede confirmar.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: E.cruz + ' Permisos insuficientes.',
        flags: MessageFlags.Ephemeral
      });
    }

    const rol = await interaction.guild.roles.fetch(roleId).catch(() => null);
    if (!rol) {
      return interaction.update({
        content: E.cruz + ' El rol ya no existe.',
        embeds: [],
        components: []
      });
    }

    await interaction.update({
      content: `⏳ Asignando ${rol} a todos los miembros (excluyendo bots)... Esto puede tardar.`,
      embeds: [],
      components: []
    });

    let ok = 0;
    let fail = 0;
    let skipped = 0;

    const members = await interaction.guild.members.fetch();
    for (const [, member] of members) {
      if (member.user.bot) {
        skipped++;
        continue;
      }
      if (member.roles.cache.has(rol.id)) {
        skipped++;
        continue;
      }
      try {
        await member.roles.add(rol, `Roleall por ${interaction.user.tag}`);
        ok++;
      } catch {
        fail++;
      }
    }

    await interaction.followUp({
      content:
        `${E.tilde} **Roleall finalizado**\n` +
        `> Rol: ${rol}\n` +
        `> Asignados: **${ok}**\n` +
        `> Omitidos (bots/ya lo tenían): **${skipped}**\n` +
        `> Fallidos: **${fail}**`,
      flags: MessageFlags.Ephemeral
    });
  }
};
