import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import Sesion from '../../../models/Session.js';
import Historial from '../../../models/Historial.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

const IMAGEN_RP_DEFECTO = 'https://cdn.discordapp.com/attachments/1529288674091466805/1534999348373360690/Lanzamiento_Roleplay_1.png?ex=6a762b0b&is=6a74d98b&hm=94feaaeddb34f5c6ba70a4d9185a6dda368a9baf17e3134fdda6a37aa6a27fd5&';

export default {
    data: {
        name: 'lanzar_rp',
        description: 'Liberas los accesos para una sesión oficial de Roleplay.',
        options: [
            {
                name: 'mensaje_id',
                description: 'Pegá acá la ID del mensaje de Startup/Inicio de esta sesión.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'acceso',
                description: 'Pegá acá el enlace del servidor privado de Roblox.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'limite_velocidad',
                description: 'Selecciona el límite de velocidad de la sesión.',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: '60 MPH', value: '60 MPH' },
                    { name: '65 MPH', value: '65 MPH' },
                    { name: '70 MPH', value: '70 MPH' },
                    { name: '75 MPH', value: '75 MPH' },
                    { name: '80 MPH', value: '80 MPH' },
                    { name: '85 MPH', value: '85 MPH' }
                ]
            },
            {
                name: 'peacetime',
                description: 'Selecciona el modo de Peacetime.',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'Estricto', value: 'Estricto' },
                    { name: 'Normal', value: 'Normal' },
                    { name: 'Desactivado', value: 'Desactivado' }
                ]
            },
            {
                name: 'servicios_emergencia',
                description: '¿Los servicios de emergencia están activos?',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'Activos', value: 'Activos' },
                    { name: 'Inactivos', value: 'Inactivos' }
                ]
            },
            {
                name: 'imagen',
                description: 'Link de la foto/banner para la apertura (opcional).',
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: `<:cruz00y4n:1534937767652495360> **No tienes permisos:** Solo el Staff puede liberar los accesos de la sesión.`,
                ephemeral: true
            });
        }

        const idInicio = interaction.options.getString('mensaje_id');
        const linkSesion = interaction.options.getString('acceso');
        const limite = interaction.options.getString('limite_velocidad');
        const peacetime = interaction.options.getString('peacetime');
        const serviciosEmergencia = interaction.options.getString('servicios_emergencia');
        const urlImagen = interaction.options.getString('imagen');

        let coHostId = null;
        let hostIdSesion = interaction.user.id;
        try {
            const sesionPrevia = await Sesion.findOne({ idInicio });
            if (sesionPrevia) {
                coHostId = sesionPrevia.coHostId || null;
                hostIdSesion = sesionPrevia.hostId || interaction.user.id;
            }
        } catch {}

        const textoCohost = coHostId ? `<@${coHostId}>` : 'Ninguno';

        const infoDescripcion =
            `> <a:punto:1534939368035324125> <@${interaction.user.id}> ¡ha lanzado su sesión! Eres bienvenido a unirte utilizando el botón de abajo. Antes de ingresar al servidor, asegúrate de haber leído la información detallada a continuación.\n\n` +
            ` <:flor:1534999731019972671> **Antes de Unirte**\n\n` +
            `> <:fle:1534937306191102125> Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
            `> <:fle:1534937306191102125> Lee la [información](https://discord.com/channels/1451939725308067842/1516590524725989437) & la [lista de vehículos baneados](https://discord.com/channels/1451939725308067842/1501739933495201925/1525190667545088225).\n` +
            `> <:fle:1534937306191102125> Registra tus vehículos en <#1505615426305130657>!\n\n` +
            ` <:flor:1534999731019972671> **Información del Roleplay**\n\n` +
            `> <:uno:1534938872977297559> **Estado de Peacetime:** ${peacetime}\n` +
            `> <:dos:1535001133729447987> **Velocidad de Fail Roleplay:** ${limite}\n` +
            `> <:tres:1535001243204718612> **Servicios de Emergencia:** ${serviciosEmergencia}\n` +
            `> <:cuatro:1534938460228550857> **Co-Host de la Sesión:** ${textoCohost}\n` +
            `> <:replica:1534982812116062370> Las velocidades de detención son **+6 MPH** sobre el límite de velocidad establecido.\n\n` +
            `-# <:dot:1534938142665084938> *¡Cualquier miembro descubierto haciendo Fail Roleplay de forma excesiva será expulsado inmediatamente de la sesión!*`;

        const embedRelease = new EmbedBuilder()
            .setTitle(`<a:mariquieta:1534954231138746488> Southwest Florida - *_Roleplay Sesión Lanzada_* <a:mariquieta:1534954231138746488>`)
            .setDescription(infoDescripcion)
            .setColor('#74d4fc');

        if (urlImagen) {
            embedRelease.setImage(urlImagen);
        } else if (IMAGEN_RP_DEFECTO !== '') {
            embedRelease.setImage(IMAGEN_RP_DEFECTO);
        }

        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_voto_swfl')
                .setLabel('Link de la Sesión')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('1534937419231527036')
        );

        await interaction.reply({ content: 'Liberando accesos de Roleplay...', ephemeral: true });

        const msgRelease = await interaction.channel.send({
            content: '@everyone <@&1503763201274413056>',
            embeds: [embedRelease],
            components: [fila]
        });

        global.coleccionSesiones.set(msgRelease.id, {
            idInicio,
            linkSesion,
            limite,
            peacetime,
            serviciosEmergencia,
            coHostId,
            guildId: interaction.guildId,
            tipo: 'rp'
        });

        try {
            await Sesion.findOneAndUpdate(
                { idInicio },
                {
                    $set: {
                        idLanzamiento: msgRelease.id,
                        linkSesion,
                        limiteVelocidad: limite,
                        peacetime,
                        imagen: urlImagen || IMAGEN_RP_DEFECTO,
                        estado: 'activa',
                        fechaLanzamiento: new Date(),
                        hostId: hostIdSesion,
                        ...(coHostId ? { coHostId } : {})
                    }
                },
                { upsert: true, new: true }
            );

            await Historial.create({
                evento: 'SESION_LANZADA_RP',
                mensajeId: msgRelease.id,
                idInicio,
                hostId: interaction.user.id,
                hostTag: interaction.user.tag,
                tipo: 'rp',
                detalles: { linkSesion, limite, peacetime, serviciosEmergencia, coHostId },
                guildId: interaction.guildId
            });
        } catch (error) {
            console.error('Error al guardar lanzamiento de Roleplay en MongoDB:', error);
        }
    }
};
