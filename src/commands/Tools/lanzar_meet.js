import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import Sesion from '../../../models/Session.js';
import Historial from '../../../models/Historial.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

const IMAGEN_MEET_DEFECTO = 'https://cdn.discordapp.com/attachments/1529288674091466805/1534999347933085727/Lanzamiento_Carmeet_1.png?ex=6a762b0b&is=6a74d98b&hm=b717f5b987296c37bf9346cbd7b144afc798d40c1ca912313bd41627614a96e8&';

export default {
    data: {
        name: 'lanzar_meet_swfl',
        description: 'Libera los accesos para un Car Meet oficial.',
        options: [
            { name: 'mensaje_id', description: 'Pegá acá la ID del mensaje de Startup/Inicio de esta sesión.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'acceso', description: 'Pegá acá el enlace del servidor privado de Roblox.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'tematica', description: 'Ejemplo: JDM, Exóticos, Camionetas', type: ApplicationCommandOptionType.String, required: true },
            { name: 'ubicacion', description: 'Lugar de concentración (Ej: Puerto, Aeropuerto)', type: ApplicationCommandOptionType.String, required: true },
            { name: 'spots_duracion', description: 'Ejemplo: 3 Spots / 45 Minutos', type: ApplicationCommandOptionType.String, required: true },
            { name: 'imagen', description: 'Link de la foto/banner para la apertura (opcional).', type: ApplicationCommandOptionType.String, required: false }
        ]
    },

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '<:cruz00y4n:1534937767652495360> **No tienes permisos:** Solo el Staff puede liberar los accesos de la sesión.',
                ephemeral: true
            });
        }

        const idInicio = interaction.options.getString('mensaje_id');
        const linkSesion = interaction.options.getString('acceso');
        const tematica = interaction.options.getString('tematica');
        const ubicacion = interaction.options.getString('ubicacion');
        const spots = interaction.options.getString('spots_duracion');
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
            `> <a:flecha:1534939368035324125> <@${interaction.user.id}> **¡ha lanzado un Car Meet oficial!** Eres bienvenido a unirte utilizando el botón de abajo. Antes de ingresar al servidor, asegúrate de haber leído la información detallada a continuación.\n\n` +
            `**<:manual:1534999731019972671> Antes de Unirte**\n\n` +
            `> <:si:1534938142665084938> Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
            `> <:si:1534938142665084938> Lee la [información](https://discord.com/channels/1451939725308067842/1451942179877687399) & la [lista de vehículos baneados](https://discord.com/channels/1451939725308067842/1452644461745148049/1524916351733469305).\n\n` +
            `**<:caram00y4nmov:1523041315187855470> Información del Car Meet**\n\n` +
            `<:uno:1534938872977297559> **Temática del Meet:** ${tematica}\n` +
            `<:dos:1535001133729447987> **Lugar de Inicio:** ${ubicacion}\n` +
            `<:tres:1535001243204718612> **Spots / Duración:** ${spots}\n` +
            `<:cuatro:1534938460228550857> **Co-Host de la Sesión:** ${textoCohost}\n` +
            `<:flechareplica:1534982812116062370> Los vehículos deben ingresar __despacio__ al lugar actual del meet.\n\n` +
            `➴ *¡Cualquier miembro descubierto haciendo Choque de vehículos o saboteando el orden será __expulsado__ e ingresará directo a la blacklist!*`;

        const embedRelease = new EmbedBuilder()
            .setTitle('<a:mariquieta:1534954231138746488> Southwest Florida – ***__Car Meet Sesión Lanzada__*** <a:mariquieta:1534954231138746488>')
            .setDescription(infoDescripcion)
            .setColor('#74d4fc');

        if (urlImagen) {
            embedRelease.setImage(urlImagen);
        } else if (IMAGEN_MEET_DEFECTO !== '') {
            embedRelease.setImage(IMAGEN_MEET_DEFECTO);
        }

        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_voto_swfl')
                .setLabel('Link de la Sesión')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('1534937419231527036')
        );

        await interaction.reply({ content: 'Liberando accesos del Car Meet...', ephemeral: true });

        const msgRelease = await interaction.channel.send({
            content: '@everyone <@&1491458302993891358>',
            embeds: [embedRelease],
            components: [fila]
        });

        global.coleccionSesiones.set(msgRelease.id, {
            idInicio,
            linkSesion,
            tematica,
            ubicacion,
            spots,
            coHostId,
            guildId: interaction.guildId,
            tipo: 'meet'
        });

        try {
            await Sesion.findOneAndUpdate(
                { idInicio },
                {
                    $set: {
                        idLanzamiento: msgRelease.id,
                        linkSesion,
                        tematica,
                        ubicacion,
                        spots,
                        imagen: urlImagen || IMAGEN_MEET_DEFECTO,
                        estado: 'activa',
                        fechaLanzamiento: new Date(),
                        hostId: hostIdSesion,
                        ...(coHostId ? { coHostId } : {})
                    }
                },
                { upsert: true, new: true }
            );

            await Historial.create({
                evento: 'SESION_LANZADA_MEET',
                mensajeId: msgRelease.id,
                idInicio,
                hostId: interaction.user.id,
                hostTag: interaction.user.tag,
                tipo: 'meet',
                detalles: { linkSesion, tematica, ubicacion, spots, coHostId },
                guildId: interaction.guildId
            });
        } catch (error) {
            console.error('Error al guardar lanzamiento de Car Meet en MongoDB:', error);
        }
    }
};
