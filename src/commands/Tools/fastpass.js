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
            .setTitle(`<a:mariquieta:1534954231138746488> Southwest Florida Comunidad 00Y4n — Acceso Anticipado`)
            .setDescription(
                `<:dot:1534938142665084938> <@${interaction.user.id}> **ha liberado el acceso anticipado de su servidor!** Boosters, Staff y Servicios Públicos ya pueden unirse mediante el botón de abajo.\n\n` +
                `<:replica:1534982812116062370> Asegurate de estacionarte de inmediato al unirte y de seguir todas las indicaciones del host, o tu acceso anticipado puede y será revocado.`
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
