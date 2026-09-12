import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    MessageFlags
} from 'discord.js';
import { E, EMOJI_DEF } from '../../config/emojis.js';
import Sesion from '../../../models/Session.js';
import Historial from '../../../models/Historial.js';
import { bloquearSiCooldown, setCooldownSesion } from '../../utils/cooldownSesiones.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

const EMOJI_REACCION = EMOJI_DEF.tilde.id;
const EMOJI_BOTON = EMOJI_DEF.candado.id;
const IMAGEN_REINVITACIONES_DEFECTO =
    'https://cdn.discordapp.com/attachments/1505017301089652898/1548119382700466207/Reinvitaciones_1.png?ex=6aa5e607&is=6aa49487&hm=d3c050fcf99d62123042c6fcb3dd96e483f47f0f2ef3fbfd662998b711c4dee9&';

function esURLValida(cadena) {
    try {
        const url = new URL(cadena);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

async function resolverSesion(guildId, idInicioManual) {
    let doc = null;
    let memoria = null;
    let targetIdInicio = idInicioManual || null;

    try {
        if (targetIdInicio) {
            doc = await Sesion.findOne({ idInicio: targetIdInicio });
        }
        if (!doc) {
            doc = await Sesion.findOne({
                guildId,
                estado: { $in: ['activa', 'esperando_reacciones'] }
            }).sort({ fechaLanzamiento: -1, fechaInicio: -1 });
        }
        if (doc) targetIdInicio = doc.idInicio;
    } catch (e) {
        console.error('[reinvitaciones] Error Mongo:', e?.message || e);
    }

    const candidatas = [];
    for (const [, data] of global.coleccionSesiones.entries()) {
        if (data.guildId !== guildId) continue;
        if (data.tipo !== 'rp' && data.tipo !== 'meet') continue;
        candidatas.push(data);
    }
    if (targetIdInicio) {
        memoria = candidatas.find(d => d.idInicio === targetIdInicio) || null;
    }
    if (!memoria && candidatas.length) {
        memoria = candidatas[candidatas.length - 1];
        if (!targetIdInicio) targetIdInicio = memoria.idInicio;
    }

    if (doc && memoria && memoria.idInicio && doc.idInicio && memoria.idInicio !== doc.idInicio) {
        memoria = null;
    }

    const tipo = doc?.tipo || memoria?.tipo || null;

    const base = {
        targetIdInicio,
        tipo,
        hostId: doc?.hostId || memoria?.hostId || null,
        coHostId: doc?.coHostId || memoria?.coHostId || null,
        linkSesionActual: doc?.linkSesion || memoria?.linkSesion || null,
        limiteVelocidad: null,
        peacetime: null,
        serviciosEmergencia: null,
        tematica: null,
        ubicacion: null,
        spots: null
    };

    if (tipo === 'rp') {
        base.limiteVelocidad = doc?.limiteVelocidad || memoria?.limite || null;
        base.peacetime = doc?.peacetime || memoria?.peacetime || null;
        base.serviciosEmergencia = doc?.serviciosEmergencia || memoria?.serviciosEmergencia || null;
    } else if (tipo === 'meet') {
        base.tematica = doc?.tematica || memoria?.tematica || null;
        base.ubicacion = doc?.ubicacion || memoria?.ubicacion || null;
        base.spots = doc?.spots || memoria?.spots || null;
    }

    return base;
}

export default {
    data: new SlashCommandBuilder()
        .setName('reinvitaciones')
        .setDescription('Envia el aviso de reinvitaciones y libera los accesos al alcanzar las reacciones requeridas.')
        .addIntegerOption(option =>
            option.setName('reacciones')
                .setDescription('Cantidad de reacciones requeridas para habilitar las reinvitaciones.')
                .setRequired(true)
                .setMinValue(1))
        .addStringOption(option =>
            option.setName('acceso')
                .setDescription('Enlace del servidor privado de Roblox para la reinvitacion.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('id_inicio')
                .setDescription('ID del mensaje de Lanzamiento/Inicio de la sesion (Opcional, se autodetecta).')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: E.cruz + ' **No tienes permisos:** Solo el Staff puede gestionar las reinvitaciones.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (await bloquearSiCooldown(interaction, 'reinvitaciones')) return;
        setCooldownSesion(interaction.guildId, 'reinvitaciones', interaction.member);

        const reaccionesRequeridas = interaction.options.getInteger('reacciones');
        const rawLink = interaction.options.getString('acceso');
        const idInicioManual = interaction.options.getString('id_inicio');

        const sesion = await resolverSesion(interaction.guildId, idInicioManual);
        const targetIdInicio = sesion.targetIdInicio;

        let linkSesion = rawLink.trim();
        if (!linkSesion.startsWith('http://') && !linkSesion.startsWith('https://')) {
            linkSesion = `https://${linkSesion}`;
        }
        if (!esURLValida(linkSesion)) {
            return await interaction.reply({
                content: E.cruz + ` **Enlace invalido:** El enlace proporcionado (\`${rawLink}\`) no es una URL valida.`,
                flags: MessageFlags.Ephemeral
            });
        }

        let resumenSesion = '';
        if (sesion.tipo === 'rp') {
            resumenSesion =
                `\n` + E.manual + ` __**Datos de la sesion (Roleplay)**__\n` +
                E.dot + ` Peacetime: **${sesion.peacetime || '-'}**\n` +
                E.dot + ` Limite FRP: **${sesion.limiteVelocidad || '-'}**\n` +
                E.dot + ` Emergencias: **${sesion.serviciosEmergencia || '-'}**\n` +
                E.dot + ` Co-Host: ${sesion.coHostId ? `<@${sesion.coHostId}>` : '*Sin asignar*'}\n`;
        } else if (sesion.tipo === 'meet') {
            resumenSesion =
                `\n` + E.manual + ` __**Datos de la sesion (Car Meet)**__\n` +
                E.dot + ` Tematica: **${sesion.tematica || '-'}**\n` +
                E.dot + ` Ubicacion: **${sesion.ubicacion || '-'}**\n` +
                E.dot + ` Spots / Duracion: **${sesion.spots || '-'}**\n` +
                E.dot + ` Co-Host: ${sesion.coHostId ? `<@${sesion.coHostId}>` : '*Sin asignar*'}\n`;
        }

        const embedReinvitacion = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle(E.a2alas + ' Southwest Florida Comunidad 00Y4n — Reinvitaciones de Sesión')
            .setDescription(
                E.dot + ` <@${interaction.user.id}> **está hosteando las reinvitaciones de su sesión!** Para que se libere el link, necesitamos recibir **${reaccionesRequeridas}** reacciones.` +
                resumenSesion
            )
            .setImage(IMAGEN_REINVITACIONES_DEFECTO)
            .setFooter({ text: '00Y4n Comunidad SWFL', iconURL: interaction.guild.iconURL() || undefined })
            .setTimestamp();

        await interaction.reply({
            content: E.tilde + ' Aviso de reinvitaciones publicado.',
            flags: MessageFlags.Ephemeral
        });

        const mensajeEnviado = await interaction.channel.send({
            content: '**@here**',
            embeds: [embedReinvitacion],
            allowedMentions: { parse: ['everyone', 'roles', 'users'] }
        });

        try {
            await mensajeEnviado.react(EMOJI_REACCION);
        } catch (reactError) {
            console.error('[reinvitaciones] Error reaccionando:', reactError?.message || reactError);
            try { await mensajeEnviado.react('✔️'); } catch {}
        }

        const filter = (reaction, user) => {
            if (user.bot) return false;
            const id = reaction.emoji?.id;
            const name = reaction.emoji?.name;
            return id === EMOJI_REACCION || name === 'tilde' || name === '✔️' || name === '✅';
        };

        const collector = mensajeEnviado.createReactionCollector({
            filter,
            time: 2 * 60 * 60 * 1000
        });

        collector.on('collect', async (reaction) => {
            try {
                const users = await reaction.users.fetch();
                const usuariosReales = users.filter(u => !u.bot).size;
                if (usuariosReales >= reaccionesRequeridas) {
                    collector.stop('meta_alcanzada');
                }
            } catch (err) {
                console.error('[reinvitaciones] Error al procesar reacciones:', err);
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason !== 'meta_alcanzada') return;

            try { await mensajeEnviado.delete(); } catch (error) {
                console.error('[reinvitaciones] Error al eliminar mensaje:', error);
            }

            const fresh = await resolverSesion(interaction.guildId, targetIdInicio);
            const horaRelease = new Date().toLocaleTimeString('es-AR', {
                hour: '2-digit', minute: '2-digit', hour12: false,
                timeZone: 'America/Argentina/Buenos_Aires'
            });
            const timestampRelease = Math.floor(Date.now() / 1000);
            const textoCohost = fresh.coHostId ? `<@${fresh.coHostId}>` : 'Ninguno';

            let tituloEmbed = E.a2alas + ' Southwest Florida Comunidad 00Y4n — __*Reinvitaciones Liberadas*__ ' + E.a2alas;
            let datosExtraSesion = '';

            if (fresh.tipo === 'rp') {
                tituloEmbed = E.a2alas + ' Southwest Florida Comunidad 00Y4n — __*Reinvitaciones de Roleplay Liberadas*__ ' + E.a2alas;
                datosExtraSesion =
                    E.jpuntderecha + ` Límite de Fail-Roleplay: **${fresh.limiteVelocidad || '-'}**\n` +
                    E.jpuntderecha + ` Estado de Peacetime: **${fresh.peacetime || '-'}**\n` +
                    E.jpuntderecha + ` Servicios de emergencia: **${fresh.serviciosEmergencia || '-'}**\n` +
                    E.jpuntderecha + ` Co-Host de la sesión: ${textoCohost}\n`;
            } else if (fresh.tipo === 'meet') {
                tituloEmbed = E.a2alas + ' Southwest Florida Comunidad 00Y4n — Reinvitaciones de Car Meet Liberadas';
                datosExtraSesion =
                    E.jpuntderecha + ` Temática: **${fresh.tematica || '-'}**\n` +
                    E.jpuntderecha + ` Ubicación: **${fresh.ubicacion || '-'}**\n` +
                    E.jpuntderecha + ` Spots / Duración: **${fresh.spots || '-'}**\n` +
                    E.jpuntderecha + ` Co-Host de la sesión: ${textoCohost}\n`;
            } else {
                datosExtraSesion = E.dot + ` Co-Host de la sesión: ${textoCohost}\n`;
            }

            const infoDescripcion =
                E.dot + ` <@${interaction.user.id}> **ha liberado las reinvitaciones de su sesión!** Asegurate de seguir todas las instrucciones del host y co-hosts antes de salir del spawn. Además, se deben respetar todas las regulaciones de **Southwest Florida Comunidad 00Y4n** durante toda la sesión.\n\n` +
                E.replican + ` Los links del servidor se regenerarán a los **tres minutos** de la liberación, así que únete rápido. Las reinvitaciones ocurrirán **cada quince minutos**, así que no le pidas el link al host.\n\n` +
                E.manual + ` __**Información de la sesión:**__\n` +
                datosExtraSesion +
                `\n` + E.warn + ` __Cualquier compartición no autorizada del link resultará en un **ban inmediato** del servidor__.`;

            const embedRelease = new EmbedBuilder()
                .setTitle(tituloEmbed)
                .setDescription(infoDescripcion)
                .setColor('#74d4fc')
                .setImage(IMAGEN_REINVITACIONES_DEFECTO)
                .setFooter({ text: '00Y4n Comunidad SWFL', iconURL: interaction.guild.iconURL() || undefined })
                .setTimestamp();

            const fila = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('verificar_voto_swfl')
                    .setLabel('Link de la Sesion')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(EMOJI_BOTON)
            );

            try {
                const msgRelease = await interaction.channel.send({
                    content: '@everyone Las reinvitaciones han sido **LANZADAS**!',
                    embeds: [embedRelease],
                    components: [fila],
                    allowedMentions: { parse: ['everyone', 'roles'] }
                });

                global.coleccionSesiones.set(msgRelease.id, {
                    idInicio: targetIdInicio || fresh.targetIdInicio,
                    linkSesion,
                    guildId: interaction.guildId,
                    tipo: 'reinvitacion',
                    tipoSesion: fresh.tipo,
                    coHostId: fresh.coHostId || null,
                    limite: fresh.limiteVelocidad,
                    peacetime: fresh.peacetime,
                    serviciosEmergencia: fresh.serviciosEmergencia,
                    tematica: fresh.tematica,
                    ubicacion: fresh.ubicacion,
                    spots: fresh.spots
                });

                if (targetIdInicio || fresh.targetIdInicio) {
                    const idRef = targetIdInicio || fresh.targetIdInicio;
                    await Sesion.updateOne(
                        { idInicio: idRef },
                        {
                            $set: { linkSesion, estado: 'activa' },
                            $push: {
                                reinvitaciones: {
                                    idMensaje: msgRelease.id,
                                    fecha: new Date(),
                                    reaccionesMeta: reaccionesRequeridas,
                                    link: linkSesion
                                }
                            }
                        }
                    );
                }

                await Historial.create({
                    evento: 'REINVITACION_LIBERADA',
                    mensajeId: msgRelease.id,
                    idInicio: targetIdInicio || fresh.targetIdInicio || 'S/N',
                    hostId: interaction.user.id,
                    hostTag: interaction.user.tag,
                    tipo: fresh.tipo || 'reinvitacion',
                    detalles: {
                        reaccionesRequeridas,
                        linkSesion,
                        coHostId: fresh.coHostId || null,
                        peacetime: fresh.peacetime,
                        limiteVelocidad: fresh.limiteVelocidad,
                        serviciosEmergencia: fresh.serviciosEmergencia,
                        tematica: fresh.tematica,
                        ubicacion: fresh.ubicacion,
                        spots: fresh.spots
                    },
                    guildId: interaction.guildId
                });
            } catch (sendError) {
                console.error('[reinvitaciones] Error al enviar liberacion:', sendError);
            }
        });
    }
};
