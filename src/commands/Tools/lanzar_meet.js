import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import Sesion from '../../../models/Session.js';
import Historial from '../../../models/Historial.js';
import { cerrarFastPassesDeGuild } from '../../utils/gestorFastPass.js';
import { bloquearSiCooldown, setCooldownSesion } from '../../utils/cooldownSesiones.js';
import { E, EMOJI_DEF } from '../../config/emojis.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

const IMAGEN_MEET_DEFECTO = 'https://cdn.discordapp.com/attachments/1505017301089652898/1548119380980932689/Lanzamiento_Meet_Greet_1.png';

export default {
    data: {
        name: 'lanzar_meet',
        description: 'Liberas los accesos para una sesion oficial de Meet & Greet.',
        options: [
            { name: 'mensaje_id', description: 'ID del mensaje de /inicio (opcional: si no lo ponés, se detecta solo la sesión abierta).', type: ApplicationCommandOptionType.String, required: false },
            { name: 'acceso', description: 'Pega aca el enlace del servidor privado de Roblox.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'tematica', description: 'Ejemplo: JDM, Exoticos, Camionetas', type: ApplicationCommandOptionType.String, required: true },
            { name: 'ubicacion', description: 'Lugar de concentracion (Ej: Puerto, Aeropuerto)', type: ApplicationCommandOptionType.String, required: true },
            { name: 'spots_duracion', description: 'Ejemplo: 3 Spots / 45 Minutos', type: ApplicationCommandOptionType.String, required: true },
            { name: 'imagen', description: 'Link de la foto/banner para la apertura (opcional).', type: ApplicationCommandOptionType.String, required: false }
        ]
    },

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: E.cruz + ' **No tienes permisos:** Solo el Staff puede liberar los accesos de la sesion.',
                ephemeral: true
            });
        }

        if (await bloquearSiCooldown(interaction, 'lanzar_meet_swfl')) return;
        setCooldownSesion(interaction.guildId, 'lanzar_meet_swfl', interaction.member);

        let idInicio = interaction.options.getString('mensaje_id');
        const linkSesion = interaction.options.getString('acceso');

        if (!idInicio) {
            try {
                const sesionAbierta = await Sesion.findOne({
                    guildId: interaction.guildId,
                    estado: { $in: ['esperando_reacciones', 'activa'] }
                }).sort({ fechaInicio: -1 }).lean();
                if (sesionAbierta?.idInicio) {
                    idInicio = sesionAbierta.idInicio;
                }
            } catch (e) {
                console.error('[lanzar] Error auto-detectando idInicio:', e?.message || e);
            }
        }

        if (!idInicio) {
            return await interaction.reply({
                content: E.cruz + ' **No hay una sesión de /inicio abierta** para vincular. Usá `/inicio` primero o pasá `mensaje_id` manualmente.',
                ephemeral: true
            });
        }

        const tematica = interaction.options.getString('tematica');
        const ubicacion = interaction.options.getString('ubicacion');
        const spots = interaction.options.getString('spots_duracion');
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

        const coHostLine = coHostId
            ? E.jpuntderecha + ` Co-Host(s) de la sesión: <@${coHostId}>`
            : E.jpuntderecha + ` Co-Host(s) de la sesión: *Sin asignar*`;

        const infoDescripcion =
            E.dot + ` <@${hostIdSesion}> **ha liberado su sesión de Meet & Greet!** Asegurate de seguir todas las instrucciones del host y co-hosts antes de salir del spawn. Además, se deben respetar todas las regulaciones de **Southwest Florida Comunidad 00Y4n** durante toda la sesión.\n\n` +
            E.replican + ` Los links del servidor se regenerarán a los **tres minutos** de la liberación, así que unite rápido. Las reinvitaciones ocurrirán **cada quince minutos** (según las reacciones), así que no le pidas el link al host.\n\n` +
            E.manual + ` __**Información de la sesión:**__\n` +
            E.jpuntderecha + ` Temática: **${tematica}**\n` +
            E.jpuntderecha + ` Ubicación: **${ubicacion}**\n` +
            E.jpuntderecha + ` Spots: **${spots}**\n` +
            `${coHostLine}\n\n` +
            E.warn + ` __Cualquier compartición no autorizada del link resultará en un **ban inmediato** del servidor__.`;

        const embedRelease = new EmbedBuilder()
            .setTitle(E.a2alas + ' Southwest Florida Comunidad 00Y4n — __*Sesión de Meet & Greet Liberada*__ ' + E.a2alas)
            .setDescription(infoDescripcion)
            .setColor('#74d4fc');

        if (urlImagen) {
            embedRelease.setImage(urlImagen);
        } else {
            embedRelease.setImage(IMAGEN_MEET_DEFECTO);
        }

        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_voto_swfl')
                .setLabel('Link de la Sesion')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(EMOJI_DEF.hyperlink.id)
        );

        await interaction.reply({ content: 'Liberando accesos de Meet & Greet...', ephemeral: true });

        const msgRelease = await interaction.channel.send({
            content: '@everyone <@&1503763201274413056>',
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
            const n = await cerrarFastPassesDeGuild(interaction.client, interaction.guildId, null);
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
            console.error('Error al guardar lanzamiento de Meet en MongoDB:', error);
        }
    }
};
