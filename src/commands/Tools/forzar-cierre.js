import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Sesion from '../../../models/Session.js';

const ROL_ALTO_MANDO_ID = '1528870731629465752';
const HORAS_A_BORRAR = 3;

/**
 * Borra mensajes del canal de las últimas N horas (bulkDelete en lotes).
 * Ignora mensajes más viejos de 14 días (límite de Discord).
 */
async function borrarMensajesUltimasHoras(channel, horas = HORAS_A_BORRAR) {
    const limiteMs = Date.now() - horas * 60 * 60 * 1000;
    const limite14d = Date.now() - 14 * 24 * 60 * 60 * 1000;
    let borrados = 0;
    let lastId = undefined;
    let seguir = true;

    while (seguir) {
        const opciones = { limit: 100 };
        if (lastId) opciones.before = lastId;

        const batch = await channel.messages.fetch(opciones).catch(() => null);
        if (!batch || batch.size === 0) break;

        const eliminables = batch.filter(
            m => m.createdTimestamp >= limiteMs && m.createdTimestamp > limite14d && !m.pinned
        );

        if (eliminables.size > 0) {
            // bulkDelete necesita Collection o array de IDs
            const res = await channel.bulkDelete(eliminables, true).catch(() => null);
            if (res) borrados += res.size;
            else {
                // Fallback uno a uno
                for (const msg of eliminables.values()) {
                    await msg.delete().catch(() => null);
                    borrados++;
                }
            }
        }

        const oldest = batch.last();
        lastId = oldest?.id;

        // Si el mensaje más viejo del lote ya es anterior a la ventana, paramos
        if (!oldest || oldest.createdTimestamp < limiteMs) {
            seguir = false;
        }

        // Seguridad: no más de 10 lotes (1000 msgs)
        if (borrados >= 1000) seguir = false;
    }

    return borrados;
}

export default {
    data: new SlashCommandBuilder()
        .setName('forzar-cierre')
        .setDescription('Finaliza forzosamente una sesión y limpia mensajes de las últimas 3 horas.')
        .addUserOption(option =>
            option
                .setName('host')
                .setDescription('El usuario que estaba hosteando la sesión.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('motivo')
                .setDescription('Razón por la cual se cancela la sesión.')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (
            !interaction.member.roles.cache.has(ROL_ALTO_MANDO_ID) &&
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
        ) {
            return await interaction.reply({
                content:
                    '❌ **Acceso denegado.** Este comando es exclusivo para los integrantes del **Alto Mando**.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const hostUsuario = interaction.options.getUser('host');
        const motivoCancelacion = interaction.options.getString('motivo');

        // Cerrar sesión activa en DB si existe
        try {
            await Sesion.findOneAndUpdate(
                {
                    guildId: interaction.guildId,
                    estado: { $in: ['esperando_reacciones', 'activa'] }
                },
                {
                    $set: {
                        estado: 'cerrada',
                        fechaCierre: new Date()
                    }
                },
                { sort: { fechaInicio: -1 } }
            );
        } catch (e) {
            console.error('[forzar-cierre] Error cerrando sesión en DB:', e.message);
        }

        const embedCierreForzado = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<a:adv:1523027438030946446> Sesión Finalizada Forzosamente')
            .setDescription(
                `La sesión organizada por <@${hostUsuario.id}> fue cancelada por un integrante del **Alto Mando** (<@${interaction.user.id}>).\n\n` +
                    `<:pin:1523041306836996156> **Motivo:** ${motivoCancelacion}\n\n` +
                    `<a:not:1523026703201337436> *No se registraron penalizaciones en el historial ni en el perfil del Staff.*\n` +
                    `🗑️ *Se limpiarán los mensajes de las últimas **${HORAS_A_BORRAR} horas** en este canal.*`
            )
            .setFooter({
                text: '00Y4n Comunidad SWFL • Control de Alto Mando',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.editReply({
            embeds: [embedCierreForzado],
            allowedMentions: { parse: [] }
        });

        // Borrar mensajes de las últimas 3 horas (después del anuncio)
        let borrados = 0;
        try {
            borrados = await borrarMensajesUltimasHoras(interaction.channel, HORAS_A_BORRAR);
        } catch (e) {
            console.error('[forzar-cierre] Error borrando mensajes:', e.message);
        }

        // Aviso efímero al HC con el resultado (si el reply sigue existiendo puede haberse borrado)
        try {
            await interaction.followUp({
                content: `🗑️ Limpieza completada: se eliminaron **${borrados}** mensaje(s) de las últimas ${HORAS_A_BORRAR} horas.`,
                ephemeral: true
            });
        } catch {
            // El mensaje de reply pudo haberse borrado en el bulk — no es crítico
        }
    }
};
