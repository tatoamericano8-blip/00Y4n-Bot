import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { guardarFastPass } from '../../utils/gestorFastPass.js';
import { E, EMOJI_DEF } from '../../config/emojis.js';

const EMOJIS = {
    flechaH: E.flecha,
    flechaV: E.flecha,
    coraaMov: E.acorarotacion
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
        const ROL_STAFF = '1512120103771050005';
        if (!interaction.member.roles.cache.has(ROL_STAFF)) {
            return await interaction.reply({
                content: `${E.cruz || '❌'} **No tienes permisos:** Solo el **Staff 00Y4n** puede habilitar el FastPass.`,
                ephemeral: true
            });
        }

        const linkSesion = interaction.options.getString('acceso');
        const fotoAdjunta = interaction.options.getAttachment('imagen');
        const mencionesRoles = ROLES_VIP_IDS.map(id => `<@&${id}>`).join(' ');

        const embedFastPass = new EmbedBuilder()
            .setTitle(`${E.a2alas} Southwest Florida Comunidad 00Y4n — __*Acceso Anticipado*__ ${E.a2alas}`)
            .setDescription(
                `${E.dot} <@${interaction.user.id}> **ha liberado el acceso anticipado de su servidor!** Boosters, Staff y Servicios Públicos ya pueden unirse mediante el botón de abajo.\n\n` +
                `${E.replican} __Asegurate de estacionarte de inmediato al unirte y de seguir todas las indicaciones del host, o tu acceso anticipado puede y será revocado__.`
            )
            .setColor('#74d4fc');

        const urlPredeterminada =
            'https://media.discordapp.net/attachments/1505017301089652898/1561884377799991366/Copia_de_FastPass_1.png?ex=6ad8a26e&is=6ad750ee&hm=bef4c0dbbc4215167000e8e9c25ff30d23d48dd87d5e0fa4ea1e6a6290f836f4&=&format=webp&quality=lossless';
        embedFastPass.setImage(fotoAdjunta ? fotoAdjunta.url : urlPredeterminada);

        const filaComponentes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_fastpass_swfl')
                .setLabel('FastPass')
                .setEmoji(EMOJI_DEF.lock.id)
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
