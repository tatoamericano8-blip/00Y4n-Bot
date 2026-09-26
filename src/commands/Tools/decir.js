import { PermissionFlagsBits, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { E } from '../../config/emojis.js';

const ROLE_EQUIPO_PROPIETARIOS = '1528877296977711256';

export default {
    data: new SlashCommandBuilder()
        .setName('decir')
        .setDescription('Haz que el bot envíe un mensaje normal en el canal actual. (Solo Equipo de Propietarios)')
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
            interaction.member.roles.cache.has(ROLE_EQUIPO_PROPIETARIOS) ||
            interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!esAltoComando) {
            return await interaction.reply({
                content: E.cruz + ' **Sin acceso:** Solo el **Equipo de Propietarios** puede usar `/decir`.',
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
            content: E.tilde + ' Mensaje enviado como el bot.',
            flags: MessageFlags.Ephemeral
        });
    }
};
