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

export default {
    data: {
        name: 'cerrar_swfl',
        description: 'Cierra oficialmente la sesión de SWFL, elimina avisos de las últimas 2hs y muestra el resumen.',
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
                description: '¿Cuánto tiempo duró la sesión? (Ej: 1 hora y 15 minutos)',
                type: ApplicationCommandOptionType.String,
                required: true
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
            'https://cdn.discordapp.com/attachments/1517331229303902432/1524843452494381146/Sesion_Concluida_NUEVO2_1.png?ex=6a51e161&is=6a508fe1&hm=3393d2fe56fe1b5bacafa4f3f227096598fa915b8c1976c7994e49c4ca5c2760&';

        const tipo = interaction.options.getString('tipo');
        const duracion = interaction.options.getString('duracion');
        const notasHost = interaction.options.getString('notas') || 'Sin notas adicionales.';
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        await interaction.reply({
            content: 'Cerrando la sesión, limpiando el canal y actualizando base de datos...',
            ephemeral: true
        });

        const horasCalculadas = parsearDuracionAHoras(duracion);
        const minutosCalculados = Math.round(horasCalculadas * 60);
        const guildId = interaction.guild.id;

        let sesionActiva = null;

        try {
            // Buscar sesión activa o en espera (la más reciente)
            sesionActiva = await Session.findOneAndUpdate(
                {
                    guildId,
                    estado: { $in: ['activa', 'esperando_reacciones'] }
                },
                {
                    estado: 'cerrada',
                    fechaCierre: new Date(),
                    duracionMinutos: minutosCalculados
                },
                { sort: { fechaInicio: -1 }, new: true }
            );

            // Host que cierra (quien ejecuta el comando) o el host registrado en la sesión
            const hostId = sesionActiva?.hostId || interaction.user.id;
            const supervisorId = sesionActiva?.supervisorId || null;
            const coHostId = sesionActiva?.coHostId || null;

            // Auto-cuota HOST
            await sumarCuotaStaff(guildId, hostId, {
                horas: horasCalculadas,
                sesionesOrganizadas: 1,
                motivo: `Cierre de sesión ${tipo} — ${duracion}`,
                executorId: interaction.user.id
            });

            // Auto-cuota CO-HOST (media sesión si es distinto del host)
            if (coHostId && coHostId !== hostId) {
                await sumarCuotaStaff(guildId, coHostId, {
                    horas: Number((horasCalculadas * 0.5).toFixed(2)),
                    sesionesOrganizadas: 1,
                    motivo: `Co-Host sesión ${tipo} — ${duracion}`,
                    executorId: interaction.user.id
                });
            }

            // Auto-cuota SUPERVISOR
            if (supervisorId && supervisorId !== hostId) {
                await sumarCuotaStaff(guildId, supervisorId, {
                    sesionesSupervisadas: 1,
                    horas: Number((horasCalculadas * 0.25).toFixed(2)),
                    motivo: `Supervisión sesión ${tipo} — ${duracion}`,
                    executorId: interaction.user.id
                });
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
                    duracionTexto: duracion,
                    duracionMinutos: minutosCalculados,
                    horasSumadas: horasCalculadas,
                    supervisorId,
                    coHostId,
                    motivo: notasHost
                }
            });
        } catch (dbError) {
            console.error('Error actualizando la base de datos en /cerrar_swfl:', dbError);
        }

        // Limpieza de mensajes (últimas 2 horas)
        try {
            const dosHorasAtras = Date.now() - 2 * 60 * 60 * 1000;
            const mensajes = await interaction.channel.messages.fetch({ limit: 100 });
            const mensajesAEliminar = mensajes.filter(
                msg => msg.createdTimestamp >= dosHorasAtras && !msg.pinned
            );
            if (mensajesAEliminar.size > 0) {
                await interaction.channel.bulkDelete(mensajesAEliminar, true);
            }
        } catch (error) {
            console.error('Error al purgar mensajes en /cerrar_swfl:', error);
        }

        const titulo =
            tipo === 'rp'
                ? `<a:cadenacora:1523026520740724859> SWFL Roleplay | Sesión Concluida <a:cadenacora:1523026520740724859>`
                : `<a:cadenacora:1523026520740724859> SWFL Meet | Sesión Concluida <a:cadenacora:1523026520740724859>`;

        const embedCierre = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(
                `<:puntderecha:1523027978123087922> La sesión ha concluido oficialmente. ¡Muchísimas gracias a todos los que asistieron, respetaron las reglas y compartieron un buen rato con sus naves! <:vehiculos:1525172179279282326>\n\n` +
                    `<:fle:1523041359441952970> **Anfitrión:** <@${interaction.user.id}>\n` +
                    `<:fle:1523041359441952970> **Duración Total:** ${duracion}\n` +
                    `<:fle:1523041359441952970> **Notas:** ${notasHost}`
            )
            .setColor('#74d4fc');

        if (fotoAdjunta) embedCierre.setImage(fotoAdjunta.url);
        else embedCierre.setImage(URL_IMAGEN_DEFAULT);

        const filaComponentes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('abrir_feedback_swfl')
                .setLabel('Opinión de la Sesión')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embedCierre], components: [filaComponentes] });
    }
};
