import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../../../models/Staff.js';
import Sesion from '../../../models/Session.js';
import { obtenerRangoDeUsuario } from '../../utils/rangoStaff.js';
import { obtenerMetasPorRango, sesionesSemana } from '../../utils/metasCuota.js';
import { calcularScore, evaluarCumplimiento, textoScore } from '../../utils/scoreCuota.js';

const ROL_ALTO_MANDO = '1528870731629465752';

function cortar(lista, max = 8) {
  if (!lista.length) return '> —';
  const body = lista.slice(0, max).join('\n');
  return lista.length > max ? `${body}\n> _…y ${lista.length - max} más_` : body;
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
          `> <@${s.userId}> · ${rango}` +
            (s.loa?.motivo ? ` · _${String(s.loa.motivo).slice(0, 40)}_` : '')
        );
      } else if (evalC.cumplio === false) {
        const ses = sesionesSemana(cuotas);
        const metas = obtenerMetasPorRango(rango);
        incumplidores.push(
          `> <@${s.userId}> · ${ses}/${metas.sesionesMeta} ses · ${cuotas.ticketsCerrados || 0}/${metas.ticketsMeta} tkt · score ${textoScore(score)}`
        );
      }

      if (strikesActivos.length > 0) {
        const detalle = strikesActivos
          .slice(0, 2)
          .map(st => `\`${st.idStrike || st._id || '?'}\``)
          .join(', ');
        conStrikes.push(`> <@${s.userId}> · **${strikesActivos.length}/3** ${detalle}`);
      }
    }

    topScore.sort((a, b) => b.score - a.score);

    const lineasSesiones =
      sesionesAbiertas.length === 0
        ? ['> Ninguna sesión abierta']
        : sesionesAbiertas.map(ses => {
            const tipo = ses.tipo === 'meet' ? 'Car Meet' : 'Roleplay';
            const estado = ses.estado === 'activa' ? '🟢 activa' : '🟡 esperando';
            const inicio = ses.fechaInicio
              ? `<t:${Math.floor(new Date(ses.fechaInicio).getTime() / 1000)}:R>`
              : '—';
            return `> **${tipo}** ${estado} · Host: <@${ses.hostId}>${
              ses.coHostId ? ` · Co-Host: <@${ses.coHostId}>` : ''
            } · ${inicio}`;
          });

    const despedidos = await Staff.countDocuments({ guildId, estado: 'DESPEDIDO' });
    const renunciados = await Staff.countDocuments({ guildId, estado: 'RENUNCIADO' });

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Panel Alto Comando — Staff')
      .setColor('#74d4fc')
      .setDescription(
        `Resumen operativo de **${guild.name}**.\nSolo visible para Alto Comando (respuesta efímera).`
      )
      .addFields(
        {
          name: '📌 Resumen general',
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
          name: `❌ Incumplidores de cuota (${incumplidores.length})`,
          value: cortar(incumplidores, 10),
          inline: false
        },
        {
          name: `🟡 LOA activos (${enLoa.length})`,
          value: cortar(enLoa, 8),
          inline: false
        },
        {
          name: `⚠️ Strikes activos (${conStrikes.length})`,
          value: cortar(conStrikes, 8),
          inline: false
        },
        {
          name: `📡 Sesiones abiertas (${sesionesAbiertas.length})`,
          value: cortar(lineasSesiones, 8),
          inline: false
        },
        {
          name: '⭐ Top 5 score semanal',
          value: cortar(
            topScore.slice(0, 5).map(
              (t, i) =>
                `> **${i + 1}.** <@${t.userId}> · ${textoScore(t.score)} · ${t.rango}`
            ),
            5
          ),
          inline: false
        }
      )
      .setFooter({
        text: `Solicitado por ${interaction.user.tag} • 00Y4n HC Dashboard`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
