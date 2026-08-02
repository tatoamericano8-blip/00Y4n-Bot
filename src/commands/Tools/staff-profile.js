import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import Staff from '../../../models/Staff.js';
import { obtenerRangoDeUsuario } from '../../utils/rangoStaff.js';
import { formatearHoras } from '../../utils/formatearTiempo.js';
import { obtenerMetasPorRango, sesionesSemana } from '../../utils/metasCuota.js';

/** Estado unificado: prioriza loa.activo para no desincronizar con chequear-cuota / staff-database */
function textoEstado(staffData) {
    const est = staffData.estado || 'ACTIVO';
    const enLoa = est === 'LOA' || staffData.loa?.activo === true;

    if (est === 'DESPEDIDO') return '🔴 DESPEDIDO';
    if (est === 'RENUNCIADO') return '⚪ RENUNCIADO';
    if (enLoa) return '🟡 LOA';
    return '🟢 ACTIVO';
}

export default {
    data: new SlashCommandBuilder()
        .setName('staff-perfil')
        .setDescription('Muestra las estadísticas históricas y semanales de un integrante del personal.')
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Staff a consultar.').setRequired(false)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario') || interaction.user;

        const staffData = await Staff.findOne({
            guildId: interaction.guildId,
            userId: targetUser.id
        });

        if (!staffData) {
            return interaction.reply({
                content: `<:cruz00y4n:1523041302764191844> <@${targetUser.id}> no posee registro en la base de datos del Staff.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const { rango } = await obtenerRangoDeUsuario(
            interaction.guild,
            targetUser.id,
            staffData.rango || 'Sin rango'
        );

        const metas = obtenerMetasPorRango(rango);
        const sesActual = sesionesSemana(staffData.cuotas || {});
        const strikesActivos = staffData.strikes
            ? staffData.strikes.filter(s => s.activo).length
            : 0;
        const totalPremios = staffData.premios ? staffData.premios.length : 0;
        const c = staffData.cuotas || {};
        const h = staffData.estadisticasHistoricas || {};

        const metaSesTxt =
            metas.sesionesMeta > 0 ? `${sesActual} / ${metas.sesionesMeta}` : `${sesActual} (sin meta)`;
        const metaTktTxt =
            metas.ticketsMeta > 0
                ? `${c.ticketsCerrados || 0} / ${metas.ticketsMeta}`
                : `${c.ticketsCerrados || 0} (sin meta)`;

        const embedProfile = new EmbedBuilder()
            .setTitle(`👤 Perfil de Staff – ${targetUser.username}`)
            .setColor('#74d4fc')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '📌 Información General',
                    value:
                        `> **Rango:** \`${rango}\`\n` +
                        `> **Estado:** ${textoEstado(staffData)}\n` +
                        `> **Strikes Activos:** \`${strikesActivos}/3\``,
                    inline: false
                },
                {
                    name: '📊 Cuota Semanal Actual',
                    value:
                        `> **Sesiones (host+sup):** \`${metaSesTxt}\`\n` +
                        `> **Tickets cerrados:** \`${metaTktTxt}\`\n` +
                        `> **Tiempo de servicio:** \`${formatearHoras(c.horasServicio || 0)}\`\n` +
                        `> Hosteadas: \`${c.sesionesOrganizadas || 0}\` · Supervisadas: \`${c.sesionesSupervisadas || 0}\``,
                    inline: true
                },
                {
                    name: '📈 Acumulado Histórico',
                    value:
                        `> **Sesiones Totales:** \`${h.sesionesHosteadasTotales || 0}\`\n` +
                        `> **Horas Totales:** \`${formatearHoras(h.horasTotales || 0)}\`\n` +
                        `> **Supervisadas:** \`${h.sesionesSupervisadasTotales || 0}\`\n` +
                        `> **Tickets totales:** \`${h.ticketsCerradosTotales || 0}\``,
                    inline: true
                },
                {
                    name: '🏆 Galardones',
                    value: `> Posee \`${totalPremios}\` premios/reconocimientos registrados.`,
                    inline: false
                }
            )
            .setFooter({
                text: `Ingreso: ${
                    staffData.ingreso
                        ? new Date(staffData.ingreso).toLocaleDateString('es-AR')
                        : 'Sin fecha'
                } • Meta: ${metas.etiqueta}`
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embedProfile] });
    }
};
