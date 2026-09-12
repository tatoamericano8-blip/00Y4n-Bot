import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import Sesion from '../../../models/Session.js';
import Historial from '../../../models/Historial.js';
import { cerrarFastPassesDeGuild } from '../../utils/gestorFastPass.js';
import { bloquearSiCooldown, setCooldownSesion } from '../../utils/cooldownSesiones.js';
import { E, EMOJI_DEF } from '../../config/emojis.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

const IMAGEN_MEET_DEFECTO = 'https://cdn.discordapp.com/attachments/1505017301089652898/1548119380938723348/Lanzamiento_Carmeet_1.png?ex=6aa5e607&is=6aa49487&hm=a39c31aec52948a1e1fd4b5f7dde8ae37718d77c7bf83dd82f3ac0e73ea6af84&';

export default {
    data: {
        name: 'lanzar_meet',
        description: 'Libera los accesos para un Car Meet oficial.',
        options: [
            { name: 'mensaje_id', description: 'Pega aca la ID del mensaje de Startup/Inicio de esta sesion.', type: ApplicationCommandOptionType.String, required: true },
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

        const idInicio = interaction.options.getString('mensaje_id');
        const linkSesion = interaction.options.getString('acceso');
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

        const infoDescripcion =
            E.dot + ` <@${interaction.user.id}> **ha liberado su sesión de Car Meet!** Asegurate de seguir todas las instrucciones del host y co-hosts antes de salir del spawn. Además, se deben respetar todas las regulaciones de **Southwest Florida Comunidad 00Y4n** durante toda la sesión.\n\n` +
            E.replican + ` Los links del servidor se regenerarán a los **tres minutos** de la liberación, así que únete rápido. Las reinvitaciones ocurrirán **cada quince minutos** (según las reacciones), así que no le pidas el link al host.\n\n` +
            E.manual + ` **__Información de la sesión:__**\n` +
            E.jpuntderecha + ` Temática: **${tematica}**\n` +
            E.jpuntderecha + ` Ubicación: **${ubicacion}**\n` +
            E.jpuntderecha + ` Spots / Duración: **${spots}**\n\n` +
            E.warn + ` __Cualquier compartición no autorizada del link resultará en un **ban inmediato** del servidor__.`;

        const embedRelease = new EmbedBuilder()
            .setTitle(E.a2alas + ' Southwest Florida Comunidad 00Y4n — *__Sesión de Car Meet Liberada__* ' + E.a2alas)
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
                .setEmoji(EMOJI_DEF.lock.id)
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
