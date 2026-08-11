import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import Sesion from '../../../models/Session.js';
import Historial from '../../../models/Historial.js';
import { cerrarFastPassesDeGuild } from '../../utils/gestorFastPass.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

const IMAGEN_MEET_DEFECTO = '';

export default {
    data: {
        name: 'lanzar_meet_swfl',
        description: 'Liberas los accesos para una sesion oficial de Car Meet.',
        options: [
            {
                name: 'mensaje_id',
                description: 'Pega aca la ID del mensaje de Startup/Inicio de esta sesion.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'acceso',
                description: 'Pega aca el enlace del servidor privado de Roblox.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'tematica',
                description: 'Tematica del meet (ej: JDM, Muscle, Euro).',
                type: ApplicationCommandOptionType.String,
                required: false
            },
            {
                name: 'ubicacion',
                description: 'Ubicacion del meet.',
                type: ApplicationCommandOptionType.String,
                required: false
            },
            {
                name: 'spots',
                description: 'Cupos / spots del meet.',
                type: ApplicationCommandOptionType.String,
                required: false
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
            return interaction.reply({
                content: 'No tienes permisos para lanzar el meet.',
                ephemeral: true
            });
        }

        const idInicio = interaction.options.getString('mensaje_id');
        const linkSesion = interaction.options.getString('acceso');
        const tematica = interaction.options.getString('tematica') || 'General';
        const ubicacion = interaction.options.getString('ubicacion') || 'Por confirmar';
        const spots = interaction.options.getString('spots') || 'Ilimitados';
        const urlImagen = interaction.options.getString('imagen');

        let hostIdSesion = interaction.user.id;
        let coHostId = null;
        try {
            const sesionPrev = await Sesion.findOne({ idInicio }).lean();
            if (sesionPrev) {
                if (sesionPrev.hostId) hostIdSesion = sesionPrev.hostId;
                if (sesionPrev.coHostId) coHostId = sesionPrev.coHostId;
            }
        } catch (_) {}

        const infoDescripcion =
            `<:dot:1534938142665084938> El **Car Meet** fue lanzado.\n` +
            `> Tematica: **${tematica}**\n` +
            `> Ubicacion: **${ubicacion}**\n` +
            `> Spots: **${spots}**\n\n` +
            `Usá el boton de abajo para obtener el link (debes haber votado en el inicio).`;

        const embedRelease = new EmbedBuilder()
            .setTitle('<a:mariquieta:1534954231138746488> Southwest Florida – ***__Car Meet Sesion Lanzada__*** <a:mariquieta:1534954231138746488>')
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
                .setLabel('Link de la Sesion')
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

        // Cerrar boton de FastPass si habia uno abierto (estilo Early Access Closed)
        try {
            const n = await cerrarFastPassesDeGuild(interaction.client, interaction.guildId, interaction.channelId);
            if (n > 0) console.log(`[lanzar] FastPass cerrado: ${n} mensaje(s)`);
        } catch (e) {
            console.error('[lanzar] Error cerrando FastPass:', e?.message || e);
        }

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
