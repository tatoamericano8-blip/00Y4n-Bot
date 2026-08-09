import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { guardarFastPass } from '../../utils/gestorFastPass.js';

const EMOJIS = {
    flechaH: '<:FlechaHoriz00Y4n:1519474590370500608>',
    flechaV: '<:Flecha_00Y4n:1519473149845045400>',
    coraaMov: '<a:coraamov00y4n:1519475012283666554>'
};

global.coleccionFastPass = global.coleccionFastPass || new Map();

const ROLES_VIP_IDS = [
    '1512120103771050005',
    '1503769793474597027',
    '1530287573547880581',
    '1529147327078469781'
];

export default {
    data: {
        name: 'fastpass_swfl',
        description: 'Lanza el anuncio de FastPass únicamente para los roles de FastPass y Staff.',
        options: [
            {
                name: 'acceso',
                description: 'Pegá acá el enlace del servidor privado de Roblox para el FastPass.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'imagen',
                description: 'Sube la foto o banner de FastPass (opcional).',
                type: ApplicationCommandOptionType.Attachment,
                required: false
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ **No tienes permisos:** Solo el Staff puede habilitar el FastPass.',
                ephemeral: true
            });
        }

        const linkSesion = interaction.options.getString('acceso');
        const fotoAdjunta = interaction.options.getAttachment('imagen');
        const mencionesRoles = ROLES_VIP_IDS.map(id => `<@&${id}>`).join(' ');

        const embedFastPass = new EmbedBuilder()
            .setTitle(`<a:explosionfloral:1534954231138746488> __FastPass de la Sesión__ <a:explosionfloral:1534954231138746488>`)
            .setDescription(
                `<:punto:1534938142665084938> El FastPass ha sido **liberado para la sesión**. Los miembros que adquirieron su pase de FastPass y el Equipo de Staff ya pueden unirse utilizando el botón de abajo.\n\n` +
                `*Compartir este enlace resultará en la revocación permanente de tus permisos de FastPass.*\n\n` +
                `<:flecha:1534937306191102125> ¿Quieres unirte antes que el resto? Adquiere tu pase de **FastPass** correspondiente en el canal de beneficios del servidor.`
            )
            .setColor('#74d4fc');

        const urlPredeterminada =
            'https://cdn.discordapp.com/attachments/1505017301089652898/1534992730978123787/FastPass_1.png';
        embedFastPass.setImage(fotoAdjunta ? fotoAdjunta.url : urlPredeterminada);

        const filaComponentes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_fastpass_swfl')
                .setLabel('FastPass')
                .setEmoji('1534937419231527036')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: 'Lanzando el anuncio de FastPass restringido...', ephemeral: true });

        const msgFastPass = await interaction.channel.send({
            content: mencionesRoles,
            embeds: [embedFastPass],
            components: [filaComponentes]
        });

        global.coleccionFastPass.set(msgFastPass.id, linkSesion);
        await guardarFastPass(msgFastPass.id, {
            link: linkSesion,
            guildId: interaction.guildId,
            channelId: interaction.channelId,
            por: interaction.user.id
        });
    }
};
