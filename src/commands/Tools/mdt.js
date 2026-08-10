import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import {
  obtenerFichaMDT,
  buscarPorPatente,
  emojiLicencia,
  colorAlerta,
  formatearFecha
} from '../../utils/gestorMDT.js';

const ROL_POLICIA_ID = '1529146302783422706';
const ROL_ALTO_MANDO = '1528870731629465752';

function autorizado(member) {
  return (
    member.roles.cache.has(ROL_POLICIA_ID) ||
    member.roles.cache.has(ROL_ALTO_MANDO) ||
    member.permissions.has('Administrator')
  );
}

function cortar(texto, max = 1024) {
  const s = String(texto || '');
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}

function buildEmbedPrincipal(member, user, ficha) {
  const alertaTxt =
    ficha.nivelAlerta === 'BUSCADO'
      ? '\ud83d\udd34 **BUSCADO / ALTA PRIORIDAD**'
      : ficha.nivelAlerta === 'ATENCION'
        ? '\ud83d\udfe1 **ATENCION \u2014 registros pendientes**'
        : '\ud83d\udfe2 **SIN ALERTAS ACTIVAS**';

  const lic = ficha.licencia;
  const licLine =
    `${emojiLicencia(lic.estado)} **${lic.estado}**` +
    (lic.motivo && lic.estado !== 'Activa' ? ` \u2014 ${lic.motivo}` : '') +
    (lic.oficial_id && lic.estado !== 'Activa' ? ` \u00b7 por <@${lic.oficial_id}>` : '');

  const resumenMultas =
    ficha.multasPendientes.length === 0
      ? '\u2705 Sin multas pendientes'
      : `\ud83d\udd34 **${ficha.multasPendientes.length}** pendiente(s) \u00b7 Deuda **$${ficha.deuda.toLocaleString('es-AR')}**` +
        (ficha.multasPagadas.length ? ` \u00b7 ${ficha.multasPagadas.length} pagada(s)` : '');

  const resumenArrestos =
    ficha.arrestos.length === 0
      ? '\u2705 Sin arrestos registrados'
      : `\ud83d\udd34 Activos: **${ficha.arrestosActivos.length}** \u00b7 Anulados: ${ficha.arrestosAnulados.length} \u00b7 Total: ${ficha.arrestos.length}`;

  const resumenVeh =
    ficha.vehiculos.length === 0
      ? 'Sin vehiculos matriculados'
      : ficha.vehiculos
          .slice(0, 8)
          .map((v) => `\u2022 \`${v.patente}\` \u2014 ${v.marca} ${v.modelo} (${v.anio}) \u00b7 ${v.color}`)
          .join('\n') +
        (ficha.vehiculos.length > 8 ? `\n_\u2026y ${ficha.vehiculos.length - 8} mas_` : '');

  return new EmbedBuilder()
    .setColor(colorAlerta(ficha.nivelAlerta))
    .setTitle('\ud83d\udce1 MDT \u2014 Terminal de Datos Moviles')
    .setDescription(
      `**Ciudadano:** <@${user.id}> (\`${user.tag}\`)\n` +
        `**ID:** \`${user.id}\`\n` +
        `**Estado del sistema:** ${alertaTxt}`
    )
    .setThumbnail(user.displayAvatarURL({ size: 128 }))
    .addFields(
      { name: '\ud83e\udeaa Licencia de conducir', value: cortar(licLine), inline: false },
      { name: '\ud83e\uddfe Multas', value: cortar(resumenMultas), inline: false },
      { name: '\u26d3\ufe0f Arrestos', value: cortar(resumenArrestos), inline: false },
      {
        name: `\ud83d\ude97 Vehiculos matriculados (${ficha.vehiculos.length})`,
        value: cortar(resumenVeh),
        inline: false
      },
      {
        name: '\ud83d\udcb5 Economia (referencia)',
        value: `Saldo en bot: **$${Number(ficha.saldo).toLocaleString('es-AR')}**`,
        inline: true
      }
    )
    .setFooter({
      text: `Consultado por ${member.user.tag} \u00b7 Departamento de Policia \u00b7 SWFL 00Y4n`,
      iconURL: member.user.displayAvatarURL()
    })
    .setTimestamp();
}

function buildEmbedMultas(user, ficha) {
  const lista = ficha.multas.slice(0, 12);
  if (!lista.length) {
    return new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`\ud83e\uddfe Multas \u2014 ${user.tag}`)
      .setDescription('Sin multas en el sistema.');
  }
  const body = lista
    .map((m) => {
      const est = m.estado === 'PAGADA' ? '\ud83d\udfe2 PAGADA' : '\ud83d\udd34 PENDIENTE';
      const ofi = m.emisorId || m.oficialId || m.oficial_id;
      return (
        `**#${m.id}** \u00b7 ${est} \u00b7 **$${Number(m.monto || 0).toLocaleString('es-AR')}**\n` +
        `> ${m.razon || 'Sin motivo'}\n` +
        `> Oficial: ${ofi ? `<@${ofi}>` : '\u2014'} \u00b7 ${formatearFecha(m.fecha)}`
      );
    })
    .join('\n\n');
  return new EmbedBuilder()
    .setColor(ficha.deuda > 0 ? 0xe74c3c : 0x2ecc71)
    .setTitle(`\ud83e\uddfe Multas \u2014 ${user.tag}`)
    .setDescription(cortar(body, 4000))
    .addFields({
      name: 'Resumen',
      value: `Pendientes: **${ficha.multasPendientes.length}** \u00b7 Deuda: **$${ficha.deuda.toLocaleString('es-AR')}** \u00b7 Pagadas: ${ficha.multasPagadas.length}`
    })
    .setTimestamp();
}

function buildEmbedArrestos(user, ficha) {
  const lista = ficha.arrestos.slice(0, 12);
  if (!lista.length) {
    return new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`\u26d3\ufe0f Arrestos \u2014 ${user.tag}`)
      .setDescription('Sin arrestos registrados.');
  }
  const body = lista
    .map((a) => {
      const est = a.estado === 'ACTIVO' ? '\ud83d\udd34 ACTIVO' : '\ud83d\udfe2 ANULADO';
      return (
        `**#${a.id}** \u00b7 ${est}\n` +
        `> ${a.motivo || a.razon || 'Sin motivo'}\n` +
        `> Oficial: ${a.oficialId ? `<@${a.oficialId}>` : '\u2014'} \u00b7 ${formatearFecha(a.fecha)}` +
        (a.estado === 'ANULADO' && a.motivoAnulacion ? `\n> Anulado: ${a.motivoAnulacion}` : '')
      );
    })
    .join('\n\n');
  return new EmbedBuilder()
    .setColor(ficha.arrestosActivos.length ? 0xe74c3c : 0x95a5a6)
    .setTitle(`\u26d3\ufe0f Arrestos \u2014 ${user.tag}`)
    .setDescription(cortar(body, 4000))
    .setTimestamp();
}

function buildEmbedVehiculos(user, ficha) {
  if (!ficha.vehiculos.length) {
    return new EmbedBuilder()
      .setColor(0x95a5a6)
      .setTitle(`\ud83d\ude97 Vehiculos \u2014 ${user.tag}`)
      .setDescription('Sin vehiculos matriculados en el registro oficial.');
  }
  const body = ficha.vehiculos
    .map(
      (v, i) =>
        `**${i + 1}.** \`${v.patente}\`\n` +
        `> ${v.marca} ${v.modelo} \u00b7 ${v.anio} \u00b7 ${v.color}`
    )
    .join('\n\n');
  return new EmbedBuilder()
    .setColor(0x74d4fc)
    .setTitle(`\ud83d\ude97 Vehiculos \u2014 ${user.tag}`)
    .setDescription(cortar(body, 4000))
    .setFooter({ text: `${ficha.vehiculos.length} registro(s) en base de datos` })
    .setTimestamp();
}

function filaBotones(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`mdt_resumen_${userId}`).setLabel('Resumen').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`mdt_multas_${userId}`).setLabel('Multas').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`mdt_arrestos_${userId}`).setLabel('Arrestos').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`mdt_vehiculos_${userId}`).setLabel('Vehiculos').setStyle(ButtonStyle.Success)
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName('mdt')
    .setDescription('MDT policial: ficha de ciudadano (multas, arrestos, vehiculos, licencia).')
    .addSubcommand((sc) =>
      sc
        .setName('ciudadano')
        .setDescription('Buscar ficha completa por usuario de Discord.')
        .addUserOption((o) =>
          o.setName('usuario').setDescription('Ciudadano a consultar').setRequired(true)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('patente')
        .setDescription('Buscar dueno y ficha a partir de una matricula.')
        .addStringOption((o) =>
          o.setName('placa').setDescription('Patente / matricula').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!autorizado(interaction.member)) {
      return interaction.reply({
        content:
          '<:cruz00y4n:1534937767652495360> **Acceso denegado.** Solo personal del **Departamento Policial de Sarasota** o Alto Comando pueden usar el MDT.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    try {
      let user = null;
      let notaPatente = null;

      if (sub === 'ciudadano') {
        user = interaction.options.getUser('usuario');
      } else if (sub === 'patente') {
        const placa = interaction.options.getString('placa');
        const veh = await buscarPorPatente(placa);
        if (!veh) {
          return interaction.editReply({
            content: `\u274c No hay ningun vehiculo registrado con la patente \`${String(placa).toUpperCase()}\`.`
          });
        }
        user = await interaction.client.users.fetch(veh.usuario_id).catch(() => null);
        if (!user) {
          return interaction.editReply({
            content: `Se encontro el vehiculo \`${veh.patente}\` (${veh.marca} ${veh.modelo}), pero el dueno (\`${veh.usuario_id}\`) ya no esta disponible.`
          });
        }
        notaPatente = `Consulta originada por patente **\`${veh.patente}\`** \u00b7 ${veh.marca} ${veh.modelo} (${veh.color})`;
      }

      const ficha = await obtenerFichaMDT(user.id);
      const embed = buildEmbedPrincipal(interaction.member, user, ficha);
      if (notaPatente) {
        embed.addFields({ name: '\ud83d\udd0d Origen de la consulta', value: notaPatente });
      }

      return interaction.editReply({
        embeds: [embed],
        components: [filaBotones(user.id)]
      });
    } catch (err) {
      console.error('[mdt]', err);
      return interaction.editReply({
        content: `\u274c Error al consultar el MDT: \`${String(err?.message || err).slice(0, 180)}\``
      });
    }
  }
};

export async function handleMdtButton(interaction) {
  if (!interaction.customId?.startsWith('mdt_')) return false;
  if (!autorizado(interaction.member)) {
    await interaction.reply({ content: '\u274c Sin permiso para el MDT.', ephemeral: true });
    return true;
  }

  const parts = interaction.customId.split('_');
  const tipo = parts[1];
  const userId = parts.slice(2).join('_');

  await interaction.deferUpdate();

  const user = await interaction.client.users.fetch(userId).catch(() => null);
  if (!user) {
    await interaction.editReply({ content: 'Usuario no encontrado.', embeds: [], components: [] });
    return true;
  }

  const ficha = await obtenerFichaMDT(userId);
  let embed;
  if (tipo === 'multas') embed = buildEmbedMultas(user, ficha);
  else if (tipo === 'arrestos') embed = buildEmbedArrestos(user, ficha);
  else if (tipo === 'vehiculos') embed = buildEmbedVehiculos(user, ficha);
  else embed = buildEmbedPrincipal(interaction.member, user, ficha);

  await interaction.editReply({
    embeds: [embed],
    components: [filaBotones(userId)]
  });
  return true;
}
