import { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Historial from '../../models/Historial.js';
import Session from '../../models/Session.js';
import { sumarCuotaStaff } from '../utils/gestorCuotas.js';

function parsearDuracionAHoras(textoDuracion) {
    let horas = 0;
    const matchHoras = textoDuracion.match(/(\d+(?:[\.,]\d+)?)\s*(?:h|hora|horas)/i);
    const matchMins = textoDuracion.match(/(\d+)\s*(?:m|min|minuto|minutos)/i);

    if (matchHoras) horas += parseFloat(matchHoras[1].replace(',', '.'));
    if (matchMins) horas += parseInt(matchMins[1], 10) / 60;

    if (!matchHoras && !matchMins) {
        const numeroDirecto = parseFloat(textoDuracion.replace(',', '.'));
        if (!isNaN(numeroDirecto)) horas = numeroDirecto;
    }

    return Number(horas.toFixed(2));
}

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
        name: 'cerrar_swfl',
        description: 'Cierra oficialmente la sesión de SWFL, elimina avisos de las últimas 4hs y muestra el resumen.',
        options: [
            {
                name: 'tipo',
                description: '¿Qué sesión estás cerrando?',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'Roleplay', value: 'rp' },
                    { name: 'Car Meet', value: 'meet' }
                ]
            },
            {
                name: 'duracion',
                description: 'Duración reportada (opcional si hay /inicio_swfl). Ej: 1 hora y 15 minutos',
                type: ApplicationCommandOptionType.String,
                required: false
            },
            {
                name: 'notas',
                description: 'Añade un comentario final o nota sobre la sesión (opcional).',
                type: ApplicationCommandOptionType.String,
                required: false
            },
            {
                name: 'imagen',
                description: 'Sube la foto o banner de la sesión finalizada (opcional).',
                type: ApplicationCommandOptionType.Attachment,
                required: false
            }
        ]
    },

    async execute(interaction) {
        const URL_IMAGEN_DEFAULT =
            'https://cdn.discordapp.com/attachments/1505015805891579934/1535815064580268042/Sesion_Concluida_1.png?ex=6a7922bd&is=6a77d13d&hm=10e5a22b14014120363f1acb2fcb15c9338c14d4b289437af73c095042445526';

        const tipo = interaction.options.getString('tipo');
        const duracionTexto = interaction.options.getString('duracion');
        const notasHost = interaction.options.getString('notas') || 'Sin notas adicionales.';
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        await interaction.reply({
            content: 'Cerrando la sesión, limpiando el canal y actualizando base de datos...',
            ephemeral: true
        });

        const fechaFin = new Date();
        const guildId = interaction.guild.id;

        let sesionActiva = null;
        let fechaInicio = null;
        let horasCalculadas = 0;
        let minutosCalculados = 0;
        let duracionMostrar = 'No disponible';

        try {
            sesionActiva = await Session.findOneAndUpdate(
                {
                    guildId,
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
            } else if (duracionTexto) {
                horasCalculadas = parsearDuracionAHoras(duracionTexto);
                minutosCalculados = Math.round(horasCalculadas * 60);
                duracionMostrar = duracionTexto;
            } else {
                horasCalculadas = 0;
                minutosCalculados = 0;
                duracionMostrar = 'No registrada';
            }

            const hostId = sesionActiva?.hostId || interaction.user.id;
            const supervisorId = sesionActiva?.supervisorId || null;
            const coHostId = sesionActiva?.coHostId || null;

            const noSumarCuota =
                !sesionActiva ||
                sesionActiva.cierreForzado === true ||
                sesionActiva.cuentaParaCuota === false;

            if (noSumarCuota) {
                console.log(`[cerrar_swfl] Sin cuota (sin sesión activa o cierre forzado). host=${hostId}`);
            } else if (horasCalculadas > 0 || minutosCalculados > 0) {
                await sumarCuotaStaff(guildId, hostId, {
                    horas: horasCalculadas,
                    sesionesOrganizadas: 1,
                    motivo: `Cierre de sesión ${tipo} — ${duracionMostrar}`,
                    executorId: interaction.user.id
                });

                if (coHostId && coHostId !== hostId) {
                    await sumarCuotaStaff(guildId, coHostId, {
                        horas: Number((horasCalculadas * 0.5).toFixed(2)),
                        sesionesOrganizadas: 1,
                        motivo: `Co-Host sesión ${tipo} — ${duracionMostrar}`,
                        executorId: interaction.user.id
                    });
                }

                if (supervisorId && supervisorId !== hostId) {
                    await sumarCuotaStaff(guildId, supervisorId, {
                        sesionesSupervisadas: 1,
                        horas: Number((horasCalculadas * 0.25).toFixed(2)),
                        motivo: `Supervisión sesión ${tipo} — ${duracionMostrar}`,
                        executorId: interaction.user.id
                    });
                    console.log(`[cerrar_swfl] Cuota supervisor ${supervisorId}: +1 supervisada`);
                } else if (supervisorId && supervisorId === hostId) {
                    console.log(`[cerrar_swfl] Supervisor = host (${hostId}): no se suma supervisada (ya cuenta como host).`);
                } else {
                    console.log('[cerrar_swfl] Sin supervisorId en la sesión al cerrar.');
                }
            } else {
                await sumarCuotaStaff(guildId, hostId, {
                    sesionesOrganizadas: 1,
                    motivo: `Cierre de sesión ${tipo} (sin duración registrada)`,
                    executorId: interaction.user.id
                });

                if (coHostId && coHostId !== hostId) {
                    await sumarCuotaStaff(guildId, coHostId, {
                        sesionesOrganizadas: 1,
                        motivo: `Co-Host sesión ${tipo} (sin duración registrada)`,
                        executorId: interaction.user.id
                    });
                }

                if (supervisorId && supervisorId !== hostId) {
                    await sumarCuotaStaff(guildId, supervisorId, {
                        sesionesSupervisadas: 1,
                        motivo: `Supervisión sesión ${tipo} (sin duración registrada)`,
                        executorId: interaction.user.id
                    });
                    console.log(`[cerrar_swfl] Cuota supervisor ${supervisorId}: +1 supervisada (sin duración)`);
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
                    motivo: notasHost,
                    sinCuota: noSumarCuota
                }
            });
        } catch (dbError) {
            console.error('Error actualizando la base de datos en /cerrar_swfl:', dbError);
        }

        try {
            const cuatroHorasAtras = Date.now() - 4 * 60 * 60 * 1000;
            let lastId = undefined;
            for (let i = 0; i < 3; i++) {
                const mensajes = await interaction.channel.messages.fetch({
                    limit: 100,
                    ...(lastId ? { before: lastId } : {})
                });
                if (mensajes.size === 0) break;
                lastId = mensajes.last()?.id;
                const aEliminar = mensajes.filter(
                    msg => msg.createdTimestamp >= cuatroHorasAtras && !msg.pinned
                );
                if (aEliminar.size > 0) {
                    await interaction.channel.bulkDelete(aEliminar, true);
                }
                const oldest = mensajes.last();
                if (oldest && oldest.createdTimestamp < cuatroHorasAtras) break;
            }
        } catch (error) {
            console.error('Error al purgar mensajes en /cerrar_swfl:', error);
        }

        const titulo =
            tipo === 'rp'
                ? `<a:cadenacora:1534954014335172729> SWFL Roleplay | Sesión Concluida <a:cadenacora:1534954014335172729>`
                : `<a:cadenacora:1534954014335172729> SWFL Meet | Sesión Concluida <a:cadenacora:1534954014335172729>`;

        const inicioUnix = fechaInicio ? Math.floor(fechaInicio.getTime() / 1000) : null;
        const finUnix = Math.floor(fechaFin.getTime() / 1000);

        const lineasTiempo = [];
        if (inicioUnix) {
            lineasTiempo.push(`<:fle:1534937306191102125> **Hora de inicio:** <t:${inicioUnix}:t> (<t:${inicioUnix}:R>)`);
        } else {
            lineasTiempo.push(`<:fle:1534937306191102125> **Hora de inicio:** No registrada (sin \`/inicio_swfl\`)`);
        }
        lineasTiempo.push(`<:fle:1534937306191102125> **Hora de cierre:** <t:${finUnix}:t> (<t:${finUnix}:R>)`);
        lineasTiempo.push(`<:fle:1534937306191102125> **Duración total:** ${duracionMostrar}`);

        const embedCierre = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(
                `<:puntderecha:1534938142665084938> La sesión ha concluido oficialmente. ¡Muchísimas gracias a todos los que asistieron, respetaron las reglas y compartieron un buen rato con sus naves! <:vehiculos:1525172179279282326>\n\n` +
                    `<:fle:1534937306191102125> **Anfitrión:** <@${interaction.user.id}>\n` +
                    lineasTiempo.join('\n') +
                    `\n<:fle:1534937306191102125> **Notas:** ${notasHost}`
            )
            .setColor('#74d4fc');

        if (fotoAdjunta) embedCierre.setImage(fotoAdjunta.url);
        else embedCierre.setImage(URL_IMAGEN_DEFAULT);

        const filaComponentes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('abrir_feedback_swfl')
                .setLabel('Opinión de la Sesión')
                .setEmoji('1523041319046479964')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embedCierre], components: [filaComponentes] });
    }
};
