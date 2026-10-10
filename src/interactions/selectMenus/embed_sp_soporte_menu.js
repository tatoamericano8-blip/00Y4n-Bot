import {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { saveTicketData, incrementTicketCounter, getOpenTicketCountForUser } from '../../utils/database.js';
import { logger } from '../../utils/logger.js';
import { ES } from '../../config/emojisServicios.js';

const CATEGORY_TICKETS_SP = '1524139843729231932';
const COLOR_SP = 0x1a1a1a;
const MAX_TICKETS_ABIERTOS = 3;
/** Solo Staff de Servicios Públicos ve los tickets */
const ROLE_STAFF_SP = '1524139038251159602';
const GUILD_SP = '1497012276329451581';
/** Rol Policía — único que puede abrir entrenamiento policial */
const ROLE_POLICIA_SP = '1524129890721333499';

const TIPOS = {
  asistencia_general: {
    label: 'Asistencia general',
    slug: 'asistencia',
    reason: 'Asistencia general — preguntas sobre Servicios Públicos',
    formato:
      '```\n' +
      '1) Motivo / duda:\n' +
      '2) Detalle:\n' +
      '3) Departamento (si aplica):\n' +
      '4) Capturas o evidencia (si aplica):\n' +
      '```\n' +
      'Completá este formato en tu próximo mensaje.\n' +
      `-# ${ES.warn} **No** uses este ticket para reportar a un miembro.`
  },
  reporte_departamento: {
    label: 'Reporte de departamento',
    slug: 'reporte',
    reason: 'Reporte de miembro de departamento',
    formato:
      '```\n' +
      '1) Miembro reportado (mención o ID):\n' +
      '2) Departamento:\n' +
      '3) Norma(s) infringida(s):\n' +
      '4) Qué hizo / contexto:\n' +
      '5) Fecha / hora aproximada:\n' +
      '6) Pruebas (capturas / clips):\n' +
      '```\n' +
      '**Sin pruebas es más difícil actuar.** Completá el formato.'
  },
  fastpass_departamento: {
    label: 'Fastpass de departamento',
    slug: 'fastpass',
    reason: 'Fastpass de departamento o solicitud de rol / handpick',
    formato:
      '```\n' +
      '1) Departamento al que aplicás:\n' +
      '2) ¿Fastpass o solicitud de rol / handpick?:\n' +
      '3) Experiencia previa (si hay):\n' +
      '4) Motivo de la solicitud:\n' +
      '5) Pruebas / capturas (si aplica):\n' +
      '```\n' +
      'Completá el formato para que el liderazgo pueda evaluar.'
  },
  entrenamiento_policial: {
    label: 'Solicitud de Entrenamiento Policial',
    slug: 'entrenamiento',
    reason: 'Academia básica — Departamento Policial de Sarasota',
    requiresRole: ROLE_POLICIA_SP,
    denyMsg:
      `${ES.cruz} Este tipo de ticket solo lo pueden abrir miembros con el rol de **Policía**.\n` +
      `-# Si creés que es un error, contactá al liderazgo del departamento.`,
    formato: null // embeds de guía se arman aparte
  }
};

function buildEntrenamientoEmbeds() {
  const guia1 = new EmbedBuilder()
    .setColor(COLOR_SP)
    .setTitle(`${ES.egpd} Entrenamiento básico — Departamento Policial Sarasota`)
    .setDescription(
      [
        `${ES.dot} **Duración estimada:** 15–25 min (lectura + respuestas)`,
        `${ES.dot} **Obligatorio** para cadetes / oficiales nuevos antes de sancionar solos.`,
        '',
        `${ES.flecha} **Objetivo**`,
        'Salir a sesión sabiendo prioridades en patrulla, comandos básicos del bot y cómo actuar en situaciones comunes.',
        '',
        `${ES.warn} **Sin aprobación de este entrenamiento:**`,
        '• Podés patrullar **acompañado** de un oficial de mayor rango',
        '• **No** sancionás solo (multa, arresto, orden, etc.)',
        '',
        `${ES.tilde} **Con aprobación:**`,
        '• Podés actuar con más autonomía según tu rango y las normas del departamento'
      ].join('\n')
    );

  const guia2 = new EmbedBuilder()
    .setColor(COLOR_SP)
    .setTitle(`${ES.info} Guía corta de comandos`)
    .setDescription(
      [
        'Usá estos en sesión / canales correspondientes. Si no sabés el canal, preguntá en **dp salón** o a un superior.',
        '',
        '• `/mdt` — Consultar antecedentes / ficha del civil',
        '• `/multar` — Emitir multa (motivo + monto según normativa)',
        '• `/pagar-multa` — El civil paga su multa',
        '• `/arrestar` — Arresto (si aplica rol Orden de Arresto, se resuelve al cumplirla)',
        '• `/orden` — Orden de arresto / restricción según protocolo',
        '• `/licencia` — Revisar / gestionar licencia',
        '• `/historialArrestos` — Historial reciente de arrestos (si aplica)',
        '',
        `${ES.flecha} **Regla rápida:** Identificá → consultá MDT si hace falta → aplicá la sanción correcta → registrá / reportá si el protocolo lo pide.`,
        '',
        `${ES.warn} No inventes sanciones. Si dudás → rango superior o este ticket.`
      ].join('\n')
    );

  const guia3 = new EmbedBuilder()
    .setColor(COLOR_SP)
    .setTitle(`${ES.check} Checklist + escenarios`)
    .setDescription(
      [
        `${ES.flecha} **Checklist** (marcalo mentalmente o escribí "listo" al final)`,
        '□ Leí `#dp-información`',
        '□ Leí `#dp-ajustes`',
        '□ Entendí prioridades en sesión (RP general > situaciones activas > tráfico > operativos > trámites)',
        '□ Repasé: MDT, multa, arresto, orden, licencia',
        '□ Sé dónde pedir ayuda (este ticket / superior / soporte)',
        '',
        `${ES.flecha} **Escenarios — respondé los 4 en este ticket (numerados 1 a 4)**`,
        'No hace falta ensayo largo: pasos claros.',
        '',
        '**1) Tráfico**',
        'Un civil va a alta velocidad cerca de zona escolar y no se detiene a la primera señal. ¿Qué hacés, en orden?',
        '',
        '**2) MDT + multa**',
        'Detenés a alguien por una infracción menor. Antes de multar, ¿qué revisás y cómo emitís la multa?',
        '',
        '**3) Arresto**',
        'El civil se pone agresivo, no cumple órdenes legales y corresponde arresto. ¿Pasos? ¿Cuándo pedís respaldo?',
        '',
        '**4) Duda en sesión**',
        'No estás seguro si corresponde multa u orden. ¿Qué hacés en el momento?',
        '',
        `${ES.flecha} **Cómo aprobar**`,
        '1) Completá checklist + los 4 escenarios en este ticket',
        '2) (Recomendado) 1 turno acompañado con oficial de mayor rango',
        '3) Un supervisor / oficial senior confirma la aprobación acá',
        '',
        `${ES.lock} Hasta que te confirmen la aprobación: patrulla acompañado · no sancionar solo.`,
        '',
        `-# ${ES.egpd} DPS / Servicios Públicos 00Y4n · octubre 2026`
      ].join('\n')
    )
    .setFooter({ text: 'Respondé los escenarios en este canal. El staff revisará cuando pueda.' });

  return [guia1, guia2, guia3];
}

function sanitizeUserSlug(user) {
  const base = (user?.username || user?.tag || String(user?.id || 'user'))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
  return base || String(user?.id || 'user').slice(-6);
}

function staffRoleOverwrites() {
  return [{
    id: ROLE_STAFF_SP,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.EmbedLinks
    ]
  }];
}

export default {
  id: 'embed_sp_soporte_menu',
  customId: 'embed_sp_soporte_menu',
  name: 'embed_sp_soporte_menu',

  async execute(interaction) {
    const tipoKey = interaction.values?.[0];
    const tipo = TIPOS[tipoKey];

    if (!tipo) {
      return interaction.reply({
        content: `${ES.cruz} Tipo de ticket inválido.`,
        flags: MessageFlags.Ephemeral
      });
    }

    // Restricción por rol (entrenamiento policial)
    if (tipo.requiresRole) {
      const hasRole =
        interaction.member?.roles?.cache?.has(tipo.requiresRole) === true;
      if (!hasRole) {
        return interaction.reply({
          content: tipo.denyMsg || `${ES.cruz} No tenés permiso para este tipo de ticket.`,
          flags: MessageFlags.Ephemeral
        });
      }
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild;
    const member = interaction.member;

    try {
      await guild.channels.fetch().catch(() => null);
      await guild.roles.fetch().catch(() => null);
    } catch {}

    try {
      const abiertos = await getOpenTicketCountForUser(guild.id, member.id).catch(() => 0);
      if (abiertos >= MAX_TICKETS_ABIERTOS) {
        return interaction.editReply({
          content:
            `${ES.cruz} Alcanzaste el máximo de tickets abiertos (**${MAX_TICKETS_ABIERTOS}**).\n` +
            `Cerrá uno antes de abrir otro.`
        });
      }

      let category = null;
      const catCh =
        guild.channels.cache.get(CATEGORY_TICKETS_SP) ||
        (await guild.channels.fetch(CATEGORY_TICKETS_SP).catch(() => null));
      if (catCh?.type === ChannelType.GuildCategory) category = catCh;

      let ticketNumber = String(Date.now()).slice(-4);
      try {
        ticketNumber = await incrementTicketCounter(guild.id);
      } catch (e) {
        logger.warn(`[embed_sp_soporte_menu] contador: ${e?.message}`);
      }

      const userSlug = sanitizeUserSlug(member.user);
      const channelName = `${tipo.slug}-${userSlug}`.toLowerCase().slice(0, 100);

      const overwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.EmbedLinks
          ]
        },
        ...staffRoleOverwrites()
      ];

      if (guild.members.me) {
        overwrites.push({
          id: guild.members.me.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles
          ]
        });
      }

      let channel;
      try {
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category?.id,
          permissionOverwrites: overwrites,
          topic: `SP | ${tipo.label} | ${member.user.tag} | #${ticketNumber}`,
          reason: `Ticket SP: ${tipo.label} — ${member.user.tag}`
        });
      } catch (err1) {
        logger.warn(`[embed_sp_soporte_menu] create con parent: ${err1.message}`);
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          permissionOverwrites: overwrites,
          topic: `SP | ${tipo.label} | ${member.user.tag}`,
          reason: `Ticket SP (sin categoría): ${tipo.label}`
        });
      }

      const ticketData = {
        id: channel.id,
        userId: member.id,
        guildId: guild.id,
        createdAt: new Date().toISOString(),
        status: 'open',
        claimedBy: null,
        priority: 'none',
        reason: tipo.reason,
        tipo: tipoKey,
        origen: 'servicios_publicos'
      };
      await saveTicketData(guild.id, channel.id, ticketData).catch((e) => {
        logger.warn(`[embed_sp_soporte_menu] saveTicketData: ${e.message}`);
      });

      const embedMain = new EmbedBuilder()
        .setColor(COLOR_SP)
        .setTitle(`${ES.form} Ticket #${ticketNumber} — ${tipo.label}`)
        .setDescription(
          `${member}, gracias por abrir un ticket en **Servicios Públicos 00Y4n**.\n\n` +
            `${ES.flecha} **Motivo:** ${tipo.reason}`
        )
        .addFields(
          { name: `${ES.dot} Estado`, value: '🟢 Abierto', inline: true },
          { name: `${ES.dot} Reclamado por`, value: 'Sin reclamar', inline: true },
          {
            name: `${ES.dot} Creado`,
            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
            inline: true
          }
        )
        .setFooter({ text: 'División de Servicios Públicos | 00Y4n' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Cerrar ticket')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔒'),
        new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Reclamar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🙋')
      );

      let embedsToSend = [embedMain];

      if (tipoKey === 'entrenamiento_policial') {
        embedsToSend = embedsToSend.concat(buildEntrenamientoEmbeds());
      } else {
        const embedInstrucciones = new EmbedBuilder()
          .setColor(COLOR_SP)
          .setTitle(`${ES.info} Formato a completar — ${tipo.label}`)
          .setDescription(
            tipo.formato +
              `\n\n-# ${ES.egpd} El staff fue notificado. Respondé acá; no abras otro ticket por lo mismo.`
          );
        embedsToSend.push(embedInstrucciones);
      }

      // Discord: máx 10 embeds por mensaje
      const msg = await channel.send({
        content: `${member}`,
        embeds: embedsToSend.slice(0, 10),
        components: [row]
      });
      await msg.pin().catch(() => null);

      return interaction.editReply({
        content: `${ES.tilde} Ticket creado: ${channel}`
      });
    } catch (err) {
      logger.error('[embed_sp_soporte_menu] Error:', err);
      const detail = err?.rawError?.message || err?.message || 'error desconocido';
      return interaction.editReply({
        content:
          `${ES.cruz} No se pudo crear el ticket: **${detail}**\n` +
          `-# Revisá que el bot tenga **Gestionar canales** y **Ver canales** en la categoría de tickets.`
      });
    }
  },

  async run(client, interaction) {
    return this.execute(interaction, client);
  }
};
