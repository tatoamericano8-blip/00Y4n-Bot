import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Staff from '../../../models/Staff.js';

export default {
  data: new SlashCommandBuilder()
    .setName('staff-clasificacion')
    .setDescription('Muestra la tabla de clasificación de rendimiento del Staff.')
    .addStringOption(option =>
      option
        .setName('criterio')
        .setDescription('Criterio de ordenamiento')
        .setRequired(false)
        .addChoices(
          { name: '🚗 Sesiones Organizadas (Semanal)', value: 'sesiones_semana' },
          { name: '⏱️ Horas de Servicio (Semanal)', value: 'horas_semana' },
          { name: '🏆 Sesiones Totales (Histórico)', value: 'sesiones_total' },
          { name: '⏳ Horas Totales (Histórico)', value: 'horas_total' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const criterio = interaction.options.getString('criterio') || 'sesiones_semana';
    const guildId = interaction.guild.id;

    // Obtener todos los staff activos o en LOA del servidor
    const listaStaff = await Staff.find({ 
      guildId, 
      estado: { $nin: ['DESPEDIDO', 'RENUNCIADO'] } 
    });

    if (!listaStaff || listaStaff.length === 0) {
      return await interaction.editReply({
        content: '<:warn00y4n:1523041352714158240> No hay miembros del Staff registrados en la base de datos de este servidor.'
      });
    }

    // Lógica de ordenamiento según el criterio seleccionado
    listaStaff.sort((a, b) => {
      switch (criterio) {
        case 'horas_semana':
          return (b.cuotas?.horasServicio || 0) - (a.cuotas?.horasServicio || 0);
        case 'sesiones_total':
          return (b.estadisticasHistoricas?.sesionesHosteadasTotales || 0) - (a.estadisticasHistoricas?.sesionesHosteadasTotales || 0);
        case 'horas_total':
          return (b.estadisticasHistoricas?.horasTotales || 0) - (a.estadisticasHistoricas?.horasTotales || 0);
        case 'sesiones_semana':
        default:
          return (b.cuotas?.sesionesOrganizadas || 0) - (a.cuotas?.sesionesOrganizadas || 0);
      }
    });

    // Tomar el Top 10
    const top10 = listaStaff.slice(0, 10);

    const medallas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    const lineasRanking = await Promise.all(
      top10.map(async (staff, index) => {
        const medalla = medallas[index] || `**${index + 1}.**`;
        let valorMostrar = '';

        switch (criterio) {
          case 'horas_semana':
            valorMostrar = `**${staff.cuotas?.horasServicio || 0}h** trabajadas esta semana`;
            break;
          case 'sesiones_total':
            valorMostrar = `**${staff.estadisticasHistoricas?.sesionesHosteadasTotales || 0}** sesiones en total`;
            break;
          case 'horas_total':
            valorMostrar = `**${staff.estadisticasHistoricas?.horasTotales || 0}h** en total`;
            break;
          case 'sesiones_semana':
          default:
            valorMostrar = `**${staff.cuotas?.sesionesOrganizadas || 0}** sesiones esta semana`;
            break;
        }

        return `${medalla} <@${staff.userId}> — ${valorMostrar} *(${staff.rango})*`;
      })
    );

    let tituloCriterio = 'Sesiones Organizadas (Semana)';
    if (criterio === 'horas_semana') tituloCriterio = 'Horas de Servicio (Semana)';
    if (criterio === 'sesiones_total') tituloCriterio = 'Sesiones Totales (Histórico)';
    if (criterio === 'horas_total') tituloCriterio = 'Horas Totales (Histórico)';

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Tabla de Clasificación de Staff — ${tituloCriterio}`)
      .setColor(0xF1C40F)
      .setDescription(lineasRanking.join('\n\n'))
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }
};
