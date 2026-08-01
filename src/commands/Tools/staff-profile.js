import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import Staff from '../../../models/Staff.js';
import { obtenerRangoDeUsuario } from '../../utils/rangoStaff.js';

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

        const strikesActivos = staffData.strikes
            ? staffData.strikes.filter(s => s.activo).length
            : 0;
        const totalPremios = staffData.premios ? staffData.premios.length : 0;
        const c = staffData.cuotas || {};
        const h = staffData.estadisticasHistoricas || {};

        const embedProfile = new EmbedBuilder()
            .setTitle(`👤 Perfil de Staff – ${targetUser.username}`)
            .setColor('#74d4fc')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '📌 Información General',
                    value:
                        `> **Rango:** \`${rango}\`\n` +
                        `> **Estado:** \`${staffData.estado || 'Activo'}\`\n` +
                        `> **Strikes Activos:** \`${strikesActivos}/3\``,
                    inline: false
                },
                {
                    name: '📊 Cuota Semanal Actual',
                    value:
                        `> **Sesiones Hosteadas:** \`${c.sesionesOrganizadas || 0} / ${c.sesionesMeta || 2}\`\n` +
                        `> **Horas de Servicio:** \`${c.horasServicio || 0}h / ${c.horasMeta || 3}h\`\n` +
                        `> **Supervisadas:** \`${c.sesionesSupervisadas || 0}\`\n` +
                        `> **Tickets cerrados:** \`${c.ticketsCerrados || 0}\``,
                    inline: true
                },
                {
                    name: '📈 Acumulado Histórico',
                    value:
                        `> **Sesiones Totales:** \`${h.sesionesHosteadasTotales || 0}\`\n` +
                        `> **Horas Totales:** \`${h.horasTotales || 0}h\`\n` +
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
                }`
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embedProfile] });
    }
};
