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

function esURLValida(cadena) {
    try {
        const url = new URL(cadena);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName('reinvitaciones')
        .setDescription('Envía el aviso de reinvitaciones y libera los accesos al alcanzar las reacciones requeridas.')
        .addIntegerOption(option =>
            option.setName('reacciones')
                .setDescription('Cantidad de reacciones requeridas para habilitar las reinvitaciones.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('acceso')
                .setDescription('Enlace del servidor privado de Roblox para la reinvitación.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('id_inicio')
                .setDescription('ID del mensaje de Lanzamiento/Inicio de la sesión (Opcional, se autodetecta).')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('El emoji con el que reaccionará el bot (por defecto: ✔️).')
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
        const emojiInput = interaction.options.getString('emoji') || '✔️';

        let sesionData = null;
        let targetIdInicio = idInicioManual || null;

        // 1. Buscar en memoria global
        if (!targetIdInicio) {
            for (const [, data] of global.coleccionSesiones.entries()) {
                if (data.guildId === interaction.guildId && (data.tipo === 'rp' || data.tipo === 'meet')) {
                    targetIdInicio = data.idInicio;
                    break;
                }
            }
        }

        // 2. Buscar en MongoDB
        if (!sesionData) {
            try {
                let doc = null;
                if (targetIdInicio) {
                    doc = await Sesion.findOne({ idInicio: targetIdInicio });
                }
                if (!doc) {
                    doc = await Sesion.findOne({
                        guildId: interaction.guildId,
                        estado: { $in: ['activa', 'esperando_reacciones'] }
                    }).sort({ fechaInicio: -1 });
                }
                if (doc) {
                    sesionData = doc;
                    targetIdInicio = doc.idInicio;
                }
            } catch (e) {
                console.error('Error al consultar MongoDB:', e);
            }
        }

        let linkSesion = rawLink.trim();
        if (!linkSesion.startsWith('http://') && !linkSesion.startsWith('https://')) {
            linkSesion = `https://${linkSesion}`;
        }

        if (!esURLValida(linkSesion)) {
            return await interaction.reply({
                content: `<:cruz00y4n:1534937767652495360> **Enlace inválido:** El enlace proporcionado (\`${rawLink}\`) no es una URL válida.`,
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

        const embedReinvitacion = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<a:esp:1534954134732804308> Reinvitaciones de la Sesión <a:esp:1534954134732804308>')
            .setDescription(
                `¡Reaccioná a este mensaje para solicitar tu reinvitación!\n` +
                `Las reinvitaciones se liberarán automáticamente una vez alcanzada la meta de reacciones.\n\n` +
                `<:dot:1534938142665084938> **Reacciones requeridas:** \`${reaccionesRequeridas}\` ${emojiInput}`
            )
            .addFields({
                name: '<:fle:1534937306191102125> Última Regeneración',
                value: `El enlace fue actualizado a las **${horaFormateada}** (<t:${timestampDiscord}:t>)`,
                inline: false
            })
            .setFooter({ text: '00Y4n Comunidad SWFL', iconURL: interaction.guild.iconURL() || undefined })
            .setTimestamp();

        await interaction.reply({
            content: '<a:corasdandovueltas:1534939964150907000> **@here** ¡Atención a las reinvitaciones de la sesión!',
            embeds: [embedReinvitacion],
            allowedMentions: { parse: ['everyone', 'roles', 'users'] }
        });

        const mensajeEnviado = await interaction.fetchReply();

        try {
            await mensajeEnviado.react(emojiInput);
        } catch (reactError) {
            console.error('Error al reaccionar al mensaje de reinvitación:', reactError);
            try {
                await mensajeEnviado.react('✔️');
            } catch {}
        }

        const filter = (reaction, user) => !user.bot;
        const collector = mensajeEnviado.createReactionCollector({
            filter,
            time: 2 * 60 * 60 * 1000
        });

        collector.on('collect', async () => {
            try {
                const fetched = await mensajeEnviado.reactions.cache.first()?.users.fetch();
                const usuariosReales = fetched ? fetched.filter(u => !u.bot).size : 0;

                if (usuariosReales >= reaccionesRequeridas) {
                    collector.stop('meta_alcanzada');
                }
            } catch (err) {
                console.error('Error al procesar reacciones:', err);
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'meta_alcanzada') {
                try {
                    await mensajeEnviado.delete();
                } catch (error) {
                    console.error('Error al eliminar mensaje de reinvitación:', error);
                }

                const horaRelease = new Date().toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'America/Argentina/Buenos_Aires'
                });
                const timestampRelease = Math.floor(Date.now() / 1000);

                // Refrescar sesión por si se asignó co-host después
                try {
                    if (targetIdInicio) {
                        const docFresh = await Sesion.findOne({ idInicio: targetIdInicio });
                        if (docFresh) sesionData = docFresh;
                    }
                } catch {}

                const textoCohost = sesionData?.coHostId
                    ? `<@${sesionData.coHostId}>`
                    : 'Ninguno';

                let datosExtraSesion = '';
                let tituloEmbed = '<a:confeti:1523026892981145600> Southwest Florida – ***__Reinvitaciones Liberadas__*** <a:confeti:1523026892981145600>';

                if (sesionData?.tipo === 'rp') {
                    tituloEmbed = '<a:mariquieta:1534954231138746488> Southwest Florida – ***__Reinvitaciones Roleplay Liberadas__*** <a:mariquieta:1534954231138746488>';
                    const limiteVel = sesionData.limiteVelocidad || sesionData.limite || 'No especificada';
                    datosExtraSesion =
                        `> <:tres:1535001243204718612> **Estado de Peacetime:** ${sesionData.peacetime || 'No especificado'}\n` +
                        `> <:cuatro:1534938460228550857> **Velocidad de Fail Roleplay:** ${limiteVel}\n` +
                        `> <:cinco:1534938284218777630> **Co-Host de la Sesión:** ${textoCohost}\n` +
                        `> <:replica:1534982812116062370> Las velocidades de detención son **+6 MPH** sobre el límite de velocidad establecido.\n`;
                } else if (sesionData?.tipo === 'meet') {
                    tituloEmbed = '<a:mariquieta:1534954231138746488> Southwest Florida – ***__Reinvitaciones Car Meet Liberadas__*** <a:mariquieta:1534954231138746488>';
                    datosExtraSesion =
                        `> <:tres:1535001243204718612> **Temática del Meet:** ${sesionData.tematica || 'No especificada'}\n` +
                        `> <:cuatro:1534938460228550857> **Lugar Actual:** ${sesionData.ubicacion || 'No especificado'}\n` +
                        `> <:cinco:1534938284218777630> **Spots / Duración:** ${sesionData.spots || 'No especificado'}\n` +
                        `> <:seis:1535001326927220919> **Co-Host de la Sesión:** ${textoCohost}\n` +
                        `> <:flechareplica:1534982812116062370> Los vehículos deben ingresar __despacio__ al lugar actual del meet.\n`;
                } else {
                    // Sesión genérica: igual mostrar co-host si existe
                    datosExtraSesion =
                        `> <:cuatro:1534938460228550857> **Co-Host de la Sesión:** ${textoCohost}\n`;
                }

                const infoDescripcion =
                    `> <a:flecha:1534939368035324125> <@${interaction.user.id}> **¡ha lanzado las reinvitaciones de la sesión!** Se ha alcanzado la meta de reacciones requeridas. Podés unirte al servidor utilizando el botón de abajo.\n\n` +
                    `<:manual:1534999731019972671> **Información de la Reinvitación**\n\n` +
                    `> <:uno:1534938872977297559> **Reacciones Alcanzadas:** \`${reaccionesRequeridas} / ${reaccionesRequeridas}\` \n` +
                    `> <:dos:1535001133729447987> **Hora de Liberación:** **${horaRelease}** (<t:${timestampRelease}:t>)\n` +
                    datosExtraSesion +
                    `\n<:manual:1534999731019972671> **Antes de Unirte**\n\n` +
                    `> <:dot:1534938142665084938> Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
                    `> <:dot:1534938142665084938> Lee la [información](https://discord.com/channels/1451939725308067842/1451942179877687399/1536059852432867412) & [vehículos baneados](https://discord.com/channels/1451939725308067842/1501739933495201925/1536064730223874132).\n` +
                    `> <:dot:1534938142665084938> Registra tus vehículos en <#1505615426305130657>!\n\n` +
                    `-# <a:adv:1534939309235376328> *¡Ingresá de inmediato antes de que el servidor vuelva a completarse!*`;

                const embedRelease = new EmbedBuilder()
                    .setTitle(tituloEmbed)
                    .setDescription(infoDescripcion)
                    .setColor('#74d4fc')
                    .setFooter({ text: '00Y4n Comunidad SWFL', iconURL: interaction.guild.iconURL() || undefined })
                    .setTimestamp();

                const fila = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('verificar_voto_swfl')
                        .setLabel('Link de la Sesión')
                        .setEmoji('1534937419231527036')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('1524936452574806076')
                );

                try {
                    const msgRelease = await interaction.channel.send({
                        content: '@everyone ¡Las reinvitaciones han sido **LANZADAS**!',
                        embeds: [embedRelease],
                        components: [fila],
                        allowedMentions: { parse: ['everyone', 'roles'] }
                    });

                    global.coleccionSesiones.set(msgRelease.id, {
                        idInicio: targetIdInicio,
                        linkSesion,
                        guildId: interaction.guildId,
                        tipo: 'reinvitacion',
                        coHostId: sesionData?.coHostId || null
                    });

                    if (targetIdInicio) {
                        await Sesion.updateOne(
                            { idInicio: targetIdInicio },
                            {
                                $set: { linkSesion },
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
                        idInicio: targetIdInicio || 'S/N',
                        hostId: interaction.user.id,
                        hostTag: interaction.user.tag,
                        tipo: sesionData?.tipo || 'reinvitacion',
                        detalles: {
                            reaccionesRequeridas,
                            linkSesion,
                            coHostId: sesionData?.coHostId || null
                        },
                        guildId: interaction.guildId
                    });
                } catch (sendError) {
                    console.error('Error al enviar mensaje de liberación de reinvitaciones:', sendError);
                }
            }
        });
    },
};
