import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Staff from '../../../models/Staff.js';
import { obtenerRangoDeUsuario } from '../../utils/rangoStaff.js';
import { formatearHoras } from '../../utils/formatearTiempo.js';
import { obtenerMetasPorRango, sesionesSemana } from '../../utils/metasCuota.js';
import { calcularScore, evaluarCumplimiento, textoScore } from '../../utils/scoreCuota.js';

function crearBarraProgreso(actual, meta, tamaño = 10) {
  if (!meta || meta <= 0) {
    return `🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 **OK** (${actual}/— sin meta)`;
  }
  const porcentaje = Math.min(Math.max(actual / meta, 0), 1);
  const rellenado = Math.round(tamaño * porcentaje);
  const vacio = tamaño - rellenado;
  const barra = '🟩'.repeat(rellenado) + '⬛'.repeat(vacio);
  const porcentajeTexto = Math.floor(porcentaje * 100);
  return `${barra} **${porcentajeTexto}%** (${actual}/${meta})`;
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
    const ROL_STAFF = '1512120103771050005';
    if (!interaction.member.roles.cache.has(ROL_STAFF)) {
      return interaction.reply({
        content:
          '<:cruz:1534937767652495360> Solo el **Staff 00Y4n** puede usar `/chequear-cuota`.',
        ephemeral: true
      });
    }

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

    const metas = obtenerMetasPorRango(rango);
    const sesActual = sesionesSemana(cuotas);
    const ticketsActual = cuotas.ticketsCerrados || 0;
    const score = calcularScore(cuotas || {}, rango);
    const evalC = evaluarCumplimiento(staffData, rango);
    const racha = Number(staffData.rachaActual) || 0;
    const rachaMax = Number(staffData.rachaMaxima) || 0;

    let estadoTexto = '🟢 **Activo**';
    if (estado === 'LOA' || loa?.activo) estadoTexto = '🟡 **En Permiso (LOA)**';
    else if (estado === 'DESPEDIDO') estadoTexto = '🔴 **Despedido**';
    else if (estado === 'RENUNCIADO') estadoTexto = '⚪ **Renunciado**';

    let estadoMeta = '❌ **Meta pendiente**';
    if (evalC.enLoa) estadoMeta = '🟡 **Exento (LOA — no cuenta como fallo)**';
    else if (evalC.cumplio) estadoMeta = '✅ **Meta cumplida**';

    const barraSesiones = crearBarraProgreso(sesActual, metas.sesionesMeta);
    const barraTickets = crearBarraProgreso(ticketsActual, metas.ticketsMeta);

    const detalleMeta =
      metas.sesionesMeta > 0
        ? `> Meta de **${metas.etiqueta}**: **${metas.sesionesMeta}** sesiones` +
          (metas.ticketsMeta > 0
            ? ` + **${metas.ticketsMeta}** ticket(s)`
            : '') +
          '.'
        : `> **${metas.etiqueta}**: sin cuota mínima obligatoria de rango.`;

    const embed = new EmbedBuilder()
      .setTitle(`📊 Registro de Cuota — ${usuarioObjetivo.username}`)
      .setThumbnail(usuarioObjetivo.displayAvatarURL({ dynamic: true }))
      .setColor(estado === 'LOA' || loa?.activo ? 0xf1c40f : 0x74d4fc)
      .addFields(
        {
          name: '👤 Información de Staff',
          value: `> **Rango:** ${rango}\n> **Estado:** ${estadoTexto}\n> **Cumplimiento:** ${estadoMeta}\n${detalleMeta}`,
          inline: false
        },
        {
          name: '⭐ Score y rachas',
          value:
            `> **Score semanal:** ${textoScore(score)} / 100\n` +
            `> **Racha actual:** 🔥 **${racha}** semana(s)\n` +
            `> **Mejor racha:** **${rachaMax}** semana(s)`,
          inline: false
        },
        {
          name: '🚗 Sesiones (host + supervisadas)',
          value: barraSesiones,
          inline: false
        },
        {
          name: '🎫 Tickets Cerrados (semana)',
          value:
            metas.ticketsMeta > 0
              ? barraTickets
              : `> **${ticketsActual}** ticket(s) · sin meta obligatoria para este rango`,
          inline: false
        },
        {
          name: '⏱️ Tiempo de servicio (semana)',
          value: `> **${formatearHoras(cuotas.horasServicio || 0)}** registradas`,
          inline: true
        },
        {
          name: '📋 Desglose sesiones',
          value:
            `> Hosteadas: **${cuotas.sesionesOrganizadas || 0}**\n` +
            `> Supervisadas: **${cuotas.sesionesSupervisadas || 0}**`,
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
        text: `Solicitado por ${interaction.user.tag} • Reinicio: Domingos 22:00 • LOA = exento`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }
};
