import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    MessageFlags
} from 'discord.js';
import Sesion from '../../../models/Session.js';
import Historial from '../../../models/Historial.js';

global.coleccionSesiones = global.coleccionSesiones || new Map();

/** Emoji fijo de reacción (sin opción para cambiar) */
const EMOJI_REACCION = '1534937809733812286';
const EMOJI_BOTON = '1534937419231527036';

function esURLValida(cadena) {
    try {
        const url = new URL(cadena);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Resuelve la sesión ACTUAL del guild.
 * Prioridad: id_inicio manual → Mongo (más reciente lanzada/activa) → memoria (última insertada).
 * Evita mezclar datos de un Car Meet viejo con un Roleplay nuevo.
 */
async function resolverSesion(guildId, idInicioManual) {
    let doc = null;
    let memoria = null;
    let targetIdInicio = idInicioManual || null;

    try {
        if (targetIdInicio) {
            doc = await Sesion.findOne({ idInicio: targetIdInicio });
        }
        // Sesión abierta más reciente por lanzamiento, luego por inicio
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

    // Memoria: última entrada rp/meet del guild (Map conserva orden de inserción)
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

    // Si memoria apunta a OTRA sesión distinta al doc, no mezclar
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
                content: `<:cruz00y4n:1534937767652495360> **No tienes permisos:** Solo el Staff puede gestionar las reinvitaciones.`,
                flags: MessageFlags.Ephemeral
            });
        }

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
                content: `<:cruz00y4n:1534937767652495360> **Enlace invalido:** El enlace proporcionado (\`${rawLink}\`) no es una URL valida.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const ahora = new Date();
        const horaFormateada = ahora.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'America/Argentina/Buenos_Aires'
        });
        const timestampDiscord = Math.floor(ahora.getTime() / 1000);

        let resumenSesion = '';
        if (sesion.tipo === 'rp') {
            resumenSesion =
                `\n<:manual:1534999731019972671> **Datos de la sesi\u00f3n (Roleplay)**\n` +
                `<:dot:1534938142665084938> Peacetime: **${sesion.peacetime || '\u2014'}**\n` +
                `<:dot:1534938142665084938> L\u00edmite FRP: **${sesion.limiteVelocidad || '\u2014'}**\n` +
                `<:dot:1534938142665084938> Emergencias: **${sesion.serviciosEmergencia || '\u2014'}**\n` +
                `<:dot:1534938142665084938> Co-Host: ${sesion.coHostId ? `<@${sesion.coHostId}>` : '*Sin asignar*'}\n`;
        } else if (sesion.tipo === 'meet') {
            resumenSesion =
                `\n<:manual:1534999731019972671> **Datos de la sesi\u00f3n (Car Meet)**\n` +
                `<:dot:1534938142665084938> Tem\u00e1tica: **${sesion.tematica || '\u2014'}**\n` +
                `<:dot:1534938142665084938> Ubicaci\u00f3n: **${sesion.ubicacion || '\u2014'}**\n` +
                `<:dot:1534938142665084938> Spots / Duraci\u00f3n: **${sesion.spots || '\u2014'}**\n` +
                `<:dot:1534938142665084938> Co-Host: ${sesion.coHostId ? `<@${sesion.coHostId}>` : '*Sin asignar*'}\n`;
        }

        const embedReinvitacion = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<a:esp:1534954134732804308> Reinvitaciones de la Sesion <a:esp:1534954134732804308>')
            .setDescription(
                `\u00a1Reacciona a este mensaje para solicitar tu reinvitaci\u00f3n!\n` +
                `Las reinvitaciones se liberar\u00e1n autom\u00e1ticamente una vez alcanzada la meta de reacciones.\n\n` +
                `<:dot:1534938142665084938> **Reacciones requeridas:** \`${reaccionesRequeridas}\` <:tilde:1534937809733812286>` +
                resumenSesion
            )
            .addFields({
                name: '<:fle:1534937306191102125> \u00daltima regeneraci\u00f3n',
                value: `El enlace fue actualizado a las **${horaFormateada}** (<t:${timestampDiscord}:t>)`,
                inline: false
            })
            .setFooter({ text: '00Y4n Comunidad SWFL', iconURL: interaction.guild.iconURL() || undefined })
            .setTimestamp();

        await interaction.reply({
            content: '<a:corasdandovueltas:1534939964150907000> **@here** \u00a1Atenci\u00f3n a las reinvitaciones de la sesi\u00f3n!',
            embeds: [embedReinvitacion],
            allowedMentions: { parse: ['everyone', 'roles', 'users'] }
        });

        const mensajeEnviado = await interaction.fetchReply();

        try {
            await mensajeEnviado.react(EMOJI_REACCION);
        } catch (reactError) {
            console.error('[reinvitaciones] Error reaccionando:', reactError?.message || reactError);
            try {
                await mensajeEnviado.react('\u2714\ufe0f');
            } catch {}
        }

        const filter = (reaction, user) => {
            if (user.bot) return false;
            const id = reaction.emoji?.id;
            const name = reaction.emoji?.name;
            return id === EMOJI_REACCION || name === 'tilde' || name === '\u2714\ufe0f' || name === '\u2705';
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

            try {
                await mensajeEnviado.delete();
            } catch (error) {
                console.error('[reinvitaciones] Error al eliminar mensaje:', error);
            }

            const fresh = await resolverSesion(interaction.guildId, targetIdInicio);
            const horaRelease = new Date().toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'America/Argentina/Buenos_Aires'
            });
            const timestampRelease = Math.floor(Date.now() / 1000);
            const textoCohost = fresh.coHostId ? `<@${fresh.coHostId}>` : 'Ninguno';

            let tituloEmbed =
                '<a:mariquieta:1534954231138746488> Southwest Florida \u2013 ***__Reinvitaciones Liberadas__*** <a:mariquieta:1534954231138746488>';
            let datosExtraSesion = '';

            if (fresh.tipo === 'rp') {
                tituloEmbed =
                    '<a:mariquieta:1534954231138746488> Southwest Florida \u2013 ***__Reinvitaciones Roleplay Liberadas__*** <a:mariquieta:1534954231138746488>';
                datosExtraSesion =
                    `> <:tres:1535001243204718612> **Estado de Peacetime:** **${fresh.peacetime || '\u2014'}**\n` +
                    `> <:cuatro:1534938460228550857> **L\u00edmite de Fail Roleplay:** **${fresh.limiteVelocidad || '\u2014'}**\n` +
                    `> <:cinco:1534938284218777630> **Servicios de emergencia:** **${fresh.serviciosEmergencia || '\u2014'}**\n` +
                    `> <:seis:1535001326927220919> **Co-Host de la Sesi\u00f3n:** ${textoCohost}\n` +
                    `> <:replica:1534982812116062370> Las velocidades de detenci\u00f3n son **+6 MPH** sobre el l\u00edmite establecido.\n`;
            } else if (fresh.tipo === 'meet') {
                tituloEmbed =
                    '<a:mariquieta:1534954231138746488> Southwest Florida \u2013 ***__Reinvitaciones Car Meet Liberadas__*** <a:mariquieta:1534954231138746488>';
                datosExtraSesion =
                    `> <:tres:1535001243204718612> **Tem\u00e1tica del Meet:** **${fresh.tematica || '\u2014'}**\n` +
                    `> <:cuatro:1534938460228550857> **Lugar actual:** **${fresh.ubicacion || '\u2014'}**\n` +
                    `> <:cinco:1534938284218777630> **Spots / Duraci\u00f3n:** **${fresh.spots || '\u2014'}**\n` +
                    `> <:seis:1535001326927220919> **Co-Host de la Sesi\u00f3n:** ${textoCohost}\n` +
                    `> <:flechareplica:1534982812116062370> Los veh\u00edculos deben ingresar __despacio__ al lugar del meet.\n`;
            } else {
                datosExtraSesion =
                    `> <:cuatro:1534938460228550857> **Co-Host de la Sesi\u00f3n:** ${textoCohost}\n`;
            }

            const infoDescripcion =
                `> <a:flecha:1534939368035324125> <@${interaction.user.id}> **\u00a1ha lanzado las reinvitaciones de la sesi\u00f3n!** Se ha alcanzado la meta de reacciones requeridas. Pod\u00e9s unirte al servidor usando el bot\u00f3n de abajo.\n\n` +
                `<:manual:1534999731019972671> **Informaci\u00f3n de la Reinvitaci\u00f3n**\n\n` +
                `> <:uno:1534938872977297559> **Reacciones alcanzadas:** \`${reaccionesRequeridas} / ${reaccionesRequeridas}\`\n` +
                `> <:dos:1535001133729447987> **Hora de liberaci\u00f3n:** **${horaRelease}** (<t:${timestampRelease}:t>)\n` +
                datosExtraSesion +
                `\n<:manual:1534999731019972671> **Antes de unirte**\n\n` +
                `> <:dot:1534938142665084938> Asegurate de estar verificado [aqu\u00ed](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
                `> <:dot:1534938142665084938> Lee la [informaci\u00f3n](https://discord.com/channels/1451939725308067842/1451942179877687399/1536059852432867412) & [veh\u00edculos baneados](https://discord.com/channels/1451939725308067842/1501739933495201925/1536064730223874132).\n` +
                `> <:dot:1534938142665084938> Registr\u00e1 tus veh\u00edculos en <#1505615426305130657>!\n\n` +
                `-# <a:adv:1534939309235376328> *\u00a1Ingres\u00e1 de inmediato antes de que el servidor se complete!*`;

            const embedRelease = new EmbedBuilder()
                .setTitle(tituloEmbed)
                .setDescription(infoDescripcion)
                .setColor('#74d4fc')
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
                    content: '@everyone \u00a1Las reinvitaciones han sido **LANZADAS**!',
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
                            $set: {
                                linkSesion,
                                estado: 'activa'
                            },
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
                console.error('[reinvitaciones] Error al enviar liberaci\u00f3n:', sendError);
            }
        });
    }
};
