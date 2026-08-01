import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import Staff from '../../../models/Staff.js';
import StaffLog from '../../../models/StaffLog.js';
import { getFromDb } from '../../utils/database.js';
import { obtenerRangoDeUsuario } from '../../utils/rangoStaff.js';

const ROLE_HIGH_COMMAND = '1528870731629465752';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-database')
        .setDescription('Historial auditable de sanciones, contrataciones, cuotas y tickets del personal.')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Staff a consultar.').setRequired(true)
        ),

    async execute(interaction) {
        if (
            !interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) &&
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
        ) {
            return interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> Solo Alto Comando tiene acceso a la Base de Datos auditable.',
                flags: MessageFlags.Ephemeral
            });
        }

        const targetUser = interaction.options.getUser('usuario');
        await interaction.deferReply();

        const staffData = await Staff.findOne({
            guildId: interaction.guildId,
            userId: targetUser.id
        });

        if (!staffData) {
            return interaction.editReply({
                content: `<:cruz00y4n:1523041302764191844> No hay historial auditable para <@${targetUser.id}>.`
            });
        }

        const { rango } = await obtenerRangoDeUsuario(
            interaction.guild,
            targetUser.id,
            staffData.rango || 'Sin rango'
        );

        const listaStrikes =
            staffData.strikes
                ?.map(s => {
                    const estado = s.activo ? '🔴 ACTIVO' : '🟢 REMOVIDO';
                    return `• \`${s.idStrike}\` [${estado}]: ${s.motivo} (Por: <@${s.aplicadoPor}>)`;
                })
                .join('\n') || 'Sin sanciones en el historial.';

        let loaTexto = 'Sin ausencias registradas.';
        if (staffData.loa?.historial?.length) {
            loaTexto = staffData.loa.historial
                .slice(-5)
                .reverse()
                .map(l => {
                    const ini = l.inicio ? `<t:${Math.floor(new Date(l.inicio).getTime() / 1000)}:d>` : '?';
                    const fin = l.fin ? `<t:${Math.floor(new Date(l.fin).getTime() / 1000)}:d>` : '?';
                    return `• ${ini} → ${fin}: ${l.motivo || 'Sin motivo'}`;
                })
                .join('\n');
            if (staffData.loa.activo) loaTexto = `🟡 **LOA ACTIVA**\n` + loaTexto;
        } else if (staffData.loa?.activo) {
            loaTexto = '🟡 **LOA ACTIVA** (sin historial detallado)';
        }

        let salidaTexto = 'Sin registro de salida.';
        if (staffData.estado === 'DESPEDIDO' && staffData.despido) {
            const f = staffData.despido.fecha
                ? `<t:${Math.floor(new Date(staffData.despido.fecha).getTime() / 1000)}:F>`
                : '—';
            salidaTexto =
                `🔴 **DESTITUIDO**\n` +
                `• Fecha: ${f}\n` +
                `• Motivo: ${staffData.despido.motivo || '—'}\n` +
                `• Por: <@${staffData.despido.realizadoPor}>\n` +
                `• Blacklist: ${staffData.despido.blacklist ? '🚨 SÍ' : 'No'}`;
        } else if (staffData.estado === 'RENUNCIADO' && staffData.renuncia) {
            const f = staffData.renuncia.fecha
                ? `<t:${Math.floor(new Date(staffData.renuncia.fecha).getTime() / 1000)}:F>`
                : '—';
            salidaTexto =
                `⚪ **RENUNCIÓ**\n` +
                `• Fecha: ${f}\n` +
                `• Motivo: ${staffData.renuncia.motivo || '—'}`;
        }

        let blacklistExtra = '';
        try {
            const bl = await getFromDb(`staff:blacklist:${interaction.guildId}`, []);
            if (Array.isArray(bl) && bl.some(e => e.userId === targetUser.id)) {
                blacklistExtra = '\n🚨 **Está en la blacklist de Staff**';
            }
        } catch {}

        let logsTexto = 'Sin logs recientes.';
        try {
            const logs = await StaffLog.find({
                guildId: interaction.guildId,
                targetUserId: targetUser.id
            })
                .sort({ fecha: -1 })
                .limit(8);

            if (logs.length) {
                logsTexto = logs
                    .map(l => {
                        const f = l.fecha
                            ? `<t:${Math.floor(new Date(l.fecha).getTime() / 1000)}:d>`
                            : '—';
                        return `• **${l.tipo}** (${f}) — por <@${l.executorId}>`;
                    })
                    .join('\n');
            }
        } catch {}

        const cuotas = staffData.cuotas || {};
        const hist = staffData.estadisticasHistoricas || {};

        const embed = new EmbedBuilder()
            .setTitle(`🗄️ Expediente Auditable – ${targetUser.username}`)
            .setColor('#74d4fc')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `> **ID:** \`${staffData.userId}\`\n` +
                    `> **Rango:** \`${rango}\`\n` +
                    `> **Estado:** \`${staffData.estado}\`${blacklistExtra}\n` +
                    `> **Ingreso:** ${
                        staffData.ingreso
                            ? `<t:${Math.floor(new Date(staffData.ingreso).getTime() / 1000)}:R>`
                            : '—'
                    }`
            )
            .addFields(
                {
                    name: '📊 Cuota semanal',
                    value:
                        `• Horas: \`${cuotas.horasServicio || 0}/${cuotas.horasMeta || 3}\`\n` +
                        `• Sesiones host: \`${cuotas.sesionesOrganizadas || 0}/${cuotas.sesionesMeta || 2}\`\n` +
                        `• Supervisadas: \`${cuotas.sesionesSupervisadas || 0}\`\n` +
                        `• Tickets cerrados: \`${cuotas.ticketsCerrados || 0}\``,
                    inline: true
                },
                {
                    name: '📈 Histórico total',
                    value:
                        `• Horas: \`${hist.horasTotales || 0}h\`\n` +
                        `• Sesiones host: \`${hist.sesionesHosteadasTotales || 0}\`\n` +
                        `• Supervisadas: \`${hist.sesionesSupervisadasTotales || 0}\`\n` +
                        `• Tickets: \`${hist.ticketsCerradosTotales || 0}\``,
                    inline: true
                },
                {
                    name: '⚠️ Strikes',
                    value: listaStrikes.length > 1024 ? listaStrikes.slice(0, 1000) + '...' : listaStrikes
                },
                {
                    name: '📋 Ausencias (LOA)',
                    value: loaTexto.length > 1024 ? loaTexto.slice(0, 1000) + '...' : loaTexto
                },
                {
                    name: '🚪 Salida del equipo',
                    value: salidaTexto
                },
                {
                    name: '📜 Últimos logs',
                    value: logsTexto.length > 1024 ? logsTexto.slice(0, 1000) + '...' : logsTexto
                }
            )
            .setFooter({
                text: '00Y4n Comunidad SWFL • Auditoría de Staff',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
