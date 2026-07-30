import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Staff from '../../../models/Staff.js';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-perfil')
        .setDescription('Muestra las estadísticas históricas y semanales de un integrante del personal.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Staff a consultar.').setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        
        let staffData = await Staff.findOne({ guildId: interaction.guildId, userId: targetUser.id });

        if (!staffData) {
            return await interaction.reply({
                content: `<:cruz00y4n:1523041302764191844> <@${targetUser.id}> no posee registro en la base de datos del Staff.`,
                ephemeral: true
            });
        }

        const strikesActivos = staffData.strikes.filter(s => s.activo).length;
        const totalPremios = staffData.premios.length;

        const embedProfile = new EmbedBuilder()
            .setTitle(`👤 Perfil de Staff – ${targetUser.username}`)
            .setColor('#74d4fc')
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '📌 Informacion General', value: `> **Rango:** \`${staffData.rango}\`\n> **Estado:** \`${staffData.estado}\`\n> **Strikes Activos:** \`${strikesActivos}/3\``, inline: false },
                { name: '📊 Cuota Semanal Actual', value: `> **Sesiones Hosteadas:** \`${staffData.cuotas.sesionesOrganizadas} / ${staffData.cuotas.sesionesMeta}\`\n> **Horas de Servicio:** \`${staffData.cuotas.horasServicio}h / ${staffData.cuotas.horasMeta}h\``, inline: true },
                { name: '📈 Acumulado Histórico', value: `> **Sesiones Totales:** \`${staffData.estadisticasHistoricas.sesionesHosteadasTotales}\`\n> **Horas Totales:** \`${staffData.estadisticasHistoricas.horasTotales}h\``, inline: true },
                { name: '🏆 Galardones', value: `> Possē \`${totalPremios}\` premios/reconocimientos registrados.`, inline: false }
            )
            .setFooter({ text: `Ingreso: ${staffData.ingreso ? staffData.ingreso.toLocaleDateString('es-AR') : 'Sin fecha'}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embedProfile] });
    }
};
