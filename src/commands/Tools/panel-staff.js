import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Staff from '../../../models/Staff.js';
import Sesion from '../../../models/Session.js';
import { obtenerRangoDeUsuario } from '../../utils/rangoStaff.js';
import { obtenerMetasPorRango, sesionesSemana, calcularPuntosSemana } from '../../utils/metasCuota.js';
import { calcularScore, evaluarCumplimiento, textoScore } from '../../utils/scoreCuota.js';
import { E } from '../../config/emojis.js';

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
        content: `${E.cruz || '\u274c'} Solo Alto Comando puede usar este panel.`,
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    const guildId = guild.id;

    const staffList = await Staff.find({
      guildId,
      estado: { $nin: ['DESPEDIDO', 'RENUNCIADO'] }
    }).lean();

    const sesionesAbiertas = await Sesion.find({
      guildId,
      estado: { $in: ['activa', 'esperando', 'lanzada'] }
    })
      .sort({ fechaInicio: -1 })
      .limit(15)
      .lean()
      .catch(() => []);

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
        const puntos = calcularPuntosSemana(cuotas);
        const metas = obtenerMetasPorRango(rango);
        const metaPts = metas.puntosMeta || 40;
        incumplidores.push(
          `> <@${s.userId}> \u00b7 ${puntos}/${metaPts} pts \u00b7 score ${textoScore(score)}`
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
            return `> **${tipo}** ${estado} \u00b7 Host: <@${ses.hostId}> \u00b7 ${inicio}`;
          });

    const embed = new EmbedBuilder()
      .setColor('#8ae6fa')
      .setTitle('Panel Staff \u00b7 Alto Comando')
      .setDescription(
        `Staff en DB: **${staffList.length}** \u00b7 Strikes activos: **${totalStrikesActivos}**`
      )
      .addFields(
        {
          name: `\ud83d\udcc9 Incumplidores puntos (${incumplidores.length})`,
          value: cortar(incumplidores, 10),
          inline: false
        },
        {
          name: `\ud83d\udcdd En LOA (${enLoa.length})`,
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
      new ButtonBuilder().setCustomId('panel_staff_sesiones').setLabel('Sesiones abiertas').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_staff_loa').setLabel('LOA activos').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_staff_incumplidores').setLabel('Incumplidores').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_staff_forzar').setLabel('C\u00f3mo forzar cierre').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_staff_hosts').setLabel('Ranking hosts').setStyle(ButtonStyle.Secondary)
    );

    return interaction.editReply({ embeds: [embed], components: [row] });
  }
};
