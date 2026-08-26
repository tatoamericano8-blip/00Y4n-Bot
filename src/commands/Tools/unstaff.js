import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Session from '../../../models/Session.js';
import { sumarCuotaStaff } from '../../utils/gestorCuotas.js';

function horasDesde(inicio, fin = new Date()) {
    if (!inicio) return 0;
    const ms = fin.getTime() - new Date(inicio).getTime();
    if (ms <= 0) return 0;
    return Number((ms / 3600000).toFixed(2));
}

function textoTiempo(horas) {
    if (!horas || horas <= 0) return 'menos de 1 min';
    const totalMin = Math.max(1, Math.round(horas * 60));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const partes = [];
    if (h > 0) partes.push(`${h}h`);
    if (m > 0 || h === 0) partes.push(`${m} min`);
    return partes.join(' ');
}

export default {
    data: new SlashCommandBuilder()
        .setName('finalizar_host')
        .setDescription('Anuncia que dejas de ser Host, Co-Host o Supervisor de la sesión actual.')
        .addStringOption(option =>
            option.setName('rol')
                .setDescription('Puesto que vas a dejar de ejercer en esta sesión.')
                .setRequired(true)
                .addChoices(
                    { name: 'Host', value: 'host' },
                    { name: 'Co-Host', value: 'cohost' },
                    { name: 'Supervisor', value: 'supervisor' }
                ))
        .addStringOption(option =>
            option.setName('notas')
                .setDescription('Observaciones o notas sobre la sesión (Opcional).')
                .setRequired(false)),

    async execute(interaction) {
        const ROL_STAFF = '1512120103771050005';
        if (!interaction.member.roles.cache.has(ROL_STAFF)) {
            return interaction.reply({
                content:
                    '<:cruz:1534937767652495360> Solo el **Staff 00Y4n** puede usar `/finalizar_host`.',
                ephemeral: true
            });
        }

        const rolSeleccionado = interaction.options.getString('rol');
        const notas = interaction.options.getString('notas') || 'Sin observaciones.';
        const uid = interaction.user.id;

        const datosRoles = {
            host: {
                titulo: '<a:si:1534954014335172729> Host Finalizado',
                etiqueta: 'Host',
                estado: 'Ha finalizado la gestión de la sesión.'
            },
            cohost: {
                titulo: '<a:si:1534954014335172729> Co-Host Finalizado',
                etiqueta: 'Co-Host',
                estado: 'Ha concluido su labor de apoyo en la sesión.'
            },
            supervisor: {
                titulo: '<a:si:1534954014335172729> Supervisión Finalizada',
                etiqueta: 'Supervisor',
                estado: 'Ha dejado de monitorear la sesión.'
            }
        };

        const config = datosRoles[rolSeleccionado];
        let tiempoTxt = null;

        try {
            const sesion = await Session.findOne({
                guildId: interaction.guildId,
                estado: { $in: ['esperando_reacciones', 'activa'] }
            }).sort({ fechaInicio: -1 });

            if (sesion) {
                const esHost = rolSeleccionado === 'host' && sesion.hostId === uid && sesion.hostActivo !== false;
                const esCohost = rolSeleccionado === 'cohost' && sesion.coHostId === uid;
                const esSup = rolSeleccionado === 'supervisor' && sesion.supervisorId === uid;

                if (esHost || esCohost || esSup) {
                    const desde = sesion.fechaLanzamiento || sesion.fechaInicio || new Date();
                    const horasParciales = horasDesde(desde, new Date());

                    if (horasParciales > 0) {
                        await sumarCuotaStaff(interaction.guildId, uid, {
                            horas: horasParciales,
                            motivo: `Finalizó ${rolSeleccionado} antes del cierre — ${textoTiempo(horasParciales)}`,
                            executorId: uid
                        });
                    }

                    if (!Array.isArray(sesion.cuotaParcialPagada)) sesion.cuotaParcialPagada = [];
                    sesion.cuotaParcialPagada.push({
                        userId: uid,
                        rol: rolSeleccionado,
                        horas: horasParciales,
                        hasta: new Date()
                    });

                    if (esHost) sesion.hostActivo = false;
                    else if (esCohost) sesion.coHostId = null;
                    else if (esSup) sesion.supervisorId = null;

                    await sesion.save();
                    tiempoTxt = textoTiempo(horasParciales);
                }
            }
        } catch (e) {
            console.error('[finalizar_host] Error:', e?.message || e);
        }

        let descExtra = '';
        if (tiempoTxt) {
            descExtra =
                `\n\n<:fle:1534937306191102125> **Tiempo acreditado (parcial):** ${tiempoTxt}\n` +
                `_Solo horas/minutos — no cuenta como sesión completa._`;
        }

        const embedUnstaff = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle(config.titulo)
            .setDescription(
                `**${config.etiqueta}:** <@${uid}> (\`${interaction.user.username}\`)\n` +
                `**Estado:** ${config.estado}\n\n` +
                `<:notas:1534938422202994755> **Notas / Observaciones:**\n${notas}` +
                descExtra
            )
            .setFooter({ text: '00Y4n Comunidad SWFL • Control de Sesiones', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embedUnstaff] });
    },
};
