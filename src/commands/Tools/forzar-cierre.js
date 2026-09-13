import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import Sesion from '../../../models/Session.js';
import { finalizarYPublicarLogSesion } from '../../utils/logSesionArchivo.js';
import { E } from '../../config/emojis.js';

const ROL_ALTO_MANDO_ID = '1528870731629465752';
const CANAL_LOG_ID = '1505015805891579934';
const HORAS_A_BORRAR = 3;
const URL_IMAGEN_DEFAULT =
    'https://cdn.discordapp.com/attachments/1505017301089652898/1548119384529309797/Sesion_Concluida_1.png?ex=6aa5e607&is=6aa49487&hm=41f67f388a23c3391bfdfc371ee920df7d1c39370767d1db41fa65bf11dcd7ee&';

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

function buildEmbedCierreForzado({ hostId, staffId, motivo, guild }) {
    const titulo =
        (E.a2alas || '') +
        ` Southwest Florida Comunidad 00Y4n — __*Sesión Finalizada (Forzada)*__ ` +
        (E.a2alas || '');

    return new EmbedBuilder()
        .setTitle(titulo)
        .setDescription(
            (E.dot || '•') +
                ` La sesión organizada por <@${hostId}> **fue cerrada de forma forzada**.\n\n` +
                (E.jpuntderecha || '›') +
                ` **Cerrado por:** <@${staffId}>\n` +
                (E.jpuntderecha || '›') +
                ` **Motivo:** ${motivo}\n` +
                (E.jpuntderecha || '›') +
                ` **Hora de cierre:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                (E.menos || '') +
                ` *No se sumó cuota ni sesiones al host, co-host ni supervisor.*\n\n` +
                (E.replican || '') +
                ` *Los servidores se hostean de forma activa a lo largo del día mientras trabajamos hacia el objetivo de hosting 24/7. No te desanimes si no hay una sesión en curso — otra comenzará pronto*.`
        )
        .setColor('#74d4fc')
        .setImage(URL_IMAGEN_DEFAULT)
        .setFooter({
            text: '00Y4n Comunidad SWFL • Cierre forzado por Alto Mando',
            iconURL: guild?.iconURL?.() || undefined
        })
        .setTimestamp();
}

export default {
    data: new SlashCommandBuilder()
        .setName('forzar-cierre')
        .setDescription('Finaliza forzosamente una sesión (sin cuota) y limpia mensajes de 3 horas.')
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
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
                        motivoCierreForzado: motivoCancelacion,
                        cerradoPor: interaction.user.id,
                        cuentaParaCuota: false
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
                    await finalizarYPublicarLogSesion(
                        interaction.client,
                        {
                            guildId: interaction.guildId,
                            hostId: hostUsuario.id,
                            estado: 'cerrada',
                            fechaCierre: new Date(),
                            cierreForzado: true,
                            motivoCierreForzado: motivoCancelacion,
                            cuentaParaCuota: false
                        },
                        { notas: motivoCancelacion, motivoCierre: motivoCancelacion }
                    );
                }
            } catch (logErr) {
                console.error('[forzar-cierre] log sesion:', logErr?.message || logErr);
            }
        } catch (e) {
            console.error('[forzar-cierre] Error cerrando sesión en DB:', e.message);
        }

        // 1) Limpiar primero para no borrar el anuncio de cierre
        let borrados = 0;
        try {
            borrados = await borrarMensajesUltimasHoras(interaction.channel, HORAS_A_BORRAR);
        } catch (e) {
            console.error('[forzar-cierre] Error borrando mensajes:', e.message);
        }

        const embedCierreForzado = buildEmbedCierreForzado({
            hostId: hostUsuario.id,
            staffId: interaction.user.id,
            motivo: motivoCancelacion,
            guild: interaction.guild
        });

        // 2) Mensaje público en el canal de la sesión (igual estilo que /cerrar)
        try {
            await interaction.channel.send({
                embeds: [embedCierreForzado],
                allowedMentions: { parse: [] }
            });
        } catch (e) {
            console.error('[forzar-cierre] Error enviando embed al canal:', e.message);
        }

        // 3) Log en canal de logs
        try {
            const logCh = await interaction.guild.channels.fetch(CANAL_LOG_ID).catch(() => null);
            if (logCh?.isTextBased()) {
                await logCh.send({
                    embeds: [embedCierreForzado],
                    allowedMentions: { parse: [] }
                });
            }
        } catch (e) {
            console.error('[forzar-cierre] Error enviando log:', e.message);
        }

        await interaction.editReply({
            content:
                `✅ Cierre forzado publicado.\n` +
                `🗑️ Limpieza: **${borrados}** mensaje(s).\n` +
                `Sesiones forzadas cerradas: **${sesionesCerradas}**. Cuota: **no sumada**.`
        });
    }
};
