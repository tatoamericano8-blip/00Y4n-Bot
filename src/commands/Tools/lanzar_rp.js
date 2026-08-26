import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import Sesion from '../../../models/Session.js';
import Historial from '../../../models/Historial.js';
import { cerrarFastPassesDeGuild } from '../../utils/gestorFastPass.js';
import { bloquearSiCooldown, setCooldownSesion } from '../../utils/cooldownSesiones.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

const IMAGEN_RP_DEFECTO = 'https://cdn.discordapp.com/attachments/1505017301089652898/1536043755163877568/Lanzamiento_Roleplay_1.png';

export default {
    data: {
        name: 'lanzar_rp',
        description: 'Liberas los accesos para una sesion oficial de Roleplay.',
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
                name: 'limite_velocidad',
                description: 'Selecciona el limite de velocidad de la sesion.',
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
                description: 'Los servicios de emergencia estan activos?',
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
                content: '<:cruz00y4n:1534937767652495360> **No tienes permisos:** Solo el Staff puede liberar los accesos de la sesion.',
                ephemeral: true
            });
        }

        if (await bloquearSiCooldown(interaction, 'lanzar_rp')) return;
        setCooldownSesion(interaction.guildId, 'lanzar_rp', interaction.member);

        const idInicio = interaction.options.getString('mensaje_id');
        const linkSesion = interaction.options.getString('acceso');
        const limite = interaction.options.getString('limite_velocidad');
        const peacetime = interaction.options.getString('peacetime');
        const serviciosEmergencia = interaction.options.getString('servicios_emergencia');
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
            ? `<:dotp:1542258368301899866> Co-Host(s) de la sesión: <@${coHostId}>`
            : `<:dotp:1542258368301899866> Co-Host(s) de la sesión: *Sin asignar*`;

        const infoDescripcion =
            `<:dot:1534938142665084938> <@${hostIdSesion}> **ha liberado su sesión de Roleplay!** Asegurate de seguir todas las instrucciones del host y co-hosts antes de salir del spawn. Además, se deben respetar todas las regulaciones de **Southwest Florida Comunidad 00Y4n** durante toda la sesión.\n\n` +
            `<:replica:1534982812116062370> Los links del servidor se regenerarán a los **tres minutos** de la liberación (según las reacciones), así que unite rápido. Las reinvitaciones ocurrirán **cada quince minutos**, así que no le pidas el link al host.\n\n` +
            `<:manual:1534999731019972671> __**Información de la sesión:**__\n` +
            `<:dotp:1542258368301899866> Límite de Fail-Roleplay: **${limite}**\n` +
            `<:dotp:1542258368301899866> Estado de Peacetime: **${peacetime}**\n` +
            `<:dotp:1542258368301899866> Servicios de emergencia: **${serviciosEmergencia}**\n` +
            `${coHostLine}\n\n` +
            `<:adv:1534937002695327837> __Cualquier compartición no autorizada del link resultará en un **ban inmediato** del servidor__.`;

        const embedRelease = new EmbedBuilder()
            .setTitle('<a:mariquieta:1534954231138746488> Southwest Florida Comunidad 00Y4n — __*Sesión de Roleplay Liberada__* <a:mariquieta:1534954231138746488>')
            .setDescription(infoDescripcion)
            .setColor('#74d4fc');

        if (urlImagen) {
            embedRelease.setImage(urlImagen);
        } else {
            embedRelease.setImage(IMAGEN_RP_DEFECTO);
        }

        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verificar_voto_swfl')
                .setLabel('Link de la Sesion')
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
