import {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} from 'discord.js';
import { saveTicketData, incrementTicketCounter } from '../../utils/database.js';
import { logger } from '../../utils/logger.js';

const COLOR = 0xfb8b66;
const ROLE_STAFF = '1512120103771050005';

const TIPOS = {
    soporte_general: {
        label: 'Soporte general',
        reason: 'Soporte general — dudas, reglas, sesiones, economía, perks',
        formato:
            '```\n' +
            '1) Motivo / duda:\n' +
            '2) Detalle de lo que pasó:\n' +
            '3) Canal / sesión (si aplica):\n' +
            '4) Capturas o evidencia (si aplica):\n' +
            '```\n' +
            'Completá este formato en tu próximo mensaje.'
    },
    reportar_miembro: {
        label: 'Reportar miembro',
        reason: 'Reportar miembro (ciudadano)',
        formato:
            '```\n' +
            '1) Usuario reportado (mención o ID):\n' +
            '2) Regla(s) infringida(s):\n' +
            '3) Qué hizo / contexto:\n' +
            '4) Hora aproximada:\n' +
            '5) Canal o sesión:\n' +
            '6) Pruebas (capturas / clips):\n' +
            '```\n' +
            '**Sin pruebas es más difícil actuar.** Completá el formato.'
    },
    reportar_staff: {
        label: 'Reportar staff o host',
        reason: 'Reportar staff o host',
        formato:
            '```\n' +
            '1) Staff / host reportado (mención o ID):\n' +
            '2) Qué hizo mal (abuso, incumplimiento, etc.):\n' +
            '3) Fecha y contexto:\n' +
            '4) Pruebas (capturas / clips):\n' +
            '5) ¿Fue en Discord o en sesión?:\n' +
            '```\n' +
            'La revisión es **interna y seria**. Completá el formato.'
    },
    app_fotografo: {
        label: 'Aplicación fotógrafo',
        reason: 'Aplicación — Fotógrafo',
        formato:
            '```\n' +
            '1) Nombre / nick:\n' +
            '2) Experiencia en fotografía:\n' +
            '3) Ejemplos de trabajo (links o adjuntos):\n' +
            '4) Disponibilidad aproximada:\n' +
            '5) ¿Por qué querés unirte al equipo de media?:\n' +
            '```\n' +
            'Completá el formato para que podamos evaluar tu postulación.'
    },
    app_videografo: {
        label: 'Aplicación videógrafo',
        reason: 'Aplicación — Videógrafo',
        formato:
            '```\n' +
            '1) Nombre / nick:\n' +
            '2) Experiencia en videografía / edición:\n' +
            '3) Ejemplos de trabajo (links o adjuntos):\n' +
            '4) Disponibilidad aproximada:\n' +
            '5) ¿Por qué querés unirte al equipo de media?:\n' +
            '```\n' +
            'Completá el formato para que podamos evaluar tu postulación.'
    },
    staff_fastpass: {
        label: 'Staff FastPass',
        reason: 'Staff FastPass — postulación prioritaria',
        formato:
            '```\n' +
            '1) Nombre del servidor de experiencia:\n' +
            '2) Approx. de miembros (debe ser 1.000+):\n' +
            '3) Rol / cargo que tuviste:\n' +
            '4) Experiencia breve (moderación, host, etc.):\n' +
            '5) ¿Por qué querés staff en 00Y4n?:\n' +
            '6) Prueba adjunta (captura de roles / miembros):\n' +
            '```\n' +
            '**Requisito:** server de **más de 1.000 miembros** + prueba. Sin eso el ticket puede cerrarse.'
    }
};

export default {
    name: 'ticket_tipo',

    async execute(interaction, client, args = []) {
        const tipoKey = interaction.values?.[0];
        const tipo = TIPOS[tipoKey];

        if (!tipo) {
            return interaction.reply({
                content: '<:cruz00y4n:1534937767652495360> Tipo de ticket inválido.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            await interaction.guild.channels.fetch().catch(() => null);
            await interaction.guild.roles.fetch().catch(() => null);
        } catch {}

        const guild = interaction.guild;
        const member = interaction.member;
        const categoryId = args?.[0] && args[0] !== 'auto' ? args[0] : null;

        try {
            let category = null;
            if (categoryId) {
                const ch = guild.channels.cache.get(categoryId)
                    || await guild.channels.fetch(categoryId).catch(() => null);
                if (ch?.type === ChannelType.GuildCategory) category = ch;
            }
            if (!category) {
                category = guild.channels.cache.find(
                    c => c.type === ChannelType.GuildCategory
                        && /ticket|asistencia|soporte|support/i.test(c.name)
                ) || null;
            }

            let ticketNumber = String(Date.now()).slice(-4);
            try {
                ticketNumber = await incrementTicketCounter(guild.id);
            } catch (e) {
                logger.warn(`[ticket_tipo] contador: ${e?.message}`);
            }

            const channelName = `ticket-${ticketNumber}`.toLowerCase().slice(0, 100);

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
                }
            ];
            if (guild.roles.cache.has(ROLE_STAFF)) {
                overwrites.push({
                    id: ROLE_STAFF,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages,
                        PermissionFlagsBits.EmbedLinks
                    ]
                });
            }
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
                    reason: `Ticket 00Y4n: ${tipo.label} — ${member.user.tag}`
                });
            } catch (err1) {
                logger.warn(`[ticket_tipo] create con parent falló: ${err1.message}`);
                channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    permissionOverwrites: overwrites,
                    reason: `Ticket 00Y4n (sin categoría): ${tipo.label}`
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
                tipo: tipoKey
            };
            await saveTicketData(guild.id, channel.id, ticketData).catch((e) => {
                logger.warn(`[ticket_tipo] saveTicketData: ${e.message}`);
            });

            const embedMain = new EmbedBuilder()
                .setColor(COLOR)
                .setTitle(`Ticket #${ticketNumber} — ${tipo.label}`)
                .setDescription(
                    `${member}, gracias por abrir un ticket.\n\n**Motivo:** ${tipo.reason}`
                )
                .addFields(
                    { name: 'Estado', value: '🟢 Abierto', inline: true },
                    { name: 'Reclamado por', value: 'Sin reclamar', inline: true },
                    { name: 'Creado', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                )
                .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' })
                .setTimestamp();

            const embedInstrucciones = new EmbedBuilder()
                .setColor(COLOR)
                .setTitle(`Formato a completar — ${tipo.label}`)
                .setDescription(
                    tipo.formato +
                    '\n\n-# El staff fue notificado. Respondé acá; no abras otro ticket por lo mismo.'
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_close')
                    .setLabel('Cerrar ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒'),
                new ButtonBuilder()
                    .setCustomId('ticket_claim')
                    .setLabel('Reclamar')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🙋')
            );

            const staffMention = guild.roles.cache.has(ROLE_STAFF) ? ` <@&${ROLE_STAFF}>` : '';

            const msg = await channel.send({
                content: `${member}${staffMention}`,
                embeds: [embedMain, embedInstrucciones],
                components: [row]
            });
            await msg.pin().catch(() => null);

            return interaction.editReply({
                content: `<:tilde:1534937809733812286> Ticket creado: ${channel}`
            });
        } catch (err) {
            logger.error('[ticket_tipo] Error:', err);
            const detail = err?.rawError?.message || err?.message || 'error desconocido';
            return interaction.editReply({
                content:
                    `<:cruz00y4n:1534937767652495360> No se pudo crear el ticket: **${detail}**\n` +
                    `-# Revisá que el bot tenga permiso **Gestionar canales** y **Ver canales** en la categoría de tickets.`
            });
        }
    }
};
