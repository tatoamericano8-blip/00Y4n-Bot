import { PermissionFlagsBits, MessageFlags, SlashCommandBuilder } from 'discord.js';

const ROLE_ALTO_COMANDO = '1528870731629465752';

export default {
    data: new SlashCommandBuilder()
        .setName('decir')
        .setDescription('Haz que el bot envíe un mensaje normal en el canal actual. (Solo Alto Comando)')
        .addStringOption(opt =>
            opt.setName('mensaje')
                .setDescription('El texto que quieres que el bot diga.')
                .setRequired(true))
        .addAttachmentOption(opt =>
            opt.setName('imagen')
                .setDescription('Adjuntar una imagen al mensaje (Opcional)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const esAltoComando =
            interaction.member.roles.cache.has(ROLE_ALTO_COMANDO) ||
            interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!esAltoComando) {
            return await interaction.reply({
                content: '<:cruz00y4n:1534937767652495360> **Sin acceso:** Solo **Alto Comando** puede usar `/decir`.',
                flags: MessageFlags.Ephemeral
            });
        }

        const texto = interaction.options.getString('mensaje');
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        const opcionesMensaje = { content: texto };
        if (fotoAdjunta) {
            opcionesMensaje.files = [fotoAdjunta.url];
        }

        await interaction.channel.send(opcionesMensaje);

        await interaction.reply({
            content: '<:tilde:1534937809733812286> Mensaje enviado como el bot.',
            flags: MessageFlags.Ephemeral
        });
    }
};
