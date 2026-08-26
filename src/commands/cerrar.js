import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Historial from '../../models/Historial.js';
import Session from '../../models/Session.js';
import { sumarCuotaStaff } from '../utils/gestorCuotas.js';
import { pagarStaffSesion } from '../utils/gestorPagoHost.js';
import { finalizarYPublicarLogSesion } from '../utils/logSesionArchivo.js';

function formatearDuracionMs(ms) {
    if (!ms || ms < 0) return 'No disponible';
    const totalMin = Math.round(ms / 60000);
    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;
    const partes = [];
    if (horas > 0) partes.push(`${horas} hora${horas !== 1 ? 's' : ''}`);
    if (minutos > 0 || horas === 0) partes.push(`${minutos} minuto${minutos !== 1 ? 's' : ''}`);
    return partes.join(' y ');
}

export default {
    data: {
        name: 'cerrar',
        description: 'Cierra oficialmente la sesion de SWFL, elimina avisos de las ultimas 4hs y muestra el resumen.',
        options: [
            {
                name: 'tipo',
                description: 'Que sesion estas cerrando?',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'Roleplay', value: 'rp' },
                    { name: 'Car Meet', value: 'meet' }
                ]
            },
            {
                name: 'notas',
                description: 'Anade un comentario final o nota sobre la sesion (opcional).',
                type: ApplicationCommandOptionType.String,
                required: false
            },
            {
                name: 'imagen',
                description: 'Sube la foto o banner de la sesion finalizada (opcional).',
                type: ApplicationCommandOptionType.Attachment,
                required: false
            }
        ]
    },

    async execute(interaction) {
        const ROL_STAFF = '1512120103771050005';
        if (!interaction.member.roles.cache.has(ROL_STAFF)) {
            return interaction.reply({
                content:
                    '<:cruz:1534937767652495360> Solo el **Staff 00Y4n** puede usar `/cerrar`.',
                ephemeral: true
            });
        }

        const URL_IMAGEN_DEFAULT =
            'https://cdn.discordapp.com/attachments/1505017301089652898/1536043758393491549/Sesion_Concluida_1.png';

        const tipo = interaction.options.getString('tipo');
        const notasHost = interaction.options.getString('notas') || 'Sin notas adicionales.';
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        await interaction.reply({
            content: 'Cerrando la sesion, limpiando el canal y actualizando base de datos...',
            ephemeral: true
        });

        const fechaFin = new Date();
        const guildId = interaction.guild.id;

        let sesionActiva = null;
        let fechaInicio = null;
        let horasCalculadas = 0;
        let minutosCalculados = 0;
        let duracionMostrar = 'No disponible';
        let pagos = { host: 0, cohost: 0, supervisor: 0 };

        try {
            sesionActiva = await Session.findOneAndUpdate(
                {
                    guildId,
                    tipo,
                    estado: { $in: ['activa', 'esperando_reacciones'] }
                },
                {
                    estado: 'cerrada',
                    fechaCierre: fechaFin
                },
                { sort: { fechaInicio: -1 }, new: true }
            );

            if (sesionActiva?.fechaInicio) {
                fechaInicio = new Date(sesionActiva.fechaInicio);
                const ms = fechaFin.getTime() - fechaInicio.getTime();
                horasCalculadas = Number((ms / 3600000).toFixed(2));
                minutosCalculados = Math.max(0, Math.round(ms / 60000));
                duracionMostrar = formatearDuracionMs(ms);
                sesionActiva.duracionMinutos = minutosCalculados;
                await sesionActiva.save().catch(() => null);
            } else {
                horasCalculadas = 0;
                minutosCalculados = 0;
                duracionMostrar = 'No registrada';
            }

            const hostId = sesionActiva?.hostId || interaction.user.id;
            const supervisorId = sesionActiva?.supervisorId || null;
            const coHostId = sesionActiva?.coHostId || null;
            const hostSigue = sesionActiva?.hostActivo !== false;
            const horasHost = horasCalculadas > 0 ? horasCalculadas : 0;
            const horasCohost = horasCalculadas > 0 ? Number((horasCalculadas * 0.5).toFixed(2)) : 0;
            const horasSup = horasCalculadas > 0 ? Number((horasCalculadas * 0.25).toFixed(2)) : 0;

            const noSumarCuota =
                !sesionActiva ||
                sesionActiva.cierreForzado === true ||
                sesionActiva.cuentaParaCuota === false;

            if (noSumarCuota) {
                console.log(`[cerrar] Sin cuota. host=${hostId}`);
            } else {
                if (hostSigue && hostId) {
                    await sumarCuotaStaff(guildId, hostId, {
                        horas: horasHost,
                        sesionesOrganizadas: 1,
                        motivo: `Cierre de sesion ${tipo} (host hasta el final) — ${duracionMostrar}`,
                        executorId: interaction.user.id
                    });
                }
                if (coHostId && coHostId !== hostId) {
                    await sumarCuotaStaff(guildId, coHostId, {
                        horas: horasCohost || 0.25,
                        sesionesOrganizadas: 1,
                        motivo: `Cierre de sesion ${tipo} (co-host hasta el final) — ${duracionMostrar}`,
                        executorId: interaction.user.id
                    });
                }
                if (supervisorId && supervisorId !== hostId && supervisorId !== coHostId) {
                    await sumarCuotaStaff(guildId, supervisorId, {
                        horas: horasSup,
                        sesionesSupervisadas: 1,
                        motivo: `Cierre de sesion ${tipo} (supervisor hasta el final) — ${duracionMostrar}`,
                        executorId: interaction.user.id
                    });
                }
            }

            if (!noSumarCuota) {
                try {
                    pagos = await pagarStaffSesion({
                        hostId: hostSigue ? hostId : null,
                        coHostId,
                        supervisorId,
                        duracionMinutos: minutosCalculados,
                        cuentaParaCuota: true
                    });
                } catch (e) {
                    console.error('[cerrar] Error pago host:', e?.message || e);
                }
            }

            await Historial.create({
                evento: 'SESION_CERRADA',
                mensajeId: interaction.id,
                idInicio: sesionActiva?.idInicio || interaction.id,
                guildId,
                hostId,
                hostTag: interaction.user.tag,
                tipo,
                detalles: {
                    duracionTexto: duracionMostrar,
                    duracionMinutos: minutosCalculados,
                    horasSumadas: horasCalculadas,
                    fechaInicio: fechaInicio?.toISOString() || null,
                    fechaFin: fechaFin.toISOString(),
                    supervisorId,
                    coHostId,
                    hostSigue,
                    motivo: notasHost,
                    sinCuota: noSumarCuota,
                    pagos
                }
            });
        } catch (dbError) {
            console.error('Error actualizando la base de datos en /cerrar:', dbError);
        }

        try {
            const cuatroHorasAtras = Date.now() - 4 * 60 * 60 * 1000;
            let lastId = undefined;
            for (let i = 0; i < 3; i++) {
                const mensajes = await interaction.channel.messages.fetch({
                    limit: 100,
                    ...(lastId ? { before: lastId } : {})
                });
                if (!mensajes.size) break;
                const botId = interaction.client.user.id;
                const aBorrar = [];
                for (const m of mensajes.values()) {
                    if (m.createdTimestamp < cuatroHorasAtras) continue;
                    if (m.author?.id === botId) aBorrar.push(m);
                }
                if (aBorrar.length) {
                    await interaction.channel.bulkDelete(aBorrar, true).catch(() => null);
                }
                lastId = mensajes.last()?.id;
            }
        } catch (error) {
            console.error('Error limpiando mensajes en /cerrar:', error);
        }

        const titulo = `<a:mariquieta:1534954231138746488> Southwest Florida Comunidad 00Y4n — Sesión Finalizada`;

        const inicioUnix = fechaInicio ? Math.floor(fechaInicio.getTime() / 1000) : null;
        const finUnix = Math.floor(fechaFin.getTime() / 1000);
        const hostMencion = sesionActiva?.hostId || interaction.user.id;

        const lineasTiempo = [];
        if (inicioUnix) {
            lineasTiempo.push(`<:dotn:1542258368301899866> **Hora de inicio:** <t:${inicioUnix}:F>`);
        } else {
            lineasTiempo.push(`<:dotn:1542258368301899866> **Hora de inicio:** No registrada`);
        }
        lineasTiempo.push(`<:dotn:1542258368301899866> **Hora de cierre:** <t:${finUnix}:F>`);
        lineasTiempo.push(`<:dotn:1542258368301899866> **Duración:** ${duracionMostrar}`);

        let pagosTxt = '';
        if (pagos && (pagos.host || pagos.cohost)) {
            pagosTxt =
                `\n<:dotn:1542258368301899866> **Pagos staff:** Host $${Number(pagos.host).toLocaleString()}` +
                (pagos.cohost ? ` · Co-host $${Number(pagos.cohost).toLocaleString()}` : '') +
                (pagos.supervisor ? ` · Supervisor $${Number(pagos.supervisor).toLocaleString()}` : '');
        }

        const embedCierre = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(
                `<:dot:1534938142665084938> <@${hostMencion}> **ha finalizado su servidor.** Agradecemos a todos los que participaron y los invitamos a volver pronto para la próxima sesión.\n\n` +
                    lineasTiempo.join('\n') +
                    `\n<:dotn:1542258368301899866> **Notas del host:** ${notasHost}` +
                    pagosTxt +
                    `\n\n<:replica:1534982812116062370> Los servidores se hostean de forma activa a lo largo del día mientras trabajamos hacia el objetivo de hosting 24/7. No te desanimes si no hay una sesión en curso — otra comenzará pronto.`
            )
            .setColor('#74d4fc');

        if (fotoAdjunta) embedCierre.setImage(fotoAdjunta.url);
        else embedCierre.setImage(URL_IMAGEN_DEFAULT);

        const filaComponentes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('abrir_feedback_swfl')
                .setLabel('Opinion de la Sesion')
                .setEmoji('1534938422202994755')
                .setStyle(ButtonStyle.Secondary)
        );

        try {
            await finalizarYPublicarLogSesion(interaction.client, sesionActiva, {
                notas: notasHost
            });
        } catch (e) {
            console.error('[cerrar] log sesion:', e?.message || e);
        }

        await interaction.channel.send({ embeds: [embedCierre], components: [filaComponentes] });
    }
};
