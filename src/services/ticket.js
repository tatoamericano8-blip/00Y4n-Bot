import {
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  AttachmentBuilder,
} from 'discord.js';
import { getGuildConfig } from './guildConfig.js';
import { getTicketData, saveTicketData, deleteTicketData, getOpenTicketCountForUser, incrementTicketCounter } from '../utils/database.js';
import { logger } from '../utils/logger.js';
import { createEmbed, errorEmbed } from '../utils/embeds.js';
import { logTicketEvent } from '../utils/ticketLogging.js';
import { BotConfig } from '../config/bot.js';
import { ensureTypedServiceError } from '../utils/serviceErrorBoundary.js';

function getPriorityMap() {
  const priorities = BotConfig.tickets?.priorities || {
    none: { emoji: "⚪", color: "#95A5A6", label: "None" },
    low: { emoji: "🟢", color: "#2ECC71", label: "Low" },
    medium: { emoji: "🟡", color: "#F1C40F", label: "Medium" },
    high: { emoji: "🔴", color: "#E74C3C", label: "High" },
    urgent: { emoji: "🚨", color: "#E91E63", label: "Urgent" },
  };
  const map = {};
  for (const [key, config] of Object.entries(priorities)) {
    map[key] = {
      name: `${config.emoji} ${config.label.toUpperCase()}`,
      color: config.color,
      emoji: config.emoji,
      label: config.label,
    };
  }
  return map;
}

const PRIORITY_MAP = getPriorityMap();
const TICKET_DELETE_DELAY_MS = 3000;
const TICKET_DELETE_DELAY_SECONDS = Math.floor(TICKET_DELETE_DELAY_MS / 1000);

export async function getUserTicketCount(guildId, userId) {
  try {
    return await getOpenTicketCountForUser(guildId, userId);
  } catch (error) {
    logger.error('Error counting user tickets:', { guildId, userId, error: error.message });
    return 0;
  }
}

export async function createTicket(guild, member, categoryId, reason = 'Sin motivo', priority = 'none') {
  try {
    let config = {};
    try { config = await getGuildConfig(guild.client, guild.id); } catch { config = {}; }
    const ticketConfig = config.tickets || {};
    const maxTicketsPerUser = config.maxTicketsPerUser ?? 3;
    const currentTicketCount = await getUserTicketCount(guild.id, member.id);
    if (currentTicketCount >= maxTicketsPerUser) {
      return { success: false, error: `Alcanzaste el máximo de tickets abiertos (${maxTicketsPerUser}). Cerrá uno antes de abrir otro.` };
    }
    let category = null;
    if (categoryId) {
      const ch = guild.channels.cache.get(categoryId) || await guild.channels.fetch(categoryId).catch(() => null);
      if (ch && ch.type === ChannelType.GuildCategory) category = ch;
    }
    if (!category) {
      category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && /ticket|asistencia|soporte|support/i.test(c.name)) || null;
    }
    const ticketNumber = await getNextTicketNumber(guild.id).catch(() => String(Date.now()).slice(-4));
    let channelName = `ticket-${ticketNumber}`.toLowerCase().slice(0, 100);
    const staffRoleId = config.ticketStaffRoleId || '1512120103771050005';
    const overwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.EmbedLinks] },
    ];
    if (staffRoleId && guild.roles.cache.has(staffRoleId)) {
      overwrites.push({ id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.EmbedLinks] });
    }
    if (guild.members.me) {
      overwrites.push({ id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles] });
    }
    let channel;
    try {
      channel = await guild.channels.create({ name: channelName, type: ChannelType.GuildText, parent: category?.id, permissionOverwrites: overwrites, reason: `Ticket por ${member.user?.tag || member.id}` });
    } catch {
      channel = await guild.channels.create({ name: channelName, type: ChannelType.GuildText, permissionOverwrites: overwrites, reason: `Ticket (sin categoría)` });
    }
    const ticketData = { id: channel.id, userId: member.id, guildId: guild.id, createdAt: new Date().toISOString(), status: 'open', claimedBy: null, priority: priority || 'none', reason };
    await saveTicketData(guild.id, channel.id, ticketData).catch(() => {});
    const priorityInfo = PRIORITY_MAP[priority] || PRIORITY_MAP.none;
    const embed = createEmbed({
      title: `Ticket #${ticketNumber}`,
      description: `${member.toString()}, gracias por abrir un ticket.\n\n**Motivo:** ${reason}\n**Prioridad:** ${priorityInfo.emoji} ${priorityInfo.label}`,
      color: priorityInfo.color,
      fields: [
        { name: 'Estado', value: '🟢 Abierto', inline: true },
        { name: 'Reclamado por', value: 'Sin reclamar', inline: true },
        { name: 'Creado', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
      ],
    });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Cerrar ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
      new ButtonBuilder().setCustomId('ticket_claim').setLabel('Reclamar').setStyle(ButtonStyle.Primary).setEmoji('🙋'),
      new ButtonBuilder().setCustomId('ticket_pin').setLabel('Fijar').setStyle(ButtonStyle.Secondary).setEmoji('📌')
    );
    const staffMention = (staffRoleId && guild.roles.cache.has(staffRoleId)) ? ` <@&${staffRoleId}>` : '';
    const ticketMessage = await channel.send({ content: `${member.toString()}${staffMention}`, embeds: [embed], components: [row] });
    await ticketMessage.pin().catch(() => {});
    await logTicketEvent({ client: guild.client, guildId: guild.id, event: { type: 'open', ticketId: channel.id, ticketNumber, userId: member.id, executorId: member.id, reason, priority: priority || 'none', metadata: { channelId: channel.id, categoryName: category?.name || 'Default' } } }).catch(() => {});
    return { success: true, channel, ticketData };
  } catch (error) {
    logger.error('Error creating ticket:', { error: error.message, code: error.code });
    return { success: false, error: `No se pudo crear el ticket: ${error.message}` };
  }
}

export async function closeTicket(channel, closer, reason = 'Sin motivo') {
  try {
    const ticketData = await getTicketData(channel.guild.id, channel.id);
    if (!ticketData) return { success: false, error: 'Este canal no es un ticket' };
    let config = {};
    try { config = await getGuildConfig(channel.client, channel.guild.id); } catch { config = {}; }
    const dmOnClose = config.dmOnClose !== false;
    const closedCategoryId = config.ticketClosedCategoryId || null;
    let movedToClosedCategory = false;
    ticketData.status = 'closed';
    ticketData.closedBy = closer.id;
    ticketData.closedAt = new Date().toISOString();
    ticketData.closeReason = reason;
    await saveTicketData(channel.guild.id, channel.id, ticketData);
    if (closedCategoryId && channel.parentId !== closedCategoryId) {
      const closedCategory = channel.guild.channels.cache.get(closedCategoryId) || await channel.guild.channels.fetch(closedCategoryId).catch(() => null);
      if (closedCategory?.type === ChannelType.GuildCategory) {
        try { await channel.setParent(closedCategoryId, { lockPermissions: false }); movedToClosedCategory = true; } catch (e) { logger.warn(e.message); }
      }
    }
    if (dmOnClose) {
      try {
        const ticketCreator = await channel.client.users.fetch(ticketData.userId).catch(() => null);
        if (ticketCreator) {
          const dmEmbed = createEmbed({
            title: '🎫 Tu ticket fue cerrado',
            description: `Tu ticket **${channel.name}** fue cerrado.\n\n**Motivo:** ${reason}\n**Cerrado por:** ${closer.tag}\n**Cerrado:** <t:${Math.floor(Date.now() / 1000)}:F>\n\nGracias por usar el sistema de soporte de 00Y4n. Si necesitás algo más, podés abrir un ticket nuevo.`,
            color: '#e74c3c',
            footer: { text: `Ticket ID: ${ticketData.id}` }
          });
          await ticketCreator.send({ embeds: [dmEmbed] });
          try {
            const feedbackEmbed = createEmbed({
              title: '⭐ ¿Cómo fue tu experiencia de soporte?',
              description: `Nos gustaría saber cómo te fue con **${channel.name}**.\nElegí una calificación abajo — solo toma un segundo.`,
              color: '#F1C40F',
              footer: { text: 'Tu opinión nos ayuda a mejorar.' },
            });
            const base = `ticket_feedback:${channel.guild.id}:${channel.id}`;
            const starsRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`${base}:1`).setLabel('⭐ 1').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`${base}:2`).setLabel('⭐⭐ 2').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`${base}:3`).setLabel('⭐⭐⭐ 3').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`${base}:4`).setLabel('⭐⭐⭐⭐ 4').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`${base}:5`).setLabel('⭐⭐⭐⭐⭐ 5').setStyle(ButtonStyle.Secondary),
            );
            const declineRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`ticket_feedback_decline:${channel.guild.id}:${channel.id}`).setLabel('❌ No, gracias').setStyle(ButtonStyle.Secondary)
            );
            await ticketCreator.send({ embeds: [feedbackEmbed], components: [starsRow, declineRow] });
          } catch (e) { logger.warn(e.message); }
        }
      } catch (e) { logger.warn(e.message); }
    }
    try {
      const user = await channel.guild.members.fetch(ticketData.userId).catch(() => null);
      const targetUser = user?.user || await channel.client.users.fetch(ticketData.userId).catch(() => null);
      if (targetUser) {
        const overwrite = channel.permissionOverwrites.cache.get(ticketData.userId);
        if (overwrite) await overwrite.edit({ ViewChannel: false, SendMessages: false });
        else await channel.permissionOverwrites.create(targetUser, { ViewChannel: false, SendMessages: false });
      }
    } catch (e) { logger.warn(e.message); }
    const messages = await channel.messages.fetch();
    const ticketMessage = messages.find(m => m.embeds.length > 0 && m.embeds[0].title?.startsWith('Ticket #'));
    if (ticketMessage) {
      const embed = ticketMessage.embeds[0];
      const statusField = embed.fields?.find(f => f.name === 'Estado' || f.name === 'Status');
      if (statusField) statusField.value = '🔴 Cerrado';
      await ticketMessage.edit({ embeds: [createEmbed({ title: embed.title || 'Ticket', description: embed.description || '', color: '#e74c3c', fields: embed.fields || [], footer: embed.footer })], components: [] });
    }
    const closeEmbed = createEmbed({
      title: 'Ticket cerrado',
      description: `Este ticket fue cerrado por ${closer}.\n**Motivo:** ${reason}${dmOnClose ? '\n\n📩 Se envió un MD al creador del ticket.' : ''}`,
      color: '#e74c3c',
      footer: { text: `Ticket ID: ${ticketData.id}` }
    });
    const controlRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_reopen').setLabel('Reabrir ticket').setStyle(ButtonStyle.Success).setEmoji('🔓'),
      new ButtonBuilder().setCustomId('ticket_delete').setLabel('Eliminar ticket').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
    );
    await channel.send({ embeds: [closeEmbed], components: [controlRow] });
    await logTicketEvent({ client: channel.client, guildId: channel.guild.id, event: { type: 'close', ticketId: channel.id, ticketNumber: ticketData.id, userId: ticketData.userId, executorId: closer.id, reason, metadata: { dmSent: dmOnClose, closedAt: ticketData.closedAt, movedToClosedCategory } } }).catch(() => {});
    return { success: true, ticketData };
  } catch (error) {
    logger.error('Error closing ticket:', { error: error.message });
    return { success: false, error: 'No se pudo cerrar el ticket. Intentá de nuevo.' };
  }
}

export async function claimTicket(channel, claimer) {
  try {
    const ticketData = await getTicketData(channel.guild.id, channel.id);
    if (!ticketData) return { success: false, error: 'Este canal no es un ticket' };
    if (ticketData.claimedBy) return { success: false, error: `Este ticket ya está reclamado por <@${ticketData.claimedBy}>` };
    ticketData.claimedBy = claimer.id;
    ticketData.claimedAt = new Date().toISOString();
    await saveTicketData(channel.guild.id, channel.id, ticketData);
    const messages = await channel.messages.fetch();
    const ticketMessage = messages.find(m => m.embeds.length > 0 && m.embeds[0].title?.startsWith('Ticket #'));
    if (ticketMessage) {
      const embed = ticketMessage.embeds[0];
      const claimedField = embed.fields?.find(f => f.name === 'Reclamado por' || f.name === 'Claimed By');
      if (claimedField) claimedField.value = claimer.toString();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_close').setLabel('Cerrar ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
        new ButtonBuilder().setCustomId('ticket_claim').setLabel('Reclamado').setStyle(ButtonStyle.Secondary).setEmoji('🙋').setDisabled(true),
        new ButtonBuilder().setCustomId('ticket_pin').setLabel('Fijar').setStyle(ButtonStyle.Secondary).setEmoji('📌')
      );
      await ticketMessage.edit({ embeds: [embed], components: [row] });
    }
    const claimEmbed = createEmbed({ title: 'Ticket reclamado', description: `🎉 ${claimer} reclamó este ticket.`, color: '#2ecc71' });
    const unclaimRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_unclaim').setLabel('Dejar de reclamar').setStyle(ButtonStyle.Secondary).setEmoji('🔓')
    );
    const claimStatusMessage = messages.find(m => m.embeds.length > 0 && ['Ticket reclamado', 'Ticket Claimed', 'Ticket sin reclamar', 'Ticket Unclaimed'].includes(m.embeds[0].title));
    if (claimStatusMessage) await claimStatusMessage.edit({ embeds: [claimEmbed], components: [unclaimRow] });
    else await channel.send({ embeds: [claimEmbed], components: [unclaimRow] });
    await logTicketEvent({ client: channel.client, guildId: channel.guild.id, event: { type: 'claim', ticketId: channel.id, ticketNumber: ticketData.id, userId: ticketData.userId, executorId: claimer.id, metadata: { claimedAt: ticketData.claimedAt } } }).catch(() => {});
    return { success: true, ticketData };
  } catch (error) {
    logger.error('Error claiming ticket:', { error: error.message });
    return { success: false, error: 'No se pudo reclamar el ticket. Intentá de nuevo.' };
  }
}

export async function reopenTicket(channel, reopener) {
  try {
    const ticketData = await getTicketData(channel.guild.id, channel.id);
    if (!ticketData) return { success: false, error: 'Este canal no es un ticket' };
    if (ticketData.status !== 'closed') return { success: false, error: 'Este ticket no está cerrado' };
    let config = {};
    try { config = await getGuildConfig(channel.client, channel.guild.id); } catch { config = {}; }
    const openCategoryId = config.ticketCategoryId || null;
    let movedToOpenCategory = false;
    let openCategoryMoveFailed = false;
    ticketData.status = 'open';
    ticketData.closedBy = null;
    ticketData.closedAt = null;
    ticketData.closeReason = null;
    await saveTicketData(channel.guild.id, channel.id, ticketData);
    if (openCategoryId && channel.parentId !== openCategoryId) {
      const openCategory = channel.guild.channels.cache.get(openCategoryId) || await channel.guild.channels.fetch(openCategoryId).catch(() => null);
      if (openCategory?.type === ChannelType.GuildCategory) {
        try { await channel.setParent(openCategoryId, { lockPermissions: false }); movedToOpenCategory = true; }
        catch (e) { openCategoryMoveFailed = true; logger.warn(e.message); }
      } else openCategoryMoveFailed = true;
    }
    try {
      const user = await channel.guild.members.fetch(ticketData.userId).catch(() => null);
      if (user) await channel.permissionOverwrites.create(user, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true, AttachFiles: true });
    } catch (e) { logger.warn(e.message); }
    const messages = await channel.messages.fetch();
    const ticketMessage = messages.find(m => m.embeds.length > 0 && m.embeds[0].title?.startsWith('Ticket #'));
    if (ticketMessage) {
      const embed = ticketMessage.embeds[0];
      const statusField = embed.fields?.find(f => f.name === 'Estado' || f.name === 'Status');
      if (statusField) statusField.value = '🟢 Abierto';
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_close').setLabel('Cerrar ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
        new ButtonBuilder().setCustomId('ticket_claim').setLabel(ticketData.claimedBy ? 'Reclamado' : 'Reclamar').setStyle(ticketData.claimedBy ? ButtonStyle.Secondary : ButtonStyle.Primary).setEmoji('🙋').setDisabled(!!ticketData.claimedBy),
        new ButtonBuilder().setCustomId('ticket_pin').setLabel('Fijar').setStyle(ButtonStyle.Secondary).setEmoji('📌')
      );
      await ticketMessage.edit({ embeds: [embed], components: [row] });
    }
    const reopenEmbed = createEmbed({ title: 'Ticket reabierto', description: `🔓 ${reopener} reabrió este ticket.`, color: '#2ecc71' });
    const closeStatusMessage = messages.find(m => m.embeds.length > 0 && (m.embeds[0].title === 'Ticket cerrado' || m.embeds[0].title === 'Ticket Closed') && m.components.length > 0 && m.components[0].components.some(c => c.customId === 'ticket_reopen'));
    if (closeStatusMessage) await closeStatusMessage.edit({ embeds: [reopenEmbed], components: [] });
    else await channel.send({ embeds: [reopenEmbed] });
    return { success: true, ticketData, movedToOpenCategory, openCategoryMoveFailed };
  } catch (error) {
    logger.error('Error reopening ticket:', { error: error.message });
    return { success: false, error: 'No se pudo reabrir el ticket. Intentá de nuevo.' };
  }
}

async function generateTranscript(channel) {
  try {
    const messages = [];
    let before = undefined;
    let batch;
    do {
      batch = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
      if (batch.size === 0) break;
      messages.push(...batch.values());
      before = batch.last()?.id;
    } while (batch.size === 100);
    messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const escape = (str) => String(str ?? '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
    const rows = messages.map((msg) => {
      const ts = new Date(msg.createdTimestamp).toISOString().replace('T', ' ').slice(0, 19);
      const author = escape(msg.author?.tag ?? msg.author?.username ?? 'Unknown');
      const content = escape(msg.content || (msg.embeds.length ? '[embed]' : '[attachment]'));
      return `<tr><td class="ts">${ts}</td><td class="author">${author}</td><td class="msg">${content}</td></tr>`;
    }).join('\n');
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Transcripción – #${escape(channel.name)}</title></head><body><h1>Transcripción – #${escape(channel.name)}</h1><p>${messages.length} mensaje(s)</p><table><thead><tr><th>Fecha</th><th>Autor</th><th>Mensaje</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    return new AttachmentBuilder(Buffer.from(html, 'utf8'), { name: `ticket-${channel.id}.html` });
  } catch (error) {
    logger.error('Failed to generate transcript:', { error: error.message });
    return null;
  }
}

export async function deleteTicket(channel, deleter) {
  try {
    const ticketData = await getTicketData(channel.guild.id, channel.id);
    if (!ticketData) return { success: false, error: 'Este canal no es un ticket' };
    const deleteEmbed = createEmbed({
      title: 'Ticket eliminado',
      description: `🗑️ Este ticket se eliminará de forma permanente en ${TICKET_DELETE_DELAY_SECONDS} segundos.`,
      color: '#e74c3c',
      footer: { text: `Ticket ID: ${ticketData.id}` }
    });
    await channel.send({ embeds: [deleteEmbed] });
    await logTicketEvent({ client: channel.client, guildId: channel.guild.id, event: { type: 'delete', ticketId: channel.id, ticketNumber: ticketData.id, userId: ticketData.userId, executorId: deleter.id, metadata: { deletedAt: new Date().toISOString() } } }).catch(() => {});
    setTimeout(async () => {
      try {
        let attachment = null;
        try { attachment = await generateTranscript(channel); } catch {}
        if (attachment) {
          try {
            const guildConfig = await getGuildConfig(channel.client, channel.guild.id);
            if (guildConfig.ticketTranscriptChannelId) {
              const transcriptChannel = await channel.client.channels.fetch(guildConfig.ticketTranscriptChannelId).catch(() => null);
              if (transcriptChannel?.isSendable?.()) {
                const transcriptEmbed = new EmbedBuilder().setTitle('📜 Transcripción del ticket').setDescription(`Transcripción del ticket #${ticketData.id}`).setColor('#3498db');
                await transcriptChannel.send({ embeds: [transcriptEmbed], files: [attachment] });
              }
            }
          } catch {}
        }
        await channel.delete('Ticket eliminado permanentemente');
      } catch (e) { logger.error('Error deleting ticket channel:', e.message); }
    }, TICKET_DELETE_DELAY_MS);
    return { success: true, ticketData };
  } catch (error) {
    logger.error('Error deleting ticket:', { error: error.message });
    return { success: false, error: 'No se pudo eliminar el ticket. Intentá de nuevo.' };
  }
}

export async function unclaimTicket(channel, unclaimer) {
  try {
    const ticketData = await getTicketData(channel.guild.id, channel.id);
    if (!ticketData) return { success: false, error: 'Este canal no es un ticket' };
    if (!ticketData.claimedBy) return { success: false, error: 'Este ticket no está reclamado' };
    if (ticketData.claimedBy !== unclaimer.id && !unclaimer.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return { success: false, error: 'Solo podés dejar de reclamar tus propios tickets o necesitás permiso de Gestionar canales.' };
    }
    const previousClaimer = ticketData.claimedBy;
    ticketData.claimedBy = null;
    ticketData.claimedAt = null;
    await saveTicketData(channel.guild.id, channel.id, ticketData);
    const messages = await channel.messages.fetch();
    const ticketMessage = messages.find(m => m.embeds.length > 0 && m.embeds[0].title?.startsWith('Ticket #'));
    if (ticketMessage) {
      const embed = ticketMessage.embeds[0];
      const claimedField = embed.fields?.find(f => f.name === 'Reclamado por' || f.name === 'Claimed By');
      if (claimedField) claimedField.value = 'Sin reclamar';
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_close').setLabel('Cerrar ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
        new ButtonBuilder().setCustomId('ticket_claim').setLabel('Reclamar').setStyle(ButtonStyle.Primary).setEmoji('🙋'),
        new ButtonBuilder().setCustomId('ticket_pin').setLabel('Fijar').setStyle(ButtonStyle.Secondary).setEmoji('📌')
      );
      await ticketMessage.edit({ embeds: [embed], components: [row] });
    }
    const unclaimEmbed = createEmbed({ title: 'Ticket sin reclamar', description: `🔓 ${unclaimer} dejó de reclamar este ticket.`, color: '#f39c12' });
    const claimMessage = messages.find(m => m.embeds.length > 0 && ['Ticket reclamado', 'Ticket Claimed', 'Ticket sin reclamar', 'Ticket Unclaimed'].includes(m.embeds[0].title));
    if (claimMessage) await claimMessage.edit({ embeds: [unclaimEmbed], components: [] });
    else await channel.send({ embeds: [unclaimEmbed] });
    await logTicketEvent({ client: channel.client, guildId: channel.guild.id, event: { type: 'unclaim', ticketId: channel.id, ticketNumber: ticketData.id, userId: ticketData.userId, executorId: unclaimer.id, metadata: { previousClaimer } } }).catch(() => {});
    return { success: true, ticketData };
  } catch (error) {
    logger.error('Error unclaiming ticket:', { error: error.message });
    return { success: false, error: 'No se pudo quitar el reclamo. Intentá de nuevo.' };
  }
}

async function getNextTicketNumber(guildId) {
  return await incrementTicketCounter(guildId);
}

export async function updateTicketPriority(channel, priority, updater) {
  try {
    const ticketData = await getTicketData(channel.guild.id, channel.id);
    if (!ticketData) return { success: false, error: 'Este canal no es un ticket' };
    const priorityInfo = PRIORITY_MAP[priority];
    if (!priorityInfo) return { success: false, error: 'Prioridad inválida' };
    ticketData.priority = priority;
    ticketData.priorityUpdatedBy = updater.id;
    ticketData.priorityUpdatedAt = new Date().toISOString();
    await saveTicketData(channel.guild.id, channel.id, ticketData);
    const updateEmbed = createEmbed({ title: 'Prioridad actualizada', description: `📊 Prioridad del ticket actualizada a **${priorityInfo.emoji} ${priorityInfo.label}** por ${updater}`, color: priorityInfo.color });
    await channel.send({ embeds: [updateEmbed] });
    return { success: true, ticketData };
  } catch (error) {
    return { success: false, error: 'No se pudo actualizar la prioridad. Intentá de nuevo.' };
  }
}
