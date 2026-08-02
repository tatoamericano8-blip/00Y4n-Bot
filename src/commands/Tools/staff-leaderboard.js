import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Staff from '../../../models/Staff.js';
import { obtenerRangoDeUsuario } from '../../utils/rangoStaff.js';
import { formatearHoras } from '../../utils/formatearTiempo.js';
import { sesionesSemana } from '../../utils/metasCuota.js';
import { calcularScore, textoScore } from '../../utils/scoreCuota.js';

export default {
  data: new SlashCommandBuilder()
    .setName('staff-clasificacion')
    .setDescription('Tabla de clasificación de rendimiento del Staff.')
    .addStringOption(option =>
      option
        .setName('criterio')
        .setDescription('Criterio de ordenamiento')
        .setRequired(false)
        .addChoices(
          { name: '⭐ Score de rendimiento (Semana)', value: 'score' },
          { name: '🚗 Sesiones totales semana (host+sup)', value: 'sesiones_semana' },
          { name: '🎮 Sesiones hosteadas (Semana)', value: 'host_semana' },
          { name: '🎫 Tickets (Semana)', value: 'tickets_semana' },
          { name: '⏱️ Tiempo de servicio (Semana)', value: 'horas_semana' },
          { name: '🔥 Racha de cumplimiento', value: 'racha' },
          { name: '🏆 Sesiones hosteadas (Histórico)', value: 'sesiones_total' },
          { name: '⏳ Horas totales (Histórico)', value: 'horas_total' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const criterio = interaction.options.getString('criterio') || 'score';
    const guildId = interaction.guild.id;

    const listaStaff = await Staff.find({
      guildId,
      estado: { $nin: ['DESPEDIDO', 'RENUNCIADO'] }
    });

    if (!listaStaff || listaStaff.length === 0) {
      return await interaction.editReply({
        content:
          '<:warn00y4n:1523041352714158240> No hay miembros del Staff registrados en este servidor.'
      });
    }

    // Enriquecer con rango real de Discord + score
    const enriquecidos = await Promise.all(
      listaStaff.map(async staff => {
        const { rango } = await obtenerRangoDeUsuario(
          interaction.guild,
          staff.userId,
          staff.rango || 'Sin rango'
        );
        const cuotas = staff.cuotas || {};
        const hist = staff.estadisticasHistoricas || {};
        const score = calcularScore(cuotas, rango);
        const ses = sesionesSemana(cuotas);
        const enLoa = staff.estado === 'LOA' || staff.loa?.activo === true;

        return {
          userId: staff.userId,
          rango,
          enLoa,
          score,
          ses,
          host: Number(cuotas.sesionesOrganizadas) || 0,
          sup: Number(cuotas.sesionesSupervisadas) || 0,
          tickets: Number(cuotas.ticketsCerrados) || 0,
          horas: Number(cuotas.horasServicio) || 0,
          hostTotal: Number(hist.sesionesHosteadasTotales) || 0,
          horasTotal: Number(hist.horasTotales) || 0,
          racha: Number(staff.rachaActual) || 0,
          rachaMax: Number(staff.rachaMaxima) || 0
        };
      })
    );

    enriquecidos.sort((a, b) => {
      switch (criterio) {
        case 'horas_semana':
          return b.horas - a.horas;
        case 'host_semana':
          return b.host - a.host;
        case 'tickets_semana':
          return b.tickets - a.tickets;
        case 'sesiones_total':
          return b.hostTotal - a.hostTotal;
        case 'horas_total':
          return b.horasTotal - a.horasTotal;
        case 'racha':
          return b.racha - a.racha || b.rachaMax - a.rachaMax;
        case 'sesiones_semana':
          return b.ses - a.ses;
        case 'score':
        default:
          return b.score - a.score;
      }
    });

    const top10 = enriquecidos.slice(0, 10);
    const medallas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    const lineas = top10.map((s, index) => {
      const medalla = medallas[index] || `**${index + 1}.**`;
      const loaTag = s.enLoa ? ' · 🟡 LOA' : '';
      let detalle = '';

      switch (criterio) {
        case 'horas_semana':
          detalle = `**${formatearHoras(s.horas)}** esta semana · score ${textoScore(s.score)}`;
          break;
        case 'host_semana':
          detalle = `**${s.host}** host · ${s.sup} sup · score ${textoScore(s.score)}`;
          break;
        case 'tickets_semana':
          detalle = `**${s.tickets}** ticket(s) · ${s.ses} ses · score ${textoScore(s.score)}`;
          break;
        case 'sesiones_total':
          detalle = `**${s.hostTotal}** host históricas · racha ${s.racha}`;
          break;
        case 'horas_total':
          detalle = `**${formatearHoras(s.horasTotal)}** totales · racha ${s.racha}`;
          break;
        case 'racha':
          detalle = `🔥 **${s.racha}** semanas · máx **${s.rachaMax}** · score ${textoScore(s.score)}`;
          break;
        case 'sesiones_semana':
          detalle = `**${s.ses}** ses (${s.host}H/${s.sup}S) · ${s.tickets} tkt · ${formatearHoras(s.horas)}`;
          break;
        case 'score':
        default:
          detalle =
            `score **${textoScore(s.score)}** · ${s.ses} ses · ${s.tickets} tkt · ${formatearHoras(s.horas)}` +
            (s.racha > 0 ? ` · 🔥${s.racha}` : '');
          break;
      }

      return `${medalla} <@${s.userId}> — ${detalle}\n  ​**${s.rango}**${loaTag}`;
    });

    const titulos = {
      score: 'Score de Rendimiento (Semana)',
      sesiones_semana: 'Sesiones Totales (Semana)',
      host_semana: 'Sesiones Hosteadas (Semana)',
      tickets_semana: 'Tickets (Semana)',
      horas_semana: 'Tiempo de Servicio (Semana)',
      racha: 'Racha de Cumplimiento',
      sesiones_total: 'Sesiones Hosteadas (Histórico)',
      horas_total: 'Horas Totales (Histórico)'
    };

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Tabla de Clasificación — ${titulos[criterio] || 'Rendimiento'}`)
      .setColor('#74d4fc')
      .setDescription(lineas.join('\n\n') || 'Sin datos.')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({
        text: `Solicitado por ${interaction.user.tag} • Rango = rol más alto de Staff`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }
};
