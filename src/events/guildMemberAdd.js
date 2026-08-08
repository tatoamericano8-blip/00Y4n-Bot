import { Events, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getColor } from '../config/bot.js';
import { getGuildConfig } from '../services/guildConfig.js';
import { getWelcomeConfig } from '../utils/database.js';
import { formatWelcomeMessage } from '../utils/welcome.js';
import { logEvent, EVENT_TYPES } from '../services/loggingService.js';
import { getServerCounters, updateCounter } from '../services/serverstatsService.js';
import { setBirthday as dbSetBirthday } from '../utils/database.js';
import { logger } from '../utils/logger.js';
import { PRIMARIO } from '../utils/colores.js';

/** Bienvenida personalizada 00Y4n (Southwest Florida) */
const GUILD_00Y4N = '1451939725308067842';
const CHANNEL_BIENVENIDA = '1451942119827570830';
const IMAGEN_BIENVENIDA =
    'https://cdn.discordapp.com/attachments/1451942179877687399/1535772044321624185/Bienvenida_1.png';

export default {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member) {
    try {
        const { guild, user } = member;

        const config = await getGuildConfig(member.client, guild.id);
        const welcomeConfig = await getWelcomeConfig(member.client, guild.id);

        // 00Y4n: siempre canal fijo. Otros guilds: config del bot.
        const welcomeChannelId =
            guild.id === GUILD_00Y4N
                ? CHANNEL_BIENVENIDA
                : (welcomeConfig?.enabled ? welcomeConfig?.channelId : null);

        if (welcomeChannelId) {
            const channel =
                guild.channels.cache.get(welcomeChannelId) ||
                (await guild.channels.fetch(welcomeChannelId).catch(() => null));

            if (channel?.isTextBased?.()) {
                const me = guild.members.me;
                const permissions = me ? channel.permissionsFor(me) : null;
                if (permissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
                    const canEmbed = permissions.has(PermissionFlagsBits.EmbedLinks);
                    const messageContent = user.toString();

                    if (guild.id === GUILD_00Y4N && canEmbed) {
                        const embedBienvenida = new EmbedBuilder()
                            .setColor(PRIMARIO)
                            .setTitle('__Bienvenido/a a Southwest Florida Comunidad 00Y4n ™__')
                            .setDescription(
                                `Bienvenido/a a **Southwest Florida Comunidad 00Y4n ™**.\n\n` +
                                `Para convertirte en ciudadano y obtener acceso al servidor, verifica tu cuenta en <#1512614400413139045> y lee las **Reglas** y las **Directrices** del servidor.\n\n` +
                                `-# **¿Necesitas ayuda?** Contacta a un miembro de __Alto Comando__ y te asistirán.`
                            )
                            .setImage(IMAGEN_BIENVENIDA)
                            .setTimestamp();

                        await channel.send({
                            content: messageContent,
                            embeds: [embedBienvenida]
                        });
                    } else if (guild.id === GUILD_00Y4N && !canEmbed) {
                        await channel.send({
                            content:
                                messageContent +
                                '\nBienvenido/a a **Southwest Florida Comunidad 00Y4n ™**. Verifica tu cuenta y lee las reglas del servidor.'
                        });
                    } else if (welcomeConfig?.enabled && canEmbed) {
                        const formatData = { user, guild, member };
                        const welcomeMessage = formatWelcomeMessage(
                            welcomeConfig.welcomeMessage || welcomeConfig.welcomeEmbed?.description || 'Welcome {user} to {server}!',
                            formatData
                        );
                        const embedTitle = formatWelcomeMessage(
                            welcomeConfig.welcomeEmbed?.title || 'Welcome!',
                            formatData
                        );
                        const embedFooter = welcomeConfig.welcomeEmbed?.footer
                            ? formatWelcomeMessage(welcomeConfig.welcomeEmbed.footer, formatData)
                            : `Welcome to ${guild.name}!`;

                        const embed = new EmbedBuilder()
                            .setColor(welcomeConfig.welcomeEmbed?.color || getColor('success'))
                            .setTitle(embedTitle)
                            .setDescription(welcomeMessage)
                            .setThumbnail(user.displayAvatarURL())
                            .addFields(
                                { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                                { name: 'Member Count', value: guild.memberCount.toString(), inline: true }
                            )
                            .setTimestamp()
                            .setFooter({ text: embedFooter });

                        if (welcomeConfig.welcomeImage) {
                            embed.setImage(welcomeConfig.welcomeImage);
                        } else if (welcomeConfig.welcomeEmbed?.image?.url) {
                            embed.setImage(welcomeConfig.welcomeEmbed.image.url);
                        }

                        await channel.send({
                            content: welcomeConfig.welcomePing ? messageContent : null,
                            embeds: [embed]
                        });
                    }
                }
            }
        }

        if (welcomeConfig?.roleIds && welcomeConfig.roleIds.length > 0) {
            const delay = welcomeConfig.autoRoleDelay || 0;
            const singleRoleId = welcomeConfig.roleIds[0];

            if (delay > 0) {
                const timeout = setTimeout(async () => {
                    const role = guild.roles.cache.get(singleRoleId);
                    if (role) await assignRoleSafely(member, role);
                }, delay * 1000);
                if (typeof timeout.unref === 'function') timeout.unref();
            } else {
                const role = guild.roles.cache.get(singleRoleId);
                if (role) await assignRoleSafely(member, role);
            }
        }

        if (config?.verification?.enabled || config?.verification?.autoVerify?.enabled) {
            await handleVerification(member, guild, config.verification, member.client);
        }

        try {
            await logEvent({
                client: member.client,
                guildId: guild.id,
                eventType: EVENT_TYPES.MEMBER_JOIN,
                data: {
                    description: `${user.tag} joined the server`,
                    userId: user.id,
                    fields: [
                        { name: 'Member', value: `${user.tag} (${user.id})`, inline: true },
                        { name: 'Member Count', value: guild.memberCount.toString(), inline: true },
                        {
                            name: 'Account Created',
                            value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
                            inline: true
                        }
                    ]
                }
            });
        } catch (error) {
            logger.debug('Error logging member join:', error);
        }

        try {
            const counters = await getServerCounters(member.client, guild.id);
            for (const counter of counters) {
                if (counter && counter.type && counter.channelId && counter.enabled !== false) {
                    await updateCounter(member.client, guild, counter);
                }
            }
        } catch (error) {
            logger.debug('Error updating counters on member join:', error);
        }

        try {
            const backupKey = `guild:${guild.id}:birthdays:left`;
            const backup = (await member.client.db.get(backupKey)) || {};
            if (backup[user.id]) {
                const { month, day } = backup[user.id];
                await dbSetBirthday(member.client, guild.id, user.id, month, day);
                delete backup[user.id];
                await member.client.db.set(backupKey, backup);
                logger.debug(`Birthday restored for user ${user.id} in guild ${guild.id}`);
            }
        } catch (error) {
            logger.debug('Error restoring birthday on member join:', error);
        }
    } catch (error) {
        logger.error('Error in guildMemberAdd event:', error);
    }
  }
};

async function handleVerification(member, guild, verificationConfig, client) {
    const { autoVerifyOnJoin } = await import('../services/verificationService.js');

    try {
        const result = await autoVerifyOnJoin(client, guild, member, verificationConfig);

        if (result.autoVerified) {
            logger.info('User auto-verified on join', {
                guildId: guild.id,
                userId: member.id,
                userTag: member.user.tag,
                roleName: result.roleName,
                criteria: result.criteria
            });
        } else {
            logger.debug('User not auto-verified on join', {
                guildId: guild.id,
                userId: member.id,
                reason: result.reason
            });
        }
    } catch (error) {
        logger.error('Error in auto-verification for member', {
            guildId: guild.id,
            userId: member.id,
            userTag: member.user.tag,
            error: error.message
        });
    }
}

async function assignRoleSafely(member, role) {
    try {
        await member.roles.add(role);
    } catch (error) {
        logger.warn(`Failed to assign role ${role.id} to member ${member.id}:`, error);
    }
}
