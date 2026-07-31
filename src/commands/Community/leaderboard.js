import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { logger } from '../../utils/logger.js';
import { getColor } from '../../config/bot.js';
import { getFromDb } from '../../utils/database.js';

const LEADERBOARD_CATEGORIES = {
  economy: {
    name: '💰 Economía',
    description: 'Balance más alto de monedas',
    emoji: '💰',
    icon: '💸',
    fetch: async (client, guildId) => {
      const prefix = `guild:${guildId}:economy:`;
      let keys = await client.db.list(prefix);

      if (!Array.isArray(keys)) {
        if (typeof keys === 'object' && keys !== null) {
          keys = Object.keys(keys).filter(key => key.startsWith(prefix));
        } else {
          return [];
        }
      }

      const userDataPromises = keys.map(async (key) => {
        try {
          const userId = key.replace(prefix, '');
          const data = await client.db.get(key);
          if (!data) return null;

          return {
            userId,
            value: data.wallet || 0,
            displayValue: `$${(data.wallet || 0).toLocaleString()}`,
            secondary: `Banco: $${(data.bank || 0).toLocaleString()}`,
          };
        } catch (error) {
          logger.debug(`Error processing economy leaderboard key ${key}:`, error);
          return null;
        }
      });

      const userData = (await Promise.all(userDataPromises)).filter(Boolean);
      userData.sort((a, b) => b.value - a.value);
      return userData;
    },
  },

  reactions: {
    name: '😊 Reacciones',
    description: 'Mayor cantidad de reacciones en mensajes',
    emoji: '😊',
    icon: '👍',
    fetch: async (client, guildId) => {
      const prefix = `guild:${guildId}:reactions:`;
      let keys = await client.db.list(prefix);

      if (!Array.isArray(keys)) {
        if (typeof keys === 'object' && keys !== null) {
          keys = Object.keys(keys).filter(key => key.startsWith(prefix));
        } else {
          return [];
        }
      }

      const userDataPromises = keys.map(async (key) => {
        try {
          const userId = key.replace(prefix, '');
          const data = await client.db.get(key);
          if (!data) return null;

          return {
            userId,
            value: data.totalReactions || 0,
            displayValue: `${(data.totalReactions || 0).toLocaleString()} reacciones`,
          };
        } catch (error) {
          logger.debug(`Error processing reactions leaderboard key ${key}:`, error);
          return null;
        }
      });

      const userData = (await Promise.all(userDataPromises)).filter(Boolean);
      userData.sort((a, b) => b.value - a.value);
      return userData;
    },
  },

  messages: {
    name: '💬 Mensajes',
    description: 'Mayor cantidad de mensajes enviados',
    emoji: '💬',
    icon: '📝',
    fetch: async (client, guildId) => {
      const prefix = `guild:${guildId}:messages:`;
      let keys = await client.db.list(prefix);

      if (!Array.isArray(keys)) {
        if (typeof keys === 'object' && keys !== null) {
          keys = Object.keys(keys).filter(key => key.startsWith(prefix));
        } else {
          return [];
        }
      }

      const userDataPromises = keys.map(async (key) => {
        try {
          const userId = key.replace(prefix, '');
          const data = await client.db.get(key);
          if (!data) return null;

          return {
            userId,
            value: data.messageCount || 0,
            displayValue: `${(data.messageCount || 0).toLocaleString()} mensajes`,
          };
        } catch (error) {
          logger.debug(`Error processing messages leaderboard key ${key}:`, error);
          return null;
        }
      });

      const userData = (await Promise.all(userDataPromises)).filter(Boolean);
      userData.sort((a, b) => b.value - a.value);
      return userData;
    },
  },

  warnings: {
    name: '⚠️ Advertencias',
    description: 'Mayor cantidad de advertencias (ascendente)',
    emoji: '⚠️',
    icon: '🚨',
    fetch: async (client, guildId) => {
      const prefix = `guild:${guildId}:warnings:`;
      let keys = await client.db.list(prefix);

      if (!Array.isArray(keys)) {
        if (typeof keys === 'object' && keys !== null) {
          keys = Object.keys(keys).filter(key => key.startsWith(prefix));
        } else {
          return [];
        }
      }

      const userDataPromises = keys.map(async (key) => {
        try {
          const userId = key.replace(prefix, '');
          const data = await client.db.get(key);
          if (!data) return null;

          return {
            userId,
            value: data.count || 0,
            displayValue: `${(data.count || 0).toLocaleString()} advertencias`,
          };
        } catch (error) {
          logger.debug(`Error processing warnings leaderboard key ${key}:`, error);
          return null;
        }
      });

      const userData = (await Promise.all(userDataPromises)).filter(Boolean);
      userData.sort((a, b) => b.value - a.value);
      return userData;
    },
  },

  xp: {
    name: '⭐ Experiencia (XP)',
    description: 'Mayor cantidad de puntos de experiencia',
    emoji: '⭐',
    icon: '✨',
    fetch: async (client, guildId) => {
      const prefix = `guild:${guildId}:leveling:users:`;
      let keys = await client.db.list(prefix);

      if (!Array.isArray(keys)) {
        if (typeof keys === 'object' && keys !== null) {
          keys = Object.keys(keys).filter(key => key.startsWith(prefix));
        } else {
          return [];
        }
      }

      const userDataPromises = keys.map(async (key) => {
        try {
          const userId = key.replace(prefix, '');
          const data = await client.db.get(key);
          if (!data) return null;

          return {
            userId,
            value: data.totalXp || 0,
            displayValue: `${(data.totalXp || 0).toLocaleString()} XP`,
            secondary: `Nivel ${data.level || 0}`,
          };
        } catch (error) {
          logger.debug(`Error processing xp leaderboard key ${key}:`, error);
          return null;
        }
      });

      const userData = (await Promise.all(userDataPromises)).filter(Boolean);
      userData.sort((a, b) => b.value - a.value);
      return userData;
    },
  },
};

async function createLeaderboardEmbed(category, leaderboardData, guildName) {
  const categoryInfo = LEADERBOARD_CATEGORIES[category];
  if (!categoryInfo) return null;

  const embed = new EmbedBuilder()
    .setTitle(`${categoryInfo.emoji} ${categoryInfo.name}`)
    .setDescription(
      leaderboardData.length > 0
        ? `Top 10 de ${guildName}`
        : 'No hay datos disponibles aún'
    )
    .setColor(getColor('primary'))
    .setTimestamp();

  if (leaderboardData.length === 0) {
    return embed;
  }

  const fields = leaderboardData.slice(0, 10).map((entry, index) => {
    const medal =
      index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}️⃣`;

    let value = `${entry.displayValue}`;
    if (entry.secondary) {
      value += ` | ${entry.secondary}`;
    }

    return {
      name: `${medal} <@${entry.userId}>`,
      value: value,
      inline: false,
    };
  });

  embed.addFields(fields);

  return embed;
}

async function handleLeaderboardInteraction(
  interaction,
  category,
  client,
  guildId
) {
  await interaction.deferUpdate();

  try {
    const leaderboardData = await LEADERBOARD_CATEGORIES[category].fetch(
      client,
      guildId
    );
    const embed = await createLeaderboardEmbed(
      category,
      leaderboardData,
      interaction.guild.name
    );

    const row = createSelectMenu(category);
    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  } catch (error) {
    logger.error(`Error loading leaderboard category ${category}:`, error);
    await interaction.editReply({
      content:
        '❌ Hubo un error al cargar la categoría. Por favor, intenta nuevamente.',
      components: [],
    });
  }
}

function createSelectMenu(currentCategory = 'economy') {
  const options = Object.entries(LEADERBOARD_CATEGORIES).map(([key, info]) => ({
    label: info.name,
    value: key,
    emoji: info.icon,
    default: key === currentCategory,
  }));

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('leaderboard_category')
      .setPlaceholder('Selecciona una categoría...')
      .addOptions(options)
  );
}

export const data = new SlashCommandBuilder()
  .setName('tabla-posiciones')
  .setDescription('Muestra la tabla de posiciones del servidor')
  .addStringOption((option) =>
    option
      .setName('categoría')
      .setDescription('Selecciona la categoría a ver')
      .setRequired(false)
      .addChoices(
        { name: '💰 Economía', value: 'economy' },
        { name: '😊 Reacciones', value: 'reactions' },
        { name: '💬 Mensajes', value: 'messages' },
        { name: '⚠️ Advertencias', value: 'warnings' },
        { name: '⭐ Experiencia', value: 'xp' }
      )
  );

export async function execute(interaction) {
  try {
    await interaction.deferReply();

    const guildId = interaction.guildId;
    const categoryOption = interaction.options.getString('categoría') || 'economy';

    if (!LEADERBOARD_CATEGORIES[categoryOption]) {
      return await interaction.editReply({
        content: '❌ Categoría inválida. Por favor, selecciona una categoría válida.',
      });
    }

    const leaderboardData = await LEADERBOARD_CATEGORIES[categoryOption].fetch(
      interaction.client,
      guildId
    );

    const embed = await createLeaderboardEmbed(
      categoryOption,
      leaderboardData,
      interaction.guild.name
    );

    const row = createSelectMenu(categoryOption);

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) => i.customId === 'leaderboard_category' && i.user.id === interaction.user.id,
      time: 60000,
    });

    collector.on('collect', async (i) => {
      const selectedCategory = i.values[0];
      await handleLeaderboardInteraction(i, selectedCategory, interaction.client, guildId);
    });

    collector.on('end', () => {
      interaction.editReply({
        components: [],
      }).catch(() => {});
    });
  } catch (error) {
    logger.error('Error in leaderboard command:', error);
    await interaction.editReply({
      content:
        '❌ Hubo un error al cargar la tabla de posiciones. Por favor, intenta nuevamente.',
    });
  }
}
