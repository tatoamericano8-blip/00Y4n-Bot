import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { generarIDMulta, guardarMulta, programarWarrant, calcularVencimiento } from '../../utils/gestorMultas.js';
import { E } from '../../config/emojis.js';
import {
  buscarInfracciones,
  formatRazonChoiceName,
  formatRazonValue,
  sumarMontosRazones,
  esRazonValida
} from '../../config/codigoInfracciones.js';
import { PRIMARIO } from '../../utils/colores.js';

function colorInt() {
  try {
    return parseInt(String(PRIMARIO || '#FFC28D').replace('#', ''), 16);
  } catch {
    return 0xffc28d;
  }
}

function formatearRazones(razones) {
  if (razones.length === 1) return razones[0];
  return razones.map((r, i) => `${i + 1}. ${r}`).join('\n');
}

export default {
  data: new SlashCommandBuilder()
    .setName('multar')
    .setDescription('Emite una multa oficial (Código de Infracciones 00Y4n · Policía).')
    .addUserOption((option) =>
      option.setName('usuario').setDescription('El usuario que cometió la infracción.').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('razon')
        .setDescription('Escribí el código o nombre (ej. 103, velocidad, GTA).')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('monto')
        .setDescription('Monto en $ (opcional: si no lo ponés, se calcula solo).')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption((option) =>
      option
        .setName('razon_2')
        .setDescription('Segunda infracción (opcional).')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('razon_3')
        .setDescription('Tercera infracción (opcional).')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (!focused || !['razon', 'razon_2', 'razon_3'].includes(focused.name)) {
      return interaction.respond([]);
    }
    const matches = buscarInfracciones(focused.value);
    return interaction.respond(
      matches.map((inf) => ({
        name: formatRazonChoiceName(inf),
        value: formatRazonValue(inf)
      }))
    );
  },

  async execute(interaction) {
    const ROL_POLICIA_ID = '1529146302783422706';

    if (!interaction.member.roles.cache.has(ROL_POLICIA_ID)) {
      return interaction.reply({
        content: E.cruz + ' Solo personal del **Departamento Policial de Sarasota** puede emitir multas.',
        ephemeral: true
      });
    }

    const infractor = interaction.options.getUser('usuario');
    const montoManual = interaction.options.getInteger('monto');

    const razonesRaw = [
      interaction.options.getString('razon'),
      interaction.options.getString('razon_2'),
      interaction.options.getString('razon_3')
    ].filter(Boolean);

    const invalidas = razonesRaw.filter((r) => !esRazonValida(r));
    if (invalidas.length) {
      return interaction.reply({
        content:
          E.cruz +
          ' Elegí la infracción desde la lista del autocompletado (escribí el código o el nombre y seleccioná una opción).',
        ephemeral: true
      });
    }

    const razonesUnicas = [...new Set(razonesRaw)];
    const razonTexto = formatearRazones(razonesUnicas);

    const montoAuto = sumarMontosRazones(razonesUnicas);
    const monto = montoManual != null ? montoManual : montoAuto > 0 ? montoAuto : 100;

    const ticketID = await generarIDMulta();
    const fechaEmision = new Date().toISOString();
    const datosMulta = {
      id: ticketID,
      usuarioId: infractor.id,
      emisorId: interaction.user.id,
      oficialId: interaction.user.id,
      razon: razonTexto,
      razones: razonesUnicas,
      monto,
      guildId: interaction.guildId,
      estado: 'PENDIENTE',
      fecha: fechaEmision,
      venceEn: calcularVencimiento(fechaEmision),
      warrantAplicado: false
    };

    await guardarMulta(ticketID, datosMulta);
    programarWarrant(interaction.client, interaction.guildId, infractor.id, ticketID);

    try {
      const embedDM = new EmbedBuilder()
        .setColor('#ff3333')
        .setTitle(E.carpeta + ' Notificación Oficial de Multa')
        .setDescription(
          `Has recibido una multa de tránsito en **${interaction.guild.name}**.\n\n` +
            `• **Infracción(es):**\n${razonTexto}\n\n` +
            `• **Monto a Pagar:** $${monto.toLocaleString('es-AR')}\n` +
            `• **ID Ticket:** \`${ticketID}\`\n` +
            `• **Oficial Emisor:** <@${interaction.user.id}>\n\n` +
            `${E.checkpoint} *Dispones de **7 días** para abonarla con \`/pagar-multa\` antes de que se emita una Orden de Arresto.*`
        )
        .setTimestamp();
      await infractor.send({ embeds: [embedDM] });
    } catch {
      console.log(`No se le pudo enviar el DM a ${infractor.tag} (DMs bloqueados o cerrados).`);
    }

    const embedMulta = new EmbedBuilder()
      .setColor(colorInt())
      .setTitle(E.carpeta + ' Ticket de Multa Emitido')
      .setDescription(
        `• **Usuario —** <@${infractor.id}>\n` +
          `• **Oficial —** <@${interaction.user.id}>\n` +
          `• **Infracción(es) —**\n${razonTexto}\n` +
          `• **Monto —** $${monto.toLocaleString('es-AR')}\n` +
          `• **ID —** \`${ticketID}\`\n\n` +
          `*Usá \`/pagar-multa\` para abonar este ticket dentro de una semana, o recibirás una orden de arresto.*`
      )
      .setTimestamp();

    await interaction.reply({
      content: E.tilde + ' Multa emitida.',
      flags: MessageFlags.Ephemeral
    });
    const msgCanal = await interaction.channel.send({
      content: `${E.anuncio} **Atención <@${infractor.id}>, has sido multado oficialmente:**`,
      embeds: [embedMulta],
      allowedMentions: { users: [infractor.id] }
    });

    try {
      datosMulta.channelId = msgCanal.channelId;
      datosMulta.messageId = msgCanal.id;
      await guardarMulta(ticketID, datosMulta);
    } catch (e) {
      console.error('[multar] No se pudo guardar messageId de la multa:', e?.message || e);
    }
  }
};
