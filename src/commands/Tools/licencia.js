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
  mezclarPreguntas,
  getLicencia,
  tramitarLicencia,
  marcarExamenAprobado,
  marcarExamenFallido
} from '../../utils/gestorLicencias.js';

global.examenesLicencia = global.examenesLicencia || new Map();

function embedPregunta(userId, data) {
  const p = data.preguntas[data.i];
  const letras = ['A', 'B', 'C', 'D'];
  const body = p.opciones.map((o, i) => `**${letras[i]})** ${o}`).join('\n');
  const embed = new EmbedBuilder()
    .setColor('#74d4fc')
    .setTitle(`Examen teorico — pregunta ${data.i + 1}/${data.preguntas.length}`)
    .setDescription(`**${p.q}**\n\n${body}`)
    .setFooter({ text: 'Elegi una opcion con los botones. No cierres este mensaje.' });
  const row = new ActionRowBuilder().addComponents(
    ...letras.map((letra, i) =>
      new ButtonBuilder()
        .setCustomId(`lic_ex:${userId}:${data.i}:${i}`)
        .setLabel(letra)
        .setStyle(ButtonStyle.Primary)
    )
  );
  return { embeds: [embed], components: [row] };
}

export default {
  data: new SlashCommandBuilder()
    .setName('licencia')
    .setDescription('Licencia de conducir SWFL: examen, estado y tramite.')
    .addSubcommand((s) => s.setName('examen').setDescription('Rendir el examen teorico de manejo (reglamento SWFL)'))
    .addSubcommand((s) => s.setName('estado').setDescription('Ver el estado de tu licencia de conducir'))
    .addSubcommand((s) =>
      s.setName('tramitar').setDescription(`Pagar la tasa ($${PRECIO_EMISION.toLocaleString('es-AR')}) tras aprobar el examen y obtener el rol`)
    )
    .addSubcommand((s) => s.setName('info').setDescription('Como obtener la licencia (examen o tienda express)')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'info') {
      const embed = new EmbedBuilder()
        .setColor('#fb8b66')
        .setTitle('Licencia de Conducir — Southwest Florida')
        .setDescription(
          `Con el objetivo de **mas realismo** y menos colisiones, la comunidad cuenta con normativa de manejo y licencia oficial.\n\n` +
            `**No es obligatoria** para entrar a sesiones, pero **se recomienda**: sin licencia podes recibir **multas graves** o **arrestos** si la policia te controla.\n\n` +
            `### Como obtenerla\n` +
            `**Opcion A — Examen (recomendado)**\n` +
            `1. Lee el reglamento en <#${CANAL_REGLAMENTO}>\n` +
            `2. \`/licencia examen\` — ${EXAMEN_PREGUNTAS} preguntas (aprobas con ${EXAMEN_MIN_CORRECTAS}+ correctas)\n` +
            `3. \`/licencia tramitar\` — pagas **$${PRECIO_EMISION.toLocaleString('es-AR')}** y recibis el rol\n\n` +
            `**Opcion B — Express (tienda)**\n` +
            `• \`/tienda abrir\` → Permisos y Seguros → **Licencia de Conducir (Express)** por **$${PRECIO_EMISION.toLocaleString('es-AR')}**\n` +
            `• Evitas la prueba teorica (misma licencia oficial)\n\n` +
            `### Comandos\n` +
            `• \`/licencia estado\` — ver tu documentacion\n` +
            `• Policia: \`/licencia_swfl\` — suspender / revocar / reactivar`
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
            `**Rol en Discord:** ${tieneRol ? 'Si' : 'No'}\n` +
            `**Metodo de emision:** ${doc?.metodo || '—'}\n` +
            `**Puntos:** ${doc?.puntos ?? '—'}/12\n` +
            (doc?.fechaEmision
              ? `**Emitida:** <t:${Math.floor(new Date(doc.fechaEmision).getTime() / 1000)}:D>\n`
              : '') +
            (doc?.examenAprobadoHasta && new Date(doc.examenAprobadoHasta) > new Date()
              ? `**Examen aprobado vigente hasta:** <t:${Math.floor(new Date(doc.examenAprobadoHasta).getTime() / 1000)}:R>\n→ Usa \`/licencia tramitar\` para pagar la tasa.\n`
              : '') +
            (doc?.motivo && doc.estado !== 'Activa' && doc.estado !== 'Sin licencia'
              ? `**Motivo policial:** ${doc.motivo}\n`
              : '') +
            `\nReglamento: <#${CANAL_REGLAMENTO}>`
        );
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'tramitar') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const result = await tramitarLicencia(userId, interaction.member);
      if (!result.ok) {
        return interaction.editReply({ content: `❌ ${result.mensaje}` });
      }
      return interaction.editReply({
        content:
          `✅ **Licencia emitida.**\n` +
          `Pagaste **$${PRECIO_EMISION.toLocaleString('es-AR')}** y recibiste el rol de conductor.\n` +
          `Conduci respetando el reglamento en <#${CANAL_REGLAMENTO}>.`
      });
    }

    if (sub === 'examen') {
      const doc = await getLicencia(userId);
      if (doc?.estado === 'Activa') {
        return interaction.reply({
          content: '✅ Ya tenes la licencia **Activa**. No necesitas rendir de nuevo.',
          flags: MessageFlags.Ephemeral
        });
      }
      if (doc?.examenCooldownHasta && new Date(doc.examenCooldownHasta) > new Date()) {
        const ts = Math.floor(new Date(doc.examenCooldownHasta).getTime() / 1000);
        return interaction.reply({
          content: `⏳ Todavia estas en cooldown del examen. Podes reintentar <t:${ts}:R>.`,
          flags: MessageFlags.Ephemeral
        });
      }
      if (doc?.examenAprobadoHasta && new Date(doc.examenAprobadoHasta) > new Date()) {
        return interaction.reply({
          content:
            `Ya aprobaste el examen. Tramita con \`/licencia tramitar\` (tasa **$${PRECIO_EMISION.toLocaleString('es-AR')}**) antes de que venza <t:${Math.floor(new Date(doc.examenAprobadoHasta).getTime() / 1000)}:R>.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const preguntas = mezclarPreguntas(EXAMEN_PREGUNTAS);
      global.examenesLicencia.set(userId, {
        preguntas,
        i: 0,
        correctas: 0,
        startedAt: Date.now()
      });

      await interaction.reply({
        content: `Examen teorico SWFL — lee el reglamento en <#${CANAL_REGLAMENTO}> si no lo hiciste.\nAprobas con **${EXAMEN_MIN_CORRECTAS}/${EXAMEN_PREGUNTAS}** correctas.`,
        ...embedPregunta(userId, global.examenesLicencia.get(userId)),
        flags: MessageFlags.Ephemeral
      });
    }
  }
};

export async function handleLicenciaExamenButton(interaction) {
  const parts = interaction.customId.split(':');
  if (parts[0] !== 'lic_ex') return false;
  const userId = parts[1];
  const qIndex = Number(parts[2]);
  const choice = Number(parts[3]);

  if (interaction.user.id !== userId) {
    await interaction.reply({ content: 'Este examen no es tuyo.', flags: MessageFlags.Ephemeral });
    return true;
  }

  const data = global.examenesLicencia.get(userId);
  if (!data) {
    await interaction.reply({
      content: 'El examen expiro o no esta activo. Usa `/licencia examen` de nuevo.',
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
    const ok = data.correctas >= EXAMEN_MIN_CORRECTAS;
    const puntaje = Math.round((data.correctas / data.preguntas.length) * 100);

    if (ok) {
      await marcarExamenAprobado(userId, puntaje);
      await interaction.update({
        content:
          `✅ **Aprobaste** el examen (${data.correctas}/${data.preguntas.length} — ${puntaje}%).\n` +
          `Tenes **72 horas** para \`/licencia tramitar\` y pagar **$${PRECIO_EMISION.toLocaleString('es-AR')}**.`,
        embeds: [],
        components: []
      });
    } else {
      await marcarExamenFallido(userId);
      await interaction.update({
        content:
          `❌ **No aprobaste** (${data.correctas}/${data.preguntas.length}).\n` +
          `Necesitas al menos **${EXAMEN_MIN_CORRECTAS}** correctas.\n` +
          `Revisa <#${CANAL_REGLAMENTO}> y reintenta en **12 horas**.\n` +
          `Tambien podes usar la via express en \`/tienda abrir\`.`,
        embeds: [],
        components: []
      });
    }
    return true;
  }

  await interaction.update(embedPregunta(userId, data));
  return true;
}
