import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Staff from '../../../models/Staff.js';
import Sesion from '../../../models/Session.js';
import { obtenerRangoDeUsuario } from '../../utils/rangoStaff.js';
import { obtenerMetasPorRango, sesionesSemana } from '../../utils/metasCuota.js';
import { calcularScore, evaluarCumplimiento, textoScore } from '../../utils/scoreCuota.js';

const ROL_ALTO_MANDO = '1528870731629465752';

function cortar(lista, max = 8) {
  if (!lista.length) return '> \u2014';
  const body = lista.slice(0, max).join('\n');
  return lista.length > max ? `${body}\n> _\u2026y ${lista.length - max} m\u00e1s_` : body;
}

export default {
  data: new SlashCommandBuilder()
    .setName('panel-staff')
    .setDescription('Dashboard de Alto Comando: cuotas, LOA, strikes, sesiones abiertas.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (
      !interaction.member.roles.cache.has(ROL_ALTO_MANDO) &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: '<:cruz00y4n:1523041302764191844> Solo **Alto Comando** puede usar este panel.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;
    const guild = interaction.guild;

    const staffList = await Staff.find({
      guildId,
      estado: { $nin: ['DESPEDIDO', 'RENUNCIADO'] }
    });

    const sesionesAbiertas = await Sesion.find({
      guildId,
      estado: { $in: ['esperando_reacciones', 'activa'] }
    })
      .sort({ fechaInicio: -1 })
      .limit(10);

    const incumplidores = [];
    const enLoa = [];
    const conStrikes = [];
    const topScore = [];
    let totalStrikesActivos = 0;

    for (const s of staffList) {
      const { rango } = await obtenerRangoDeUsuario(guild, s.userId, s.rango || 'Staff');
      const cuotas = s.cuotas || {};
      const score = calcularScore(cuotas, rango);
      const evalC = evaluarCumplimiento(s, rango);
      const strikesActivos = (s.strikes || []).filter(x => x.activo);
      totalStrikesActivos += strikesActivos.length;

      topScore.push({ userId: s.userId, score, rango });

      if (evalC.enLoa) {
        enLoa.push(
          `> <@${s.userId}> \u00b7 ${rango}` +
            (s.loa?.motivo ? ` \u00b7 _${String(s.loa.motivo).slice(0, 40)}_` : '')
        );
      } else if (evalC.cumplio === false) {
        const ses = sesionesSemana(cuotas);
        const metas = obtenerMetasPorRango(rango);
        incumplidores.push(
          `> <@${s.userId}> \u00b7 ${ses}/${metas.sesionesMeta} ses \u00b7 ${cuotas.ticketsCerrados || 0}/${metas.ticketsMeta} tkt \u00b7 score ${textoScore(score)}`
        );
      }

      if (strikesActivos.length > 0) {
        const detalle = strikesActivos
          .slice(0, 2)
          .map(st => `\`${st.idStrike || st._id || '?'}\``)
          .join(', ');
        conStrikes.push(`> <@${s.userId}> \u00b7 **${strikesActivos.length}/3** ${detalle}`);
      }
    }

    topScore.sort((a, b) => b.score - a.score);

    const lineasSesiones =
      sesionesAbiertas.length === 0
        ? ['> Ninguna sesi\u00f3n abierta']
        : sesionesAbiertas.map(ses => {
            const tipo = ses.tipo === 'meet' ? 'Car Meet' : 'Roleplay';
            const estado = ses.estado === 'activa' ? '\ud83d\udfe2 activa' : '\ud83d\udfe1 esperando';
            const inicio = ses.fechaInicio
              ? `<t:${Math.floor(new Date(ses.fechaInicio).getTime() / 1000)}:R>`
              : '\u2014';
            return `> **${tipo}** ${estado} \u00b7 Host: <@${ses.hostId}>${
              ses.coHostId ? ` \u00b7 Co-Host: <@${ses.coHostId}>` : ''
            } \u00b7 ${inicio}`;
          });

    const despedidos = await Staff.countDocuments({ guildId, estado: 'DESPEDIDO' });
    const renunciados = await Staff.countDocuments({ guildId, estado: 'RENUNCIADO' });

    const embed = new EmbedBuilder()
      .setTitle('\ud83d\udee1\ufe0f Panel Alto Comando \u2014 Staff')
      .setColor('#74d4fc')
      .setDescription(
        `Resumen operativo de **${guild.name}**.\nSolo visible para Alto Comando (respuesta ef\u00edmera).`
      )
      .addFields(
        {
          name: '\ud83d\udccc Resumen general',
          value:
            `> **Staff activos (DB):** ${staffList.length}\n` +
            `> **En LOA:** ${enLoa.length}\n` +
            `> **Incumpliendo cuota:** ${incumplidores.length}\n` +
            `> **Con strikes activos:** ${conStrikes.length} (total strikes: ${totalStrikesActivos})\n` +
            `> **Sesiones abiertas:** ${sesionesAbiertas.length}\n` +
            `> **Despedidos / Renuncias (hist):** ${despedidos} / ${renunciados}`,
          inline: false
        },
        {
          name: `\u274c Incumplidores de cuota (${incumplidores.length})`,
          value: cortar(incumplidores, 10),
          inline: false
        },
        {
          name: `\ud83d\udfe1 LOA activos (${enLoa.length})`,
          value: cortar(enLoa, 8),
          inline: false
        },
        {
          name: `\u26a0\ufe0f Strikes activos (${conStrikes.length})`,
          value: cortar(conStrikes, 8),
          inline: false
        },
        {
          name: `\ud83d\udce1 Sesiones abiertas (${sesionesAbiertas.length})`,
          value: cortar(lineasSesiones, 8),
          inline: false
        },
        {
          name: '\u2b50 Top 5 score semanal',
          value: cortar(
            topScore.slice(0, 5).map(
              (t, i) =>
                `> **${i + 1}.** <@${t.userId}> \u00b7 ${textoScore(t.score)} \u00b7 ${t.rango}`
            ),
            5
          ),
          inline: false
        }
      )
      .setFooter({
        text: `Solicitado por ${interaction.user.tag} \u2022 00Y4n HC Dashboard`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('panel_staff_sesiones').setLabel('Sesiones abiertas').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('panel_staff_loa').setLabel('LOA activos').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_staff_incumplidores').setLabel('Incumplidores').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('panel_staff_forzar').setLabel('C\u00f3mo forzar cierre').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('panel_staff_hosts').setLabel('Ranking hosts').setStyle(ButtonStyle.Primary)
    );

    return interaction.editReply({ embeds: [embed], components: [row] });
  }
};
