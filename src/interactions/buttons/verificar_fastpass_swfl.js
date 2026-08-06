import Sesion from '../../../models/Session.js';

const ROLES_VIP_IDS = [
    '1512120103771050005', // Equipo de Staff
    '1503769793474597027', // FastPass
    '1530287573547880581'  // Ciudadano Del Día
];

async function obtenerMensajeInicio(interaction, idInicio) {
    if (!idInicio) return null;

    try {
        const msg = await interaction.channel.messages.fetch(idInicio);
        if (msg) return msg;
    } catch (_) {}

    if (!interaction.guild) return null;
    for (const channel of interaction.guild.channels.cache.values()) {
        if (!channel.isTextBased?.() || channel.id === interaction.channelId) continue;
        try {
            const msg = await channel.messages.fetch(idInicio);
            if (msg) return msg;
        } catch (_) {}
    }
    return null;
}

async function usuarioVotoEnInicio(interaction, sesion) {
    if (Array.isArray(sesion.reacciones) && sesion.reacciones.some((r) => r.userId === interaction.user.id)) {
        return { voto: true, msgInicio: null };
    }

    const msgInicio = await obtenerMensajeInicio(interaction, sesion.idInicio);
    if (!msgInicio) {
        return { voto: false, msgInicio: null, sinMensaje: true };
    }

    if (msgInicio.partial) {
        try {
            await msgInicio.fetch();
        } catch (_) {}
    }

    for (const reaction of msgInicio.reactions.cache.values()) {
        try {
            const usuarios = await reaction.users.fetch();
            if (usuarios.has(interaction.user.id)) {
                return { voto: true, msgInicio };
            }
        } catch (_) {}
    }

    return { voto: false, msgInicio };
}

export default {
    name: 'verificar_fastpass_swfl',

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        global.coleccionFastPass = global.coleccionFastPass || new Map();
        const linkReal = global.coleccionFastPass.get(interaction.message.id);

        if (!linkReal) {
            return interaction.editReply({
                content:
                    '❌ **Error de sincronización:** El bot se reinició o esta sesión expiró. Pedile al Staff que vuelva a lanzar el FastPass.'
            });
        }

        const tieneRolVip = interaction.member.roles.cache.some((role) =>
            ROLES_VIP_IDS.includes(role.id)
        );

        if (!tieneRolVip) {
            return interaction.editReply({
                content:
                    '❌ **No tenés acceso:** Este botón es exclusivo para miembros con **FastPass**, **Staff** o **Ciudadano del Día**.'
            });
        }

        let sesion = null;
        try {
            sesion = await Sesion.findOne({
                guildId: interaction.guildId,
                estado: { $in: ['esperando_reacciones', 'activa'] }
            })
                .sort({ fechaInicio: -1 })
                .lean();
        } catch (err) {
            console.error('[fastpass] Error buscando sesión:', err?.message || err);
        }

        if (!sesion || !sesion.idInicio) {
            return interaction.editReply({
                content:
                    '❌ **No hay una sesión activa** vinculada. El host debe usar `/inicio_swfl` antes de que el FastPass libere el enlace.'
            });
        }

        const { voto, msgInicio, sinMensaje } = await usuarioVotoEnInicio(interaction, sesion);

        if (!voto) {
            const linkMensaje = msgInicio?.url
                ? `\n\n👉 Votá acá: ${msgInicio.url}`
                : '\n\n👉 Buscá el mensaje de **`/inicio_swfl`** de esta sesión y reaccioná.';

            if (sinMensaje) {
                return interaction.editReply({
                    content:
                        '❌ **No se pudo verificar tu voto** (no se encontró el mensaje de inicio).\n' +
                        'Reaccioná al mensaje de **`/inicio_swfl`** y volvé a intentar.' +
                        linkMensaje
                });
            }

            return interaction.editReply({
                content:
                    '❌ **No obtuviste el FastPass porque todavía no votaste.**\n' +
                    'Primero tenés que **reaccionar** en el mensaje de inicio de la sesión. Después volvé a apretar el botón.' +
                    linkMensaje
            });
        }

        return interaction.editReply({
            content:
                '🎉 **¡FastPass verificado!** Acá tenés tu enlace de entrada anticipada:\n' +
                `🔗 ${linkReal}\n\n` +
                '*Recordá que filtrar este link es motivo de ban permanente.*'
        });
    }
};
