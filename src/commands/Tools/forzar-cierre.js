import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Sesion from '../../../models/Session.js';
import { finalizarYPublicarLogSesion } from '../../utils/logSesionArchivo.js';

const ROL_ALTO_MANDO_ID = '1528870731629465752';
const HORAS_A_BORRAR = 3;

async function borrarMensajesUltimasHoras(channel, horas = HORAS_A_BORRAR) {
    const limiteMs = Date.now() - horas * 60 * 60 * 1000;
    const limite14d = Date.now() - 14 * 24 * 60 * 60 * 1000;
    let borrados = 0;
    let lastId = undefined;
    let seguir = true;
    let lotes = 0;

    while (seguir && lotes < 10) {
        lotes++;
        const opciones = { limit: 100 };
        if (lastId) opciones.before = lastId;

        const batch = await channel.messages.fetch(opciones).catch(() => null);
        if (!batch || batch.size === 0) break;

        const eliminables = batch.filter(
            m => m.createdTimestamp >= limiteMs && m.createdTimestamp > limite14d && !m.pinned
        );

        if (eliminables.size > 0) {
            const res = await channel.bulkDelete(eliminables, true).catch(() => null);
            if (res) borrados += res.size;
            else {
                for (const msg of eliminables.values()) {
                    await msg.delete().catch(() => null);
                    borrados++;
                }
            }
        }

        const oldest = batch.last();
        lastId = oldest?.id;
        if (!oldest || oldest.createdTimestamp < limiteMs) seguir = false;
    }

    return borrados;
}

export default {
    data: new SlashCommandBuilder()
        .setName('forzar-cierre')
        .setDescription('Finaliza forzosamente una sesion (sin cuota) y limpia mensajes de 3 horas.')
        .addUserOption(option =>
            option
                .setName('host')
                .setDescription('El usuario que estaba hosteando la sesion.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('motivo')
                .setDescription('Razon por la cual se cancela la sesion.')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (
            !interaction.member.roles.cache.has(ROL_ALTO_MANDO_ID) &&
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
        ) {
            return await interaction.reply({
                content:
                    'Acceso denegado. Este comando es exclusivo para los integrantes del Alto Mando.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const hostUsuario = interaction.options.getUser('host');
        const motivoCancelacion = interaction.options.getString('motivo');

        let sesionesCerradas = 0;
        try {
            const res = await Sesion.updateMany(
                {
                    guildId: interaction.guildId,
                    estado: { $in: ['esperando_reacciones', 'activa'] }
                },
                {
                    $set: {
                        estado: 'cerrada',
                        fechaCierre: new Date(),
                        cierreForzado: true,
                        cuentaParaCuota: false,
                        motivoCierreForzado: motivoCancelacion,
                        cerradoPor: interaction.user.id,
                        hostId: hostUsuario.id
                    }
                }
            );
            sesionesCerradas = res.modifiedCount || 0;

            try {
                const sesionCerrada = await Sesion.findOne({
                    guildId: interaction.guildId,
                    hostId: hostUsuario.id,
                    estado: 'cerrada'
                }).sort({ fechaCierre: -1 });
                if (sesionCerrada) {
                    await finalizarYPublicarLogSesion(interaction.client, sesionCerrada, {
                        notas: motivoCancelacion,
                        motivoCierre: motivoCancelacion
                    });
                } else {
                    await finalizarYPublicarLogSesion(interaction.client, {
                        guildId: interaction.guildId,
                        hostId: hostUsuario.id,
                        estado: 'cerrada',
                        fechaCierre: new Date(),
                        cierreForzado: true,
                        motivoCierreForzado: motivoCancelacion,
                        cuentaParaCuota: false
                    }, { notas: motivoCancelacion, motivoCierre: motivoCancelacion });
                }
            } catch (logErr) {
                console.error('[forzar-cierre] log sesion:', logErr?.message || logErr);
            }
        } catch (e) {
            console.error('[forzar-cierre] Error cerrando sesion en DB:', e.message);
        }

        const embedCierreForzado = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('Sesion Finalizada Forzosamente')
            .setDescription(
                `La sesion organizada por <@${hostUsuario.id}> fue cancelada por un integrante del Alto Mando (<@${interaction.user.id}>).\n\n` +
                    `**Motivo:** ${motivoCancelacion}\n\n` +
                    `*No se sumo cuota ni sesiones al host, co-host ni supervisor.*\n` +
                    `*Se limpiaran los mensajes de las ultimas **${HORAS_A_BORRAR} horas** en este canal.*`
            )
            .setFooter({
                text: '00Y4n Comunidad SWFL - Control de Alto Mando',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.editReply({
            embeds: [embedCierreForzado],
            allowedMentions: { parse: [] }
        });

        let borrados = 0;
        try {
            borrados = await borrarMensajesUltimasHoras(interaction.channel, HORAS_A_BORRAR);
        } catch (e) {
            console.error('[forzar-cierre] Error borrando mensajes:', e.message);
        }

        try {
            await interaction.followUp({
                content:
                    `Limpieza: **${borrados}** mensaje(s). Sesiones forzadas cerradas: **${sesionesCerradas}**. Cuota: **no sumada**.`,
                ephemeral: true
            });
        } catch {}
    }
};
