import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits,
    MessageFlags 
} from 'discord.js';

// Inicialización del mapa global para sesiones
global.coleccionSesiones = global.coleccionSesiones || new Map();

// Función auxiliar para verificar si una cadena es una URL bien formada
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
                .setDescription('ID del mensaje de Inicio/Startup de la sesión (Opcional, se autodetecta).')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('El emoji con el que reaccionará el bot (por defecto: ✔️).')
                .setRequired(false)),

    async execute(interaction) {
        // 🔒 SEGURIDAD: Bloqueo de Staff
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: `<:cruz00y4n:1519476959606734998> **No tienes permisos:** Solo el Staff puede gestionar las reinvitaciones.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const reaccionesRequeridas = interaction.options.getInteger('reacciones');
        const rawLink = interaction.options.getString('acceso');
        const idInicioManual = interaction.options.getString('id_inicio');
        const emojiInput = interaction.options.getString('emoji') || '✔️';

        // Intentar obtener el idInicio de la última sesión activa en la memoria global si no se especifica
        let targetIdInicio = idInicioManual;
        if (!targetIdInicio) {
            for (const [, sesionData] of global.coleccionSesiones) {
                if (sesionData.guildId === interaction.guildId && sesionData.idInicio) {
                    targetIdInicio = sesionData.idInicio;
                    break;
                }
            }
        }

        // Validar y formatear enlace de Roblox
        let linkSesion = rawLink.trim();
        if (!linkSesion.startsWith('http://') && !linkSesion.startsWith('https://')) {
            linkSesion = `https://${linkSesion}`;
        }

        if (!esURLValida(linkSesion)) {
            return await interaction.reply({
                content: `<:cruz00y4n:1519476959606734998> **Enlace inválido:** El enlace proporcionado (\`${rawLink}\`) no es una URL válida.`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Obtener la hora actual de Argentina (HH:MM)
        const ahora = new Date();
        const horaFormateada = ahora.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'America/Argentina/Buenos_Aires'
        });

        const timestampDiscord = Math.floor(ahora.getTime() / 1000);

        // Diseñar el Embed Inicial de Solicitud
        const embedReinvitacion = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<a:esp:1523026487240954019> Reinvitaciones de la Sesión <a:esp:1523026487240954019>')
            .setDescription(
                `¡Reaccioná a este mensaje para solicitar tu reinvitación!\n` +
                `Las reinvitaciones se liberarán automáticamente una vez alcanzada la meta de reacciones.\n\n` +
                `<:dot:1523041306836996156> **Reacciones requeridas:** \`${reaccionesRequeridas}\` ${emojiInput}`
            )
            .addFields({ 
                name: '<:fle:1523041359441952970> Última Regeneración', 
                value: `El enlace fue actualizado a las **${horaFormateada}** (<t:${timestampDiscord}:t>)`, 
                inline: false 
            })
            .setFooter({ text: '00Y4n Comunidad SWFL', iconURL: interaction.guild.iconURL() || undefined })
            .setTimestamp();

        // Enviar el aviso inicial con ping @here
        await interaction.reply({
            content: '<a:adv:1523027438030946446> **@here** ¡Atención a las reinvitaciones de la sesión!',
            embeds: [embedReinvitacion],
            allowedMentions: { parse: ['everyone', 'roles'] }
        });

        const mensajeEnviado = await interaction.fetchReply();

        // Colocar la reacción del Bot
        try {
            await mensajeEnviado.react(emojiInput);
        } catch (error) {
            console.error('No se pudo reaccionar con el emoji asignado:', error);
            if (emojiInput !== '✔️') {
                try { await mensajeEnviado.react('✔️'); } catch (e) {}
            }
        }

        // Colector de Reacciones
        const collector = mensajeEnviado.createReactionCollector({
            filter: (reaction, user) => !user.bot,
            time: 14400000 // 4 horas
        });

        collector.on('collect', async (reaction) => {
            try {
                const users = await reaction.users.fetch();
                const usuariosReales = users.filter(u => !u.bot).size;

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

                const infoDescripcion = 
                    `> <:dot:1523041306836996156> <@${interaction.user.id}> **¡ha liberado las reinvitaciones de la sesión!** Se ha alcanzado la meta de reacciones requeridas. Podés unirte al servidor utilizando el botón de abajo.\n\n` +
                    `<:flor:1523041315187855470> **Información de la Reinvitación**\n\n` +
                    `> <:uno:1523028217592676464> **Reacciones Alcanzadas:** \`${reaccionesRequeridas} / ${reaccionesRequeridas}\` <a:si:1523027371735777503>\n` +
                    `> <:dos:1523027468385128568> **Hora de Liberación:** **${horaRelease}** (<t:${timestampRelease}:t>)\n\n` +
                    `<:flor:1523041315187855470> **Antes de Unirte**\n\n` +
                    `> <:fle:1523041359441952970> Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
                    `> <:fle:1523041359441952970> Lee la [información](https://discord.com/channels/1451939725308067842/1516590524725989437) & [vehículos baneados](https://discord.com/channels/1451939725308067842/1501739933495201925/1525190667545088225).\n` +
                    `> <:fle:1523041359441952970> Registra tus vehículos en <#1505615426305130657>!\n\n` +
                    `<a:adv:1523027438030946446> *¡Ingresá de inmediato antes de que el servidor vuelva a completarse!*`;

                const embedRelease = new EmbedBuilder()
                    .setTitle('<a:confeti:1523026892981145600> Southwest Florida – ***__Reinvitaciones Liberadas__*** <a:confeti:1523026892981145600>')
                    .setDescription(infoDescripcion)
                    .setColor('#74d4fc')
                    .setFooter({ text: '00Y4n Comunidad SWFL', iconURL: interaction.guild.iconURL() || undefined })
                    .setTimestamp();

                // ÚNICO BOTÓN: "Link de la Sesión" para obligar a verificar el voto
                const fila = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('verificar_voto_swfl')
                        .setLabel('Link de la Sesión')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('1524936452574806076')
                );

                try {
                    const msgRelease = await interaction.channel.send({
                        content: '@everyone <a:adv:1523027438030946446> ¡Las reinvitaciones han sido **LIBERADAS**!',
                        embeds: [embedRelease],
                        components: [fila],
                        allowedMentions: { parse: ['everyone', 'roles'] }
                    });

                    // Guardar idInicio junto con el link para que se pueda verificar el voto
                    global.coleccionSesiones.set(msgRelease.id, {
                        idInicio: targetIdInicio,
                        linkSesion,
                        guildId: interaction.guildId,
                        tipo: 'reinvitacion'
                    });
                } catch (sendError) {
                    console.error('Error al enviar mensaje de liberación de reinvitaciones:', sendError);
                }
            }
        });
    },
};
