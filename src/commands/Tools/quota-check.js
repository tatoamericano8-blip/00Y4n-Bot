import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Staff from '../../../models/Staff.js';
import { obtenerRangoDeUsuario } from '../../utils/rangoStaff.js';
import { formatearHoras, formatearHorasProgreso } from '../../utils/formatearTiempo.js';

function crearBarraProgreso(actual, meta, tamaño = 10) {
  if (meta <= 0) meta = 1;
  const porcentaje = Math.min(Math.max(actual / meta, 0), 1);
  const rellenado = Math.round(tamaño * porcentaje);
  const vacio = tamaño - rellenado;
  const barra = '🟩'.repeat(rellenado) + '⬛'.repeat(vacio);
  const porcentajeTexto = Math.floor(porcentaje * 100);
  return `${barra} **${porcentajeTexto}%** (${formatearHorasProgreso(actual, meta)})`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('chequear-cuota')
    .setDescription('Consulta el progreso de la cuota semanal del Staff.')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('El miembro del Staff a consultar (por defecto tú).')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const usuarioObjetivo = interaction.options.getUser('usuario') || interaction.user;
    const guildId = interaction.guild.id;

    const staffData = await Staff.findOne({ guildId, userId: usuarioObjetivo.id });

    if (!staffData) {
      return await interaction.editReply({
        content: `<:cruz00y4n:1523041302764191844> El usuario **${usuarioObjetivo.tag}** no está registrado en el sistema de Staff.`
      });
    }

    const { cuotas, estadisticasHistoricas, estado, loa } = staffData;

    const { rango } = await obtenerRangoDeUsuario(
      interaction.guild,
      usuarioObjetivo.id,
      staffData.rango || 'Sin rango'
    );

    let estadoTexto = '🟢 **Activo**';
    if (estado === 'LOA' || loa?.activo) estadoTexto = '🟡 **En Permiso (LOA)**';
    else if (estado === 'DESPEDIDO') estadoTexto = '🔴 **Despedido**';
    else if (estado === 'RENUNCIADO') estadoTexto = '⚪ **Renunciado**';

    const horasSemana = cuotas.horasServicio || 0;
    const horasMeta = cuotas.horasMeta || 3;
    const barraHoras = crearBarraProgreso(horasSemana, horasMeta);
    const barraSesiones = crearBarraProgreso(cuotas.sesionesOrganizadas || 0, cuotas.sesionesMeta || 2);

    const embed = new EmbedBuilder()
      .setTitle(`📊 Registro de Cuota — ${usuarioObjetivo.username}`)
      .setThumbnail(usuarioObjetivo.displayAvatarURL({ dynamic: true }))
      .setColor(estado === 'LOA' || loa?.activo ? 0xf1c40f : 0x74d4fc)
      .addFields(
        {
          name: '👤 Información de Staff',
          value: `> **Rango:** ${rango}\n> **Estado:** ${estadoTexto}`,
          inline: false
        },
        {
          name: '⏱️ Horas de Servicio Semanales',
          value: `${barraHoras}`,
          inline: false
        },
        {
          name: '🚗 Sesiones Organizadas',
          value: `${barraSesiones}`,
          inline: false
        },
        {
          name: '👁️ Sesiones Supervisadas',
          value: `> **${cuotas.sesionesSupervisadas || 0}** sesión(es)`,
          inline: true
        },
        {
          name: '🎫 Tickets Cerrados (semana)',
          value: `> **${cuotas.ticketsCerrados || 0}** ticket(s)`,
          inline: true
        },
        {
          name: '📈 Histórico Total Acumulado',
          value:
            `> ⏱️ **Horas Totales:** ${formatearHoras(estadisticasHistoricas?.horasTotales || 0)}\n` +
            `> 🚗 **Sesiones Organizadas:** ${estadisticasHistoricas?.sesionesHosteadasTotales || 0}\n` +
            `> 👁️ **Sesiones Supervisadas:** ${estadisticasHistoricas?.sesionesSupervisadasTotales || 0}\n` +
            `> 🎫 **Tickets Cerrados:** ${estadisticasHistoricas?.ticketsCerradosTotales || 0}`,
          inline: false
        }
      )
      .setFooter({
        text: `Solicitado por ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }
};
