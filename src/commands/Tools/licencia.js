import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import {
  ROL_LICENCIA,
  CANAL_REGLAMENTO,
  PRECIO_EMISION,
  EXAMEN_PREGUNTAS,
  EXAMEN_MIN_CORRECTAS,
  RECUP_PREGUNTAS,
  RECUP_MIN_CORRECTAS,
  mezclarPreguntas,
  mezclarRecuperacion,
  getLicencia,
  tramitarLicencia,
  marcarExamenAprobado,
  marcarExamenFallido,
  reactivarPorRecuperacion,
  marcarRecuperacionFallida
} from '../../utils/gestorLicencias.js';

global.examenesLicencia = global.examenesLicencia || new Map();

function embedPregunta(userId, data, prefix = 'lic_ex') {
  const p = data.preguntas[data.i];
  const letras = ['A', 'B', 'C', 'D'];
  const body = p.opciones.map((o, i) => `**${letras[i]})** ${o}`).join('\n');
  const titulo =
    prefix === 'lic_rec'
      ? `Recuperacion de licencia — pregunta ${data.i + 1}/${data.preguntas.length}`
      : `Examen teorico — pregunta ${data.i + 1}/${data.preguntas.length}`;
  const embed = new EmbedBuilder()
    .setColor(prefix === 'lic_rec' ? '#ed4245' : '#74d4fc')
    .setTitle(titulo)
    .setDescription(`**${p.q}**\n\n${body}`)
    .setFooter({ text: 'Elegi una opcion con los botones. No cierres este mensaje.' });
  const row = new ActionRowBuilder().addComponents(
    ...letras.map((letra, i) =>
      new ButtonBuilder()
        .setCustomId(`${prefix}:${userId}:${data.i}:${i}`)
        .setLabel(letra)
        .setStyle(ButtonStyle.Primary)
    )
  );
  return { embeds: [embed], components: [row] };
}

export default {
  data: new SlashCommandBuilder()
    .setName('licencia')
    .setDescription('Licencia de conducir SWFL: examen, estado, tramite y recuperacion.')
    .addSubcommand((s) => s.setName('examen').setDescription('Rendir el examen teorico de manejo'))
    .addSubcommand((s) => s.setName('estado').setDescription('Ver el estado de tu licencia'))
    .addSubcommand((s) =>
      s.setName('tramitar').setDescription(`Pagar la tasa ($${PRECIO_EMISION.toLocaleString('es-AR')}) tras aprobar el examen`)
    )
    .addSubcommand((s) =>
      s.setName('recuperar').setDescription('Solo REVOCADA: quiz de recuperacion (10 preguntas, minimo 7 correctas)')
    )
    .addSubcommand((s) => s.setName('info').setDescription('Como obtener o recuperar la licencia')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'info') {
      const embed = new EmbedBuilder()
        .setColor('#fb8b66')
        .setTitle('Licencia de Conducir — Southwest Florida')
        .setDescription(
          `**No es obligatoria** para entrar a sesiones, pero se recomienda.\n\n` +
            `### Como obtenerla\n` +
            `**A — Examen:** \`/licencia examen\` (${EXAMEN_PREGUNTAS} preg, min ${EXAMEN_MIN_CORRECTAS}) → \`/licencia tramitar\` ($${PRECIO_EMISION.toLocaleString('es-AR')})\n` +
            `**B — Express:** \`/tienda abrir\` → Licencia Express **$75.000**\n\n` +
            `### Si esta REVOCADA\n` +
            `\`/licencia recuperar\` — ${RECUP_PREGUNTAS} preguntas, min **${RECUP_MIN_CORRECTAS}** correctas. Si aprobas se reactiva.\n` +
            `Si fallas, cooldown 24h.\n\n` +
            `Reglamento: <#${CANAL_REGLAMENTO}>`
        )
        .setFooter({ text: '00Y4n • Transito SWFL' });
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'estado') {
      const doc = await getLicencia(userId);
      const estado = doc?.estado || 'Sin licencia';
      const tieneRol = interaction.member.roles.cache.has(ROL_LICENCIA);
      let color = '#95a5a6';
      if (estado === 'Activa') color = '#57f287';
      if (estado === 'Suspendida') color = '#fee75c';
      if (estado === 'Revocada') color = '#ed4245';
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle('Tu licencia de conducir')
        .setDescription(
          `**Estado:** ${estado}\n` +
            `**Rol:** ${tieneRol ? 'Si' : 'No'}\n` +
            `**Metodo:** ${doc?.metodo || '—'}\n` +
            `**Puntos:** ${doc?.puntos ?? '—'}/12\n` +
            (doc?.motivo && estado !== 'Activa' && estado !== 'Sin licencia'
              ? `**Motivo:** ${doc.motivo}\n`
              : '') +
            (estado === 'Revocada'
              ? `\nUsa \`/licencia recuperar\` (${RECUP_MIN_CORRECTAS}/${RECUP_PREGUNTAS}).\n`
              : '') +
            `\nReglamento: <#${CANAL_REGLAMENTO}>`
        );
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'tramitar') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const result = await tramitarLicencia(userId, interaction.member);
      if (!result.ok) return interaction.editReply({ content: `❌ ${result.mensaje}` });
      return interaction.editReply({
        content: `✅ **Licencia emitida.** Pagaste **$${PRECIO_EMISION.toLocaleString('es-AR')}**. Reglamento: <#${CANAL_REGLAMENTO}>.`
      });
    }

    if (sub === 'recuperar') {
      const doc = await getLicencia(userId);
      if (!doc || doc.estado !== 'Revocada') {
        return interaction.reply({
          content:
            `❌ Solo con licencia **Revocada**. Tu estado: **${doc?.estado || 'Sin licencia'}**.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (doc.examenCooldownHasta && new Date(doc.examenCooldownHasta) > new Date()) {
        const ts = Math.floor(new Date(doc.examenCooldownHasta).getTime() / 1000);
        return interaction.reply({
          content: `⏳ Cooldown activo. Reintenta <t:${ts}:R>.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (global.examenesLicencia.has(userId)) {
        return interaction.reply({ content: 'Ya tenes un cuestionario en curso.', flags: MessageFlags.Ephemeral });
      }
      const preguntas = mezclarRecuperacion(RECUP_PREGUNTAS);
      global.examenesLicencia.set(userId, {
        tipo: 'recuperacion',
        preguntas,
        i: 0,
        correctas: 0,
        startedAt: Date.now()
      });
      return interaction.reply({
        content:
          `🔴 **Recuperacion de licencia revocada**\n` +
          `Lee <#${CANAL_REGLAMENTO}>. ${RECUP_PREGUNTAS} preguntas — min **${RECUP_MIN_CORRECTAS}** correctas.`,
        ...embedPregunta(userId, global.examenesLicencia.get(userId), 'lic_rec'),
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'examen') {
      const doc = await getLicencia(userId);
      if (doc?.estado === 'Activa') {
        return interaction.reply({ content: '✅ Ya tenes la licencia **Activa**.', flags: MessageFlags.Ephemeral });
      }
      if (doc?.estado === 'Revocada') {
        return interaction.reply({
          content: 'Licencia **Revocada**. Usa **`/licencia recuperar`**.',
          flags: MessageFlags.Ephemeral
        });
      }
      if (doc?.estado === 'Suspendida') {
        return interaction.reply({
          content: 'Licencia **Suspendida**. Resolvelo con Policia.',
          flags: MessageFlags.Ephemeral
        });
      }
      if (doc?.examenCooldownHasta && new Date(doc.examenCooldownHasta) > new Date()) {
        const ts = Math.floor(new Date(doc.examenCooldownHasta).getTime() / 1000);
        return interaction.reply({
          content: `⏳ Cooldown del examen. Reintenta <t:${ts}:R>.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (doc?.examenAprobadoHasta && new Date(doc.examenAprobadoHasta) > new Date()) {
        return interaction.reply({
          content: `Ya aprobaste. Tramita con \`/licencia tramitar\`.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (global.examenesLicencia.has(userId)) {
        return interaction.reply({ content: 'Ya tenes un examen en curso.', flags: MessageFlags.Ephemeral });
      }
      const preguntas = mezclarPreguntas(EXAMEN_PREGUNTAS);
      global.examenesLicencia.set(userId, {
        tipo: 'examen',
        preguntas,
        i: 0,
        correctas: 0,
        startedAt: Date.now()
      });
      return interaction.reply({
        content: `Examen teorico — <#${CANAL_REGLAMENTO}>. Min **${EXAMEN_MIN_CORRECTAS}/${EXAMEN_PREGUNTAS}**.`,
        ...embedPregunta(userId, global.examenesLicencia.get(userId), 'lic_ex'),
        flags: MessageFlags.Ephemeral
      });
    }
  }
};

export async function handleLicenciaExamenButton(interaction) {
  const parts = interaction.customId.split(':');
  const prefix = parts[0];
  if (prefix !== 'lic_ex' && prefix !== 'lic_rec') return false;
  const userId = parts[1];
  const qIndex = Number(parts[2]);
  const choice = Number(parts[3]);
  const isRecup = prefix === 'lic_rec';

  if (interaction.user.id !== userId) {
    await interaction.reply({ content: 'Este cuestionario no es tuyo.', flags: MessageFlags.Ephemeral });
    return true;
  }
  const data = global.examenesLicencia.get(userId);
  if (!data) {
    await interaction.reply({
      content: isRecup
        ? 'Expiro. Usa `/licencia recuperar`.'
        : 'Expiro. Usa `/licencia examen`.',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }
  if (qIndex !== data.i) {
    await interaction.reply({ content: 'Esa pregunta ya fue respondida.', flags: MessageFlags.Ephemeral });
    return true;
  }
  const p = data.preguntas[data.i];
  if (choice === p.correcta) data.correctas += 1;
  data.i += 1;

  if (data.i >= data.preguntas.length) {
    global.examenesLicencia.delete(userId);
    const minOk = isRecup ? RECUP_MIN_CORRECTAS : EXAMEN_MIN_CORRECTAS;
    const ok = data.correctas >= minOk;
    const puntaje = Math.round((data.correctas / data.preguntas.length) * 100);

    if (isRecup) {
      if (ok) {
        await reactivarPorRecuperacion(userId, interaction.member, puntaje);
        await interaction.update({
          content:
            `✅ **Recuperacion aprobada** (${data.correctas}/${data.preguntas.length} — ${puntaje}%).\n` +
            `Licencia **Activa** y rol asignado. Respeta <#${CANAL_REGLAMENTO}>.`,
          embeds: [],
          components: []
        });
      } else {
        await marcarRecuperacionFallida(userId);
        await interaction.update({
          content:
            `❌ **No aprobaste** (${data.correctas}/${data.preguntas.length}).\n` +
            `Min **${RECUP_MIN_CORRECTAS}/${RECUP_PREGUNTAS}**. Revisa <#${CANAL_REGLAMENTO}> y reintenta en **24h**.`,
          embeds: [],
          components: []
        });
      }
      return true;
    }

    if (ok) {
      await marcarExamenAprobado(userId, puntaje);
      await interaction.update({
        content:
          `✅ **Aprobaste** (${data.correctas}/${data.preguntas.length} — ${puntaje}%).\n` +
          `72h para \`/licencia tramitar\` ($${PRECIO_EMISION.toLocaleString('es-AR')}).`,
        embeds: [],
        components: []
      });
    } else {
      await marcarExamenFallido(userId);
      await interaction.update({
        content:
          `❌ **No aprobaste** (${data.correctas}/${data.preguntas.length}).\n` +
          `Min **${EXAMEN_MIN_CORRECTAS}**. Revisa <#${CANAL_REGLAMENTO}> y reintenta en **12h**.`,
        embeds: [],
        components: []
      });
    }
    return true;
  }

  await interaction.update(embedPregunta(userId, data, prefix));
  return true;
}
