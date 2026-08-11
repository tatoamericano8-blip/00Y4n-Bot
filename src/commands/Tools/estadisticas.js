import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} from 'discord.js';
import {
  getServerCounters,
  saveServerCounters,
  updateCounter,
  getGuildCounterStats,
  getCounterCount,
  formatCounterChannelName,
  NAME_FORMAT_DEFAULT
} from '../../services/serverstatsService.js';

const GUILD_OBJETIVO = '1451939725308067842';
const CATEGORY_NAME = '゛◟🌴﹒00Y4n › Estadísticas◞';
const NAME_FORMAT = NAME_FORMAT_DEFAULT;

const TIPOS_DEFAULT = ['members', 'members_only'];

function puedeGestionar(member) {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  );
}

function idUnico(tipo) {
  return tipo + '_' + Date.now().toString(36);
}

export default {
  data: new SlashCommandBuilder()
    .setName('estadisticas')
    .setDescription('Contadores automaticos de miembros (estilo canal de estadisticas).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sc) =>
      sc
        .setName('crear')
        .setDescription('Crea la categoria de estadisticas y los canales contador (totales + humanos).')
    )
    .addSubcommand((sc) =>
      sc.setName('actualizar').setDescription('Fuerza la actualizacion de todos los contadores del servidor.')
    )
    .addSubcommand((sc) =>
      sc
        .setName('quitar')
        .setDescription('Elimina los canales contador y deja de actualizarlos.')
        .addBooleanOption((o) =>
          o
            .setName('borrar_canales')
            .setDescription('Si es true, tambien borra los canales/categoria creados.')
            .setRequired(false)
        )
    )
    .addSubcommand((sc) =>
      sc.setName('estado').setDescription('Muestra el estado actual de los contadores.')
    ),

  async execute(interaction) {
    if (!puedeGestionar(interaction.member)) {
      return interaction.reply({
        content: 'Necesitas permiso de Gestionar canales o Administrador.',
        ephemeral: true
      });
    }

    if (interaction.guildId !== GUILD_OBJETIVO) {
      console.log('[estadisticas] guild=' + interaction.guildId + ' objetivo=' + GUILD_OBJETIVO);
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    try {
      if (sub === 'crear') return await subCrear(interaction);
      if (sub === 'actualizar') return await subActualizar(interaction);
      if (sub === 'quitar') return await subQuitar(interaction);
      if (sub === 'estado') return await subEstado(interaction);
    } catch (err) {
      console.error('[estadisticas]', err);
      return interaction.editReply({
        content: 'Error: ' + String(err && err.message ? err.message : err).slice(0, 200)
      });
    }
  }
};

async function subCrear(interaction) {
  const guild = interaction.guild;
  const me = guild.members.me;

  if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.editReply({
      content: 'El bot necesita permiso Gestionar canales para crear la categoria y los contadores.'
    });
  }

  const counters = await getServerCounters(interaction.client, guild.id);
  const activos = [];
  for (const c of counters) {
    const ch = guild.channels.cache.get(c.channelId);
    if (ch) activos.push(c);
  }
  if (activos.length > 0) {
    return interaction.editReply({
      content:
        'Ya hay ' +
        activos.length +
        ' contador(es) activo(s). Usa /estadisticas quitar antes de crear de nuevo, o /estadisticas actualizar.'
    });
  }

  const category = await guild.channels.create({
    name: CATEGORY_NAME,
    type: ChannelType.GuildCategory,
    reason: 'Contadores de estadisticas 00Y4n',
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages]
      },
      {
        id: me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.Connect
        ]
      }
    ]
  });

  try {
    await category.setPosition(0);
  } catch (e) {
    /* position opcional */
  }

  const creados = [];
  const nuevosCounters = [];

  for (const tipo of TIPOS_DEFAULT) {
    const count = await getCounterCount(guild, tipo);
    const channelName = formatCounterChannelName(tipo, count, NAME_FORMAT);

    const voice = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      parent: category.id,
      reason: 'Contador automatico: ' + tipo,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.Connect],
          allow: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: me.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.Connect
          ]
        }
      ]
    });

    const entry = {
      id: idUnico(tipo),
      type: tipo,
      channelId: voice.id,
      guildId: guild.id,
      categoryId: category.id,
      nameFormat: NAME_FORMAT,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    nuevosCounters.push(entry);
    creados.push('• <#' + voice.id + '> (' + tipo + ')');
  }

  await saveServerCounters(interaction.client, guild.id, nuevosCounters);

  for (const c of nuevosCounters) {
    await updateCounter(interaction.client, guild, c);
  }

  const stats = await getGuildCounterStats(guild);

  const embed = new EmbedBuilder()
    .setColor(0x74d4fc)
    .setTitle('Estadisticas creadas')
    .setDescription(
      'Categoria: **' +
        CATEGORY_NAME +
        '**\n\n' +
        creados.join('\n') +
        '\n\nLos nombres se actualizan solos cuando alguien entra o se va.\n' +
        '*(Discord puede tardar unos minutos si hay muchos cambios seguidos.)*'
    )
    .addFields(
      {
        name: 'Miembros totales',
        value: '`' + stats.totalCount.toLocaleString('es-AR') + '`',
        inline: true
      },
      {
        name: 'Humanos',
        value: '`' + stats.humanCount.toLocaleString('es-AR') + '`',
        inline: true
      },
      {
        name: 'Bots',
        value: '`' + stats.botCount.toLocaleString('es-AR') + '`',
        inline: true
      }
    )
    .setFooter({ text: '00Y4n · Contadores automaticos' })
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}

async function subActualizar(interaction) {
  const guild = interaction.guild;
  const counters = await getServerCounters(interaction.client, guild.id);

  if (!counters.length) {
    return interaction.editReply({
      content: 'No hay contadores configurados. Usa /estadisticas crear.'
    });
  }

  let ok = 0;
  let fail = 0;
  for (const c of counters) {
    const r = await updateCounter(interaction.client, guild, c);
    if (r) ok++;
    else fail++;
  }

  const stats = await getGuildCounterStats(guild);
  return interaction.editReply({
    content:
      'Actualizados: **' +
      ok +
      '**' +
      (fail ? ' · Fallidos: **' + fail + '**' : '') +
      '\nTotales: **' +
      stats.totalCount.toLocaleString('es-AR') +
      '** · Humanos: **' +
      stats.humanCount.toLocaleString('es-AR') +
      '**'
  });
}

async function subQuitar(interaction) {
  const guild = interaction.guild;
  const borrar = interaction.options.getBoolean('borrar_canales');
  const debeBorrar = borrar === null || borrar === undefined ? true : borrar;
  const counters = await getServerCounters(interaction.client, guild.id);

  if (!counters.length) {
    return interaction.editReply({ content: 'No hay contadores para quitar.' });
  }

  const categoryIds = new Set();
  if (debeBorrar) {
    for (const c of counters) {
      const ch = guild.channels.cache.get(c.channelId);
      if (ch) {
        if (ch.parentId) categoryIds.add(ch.parentId);
        await ch.delete('Contador de estadisticas eliminado').catch(function () {
          return null;
        });
      }
      if (c.categoryId) categoryIds.add(c.categoryId);
    }
    for (const catId of categoryIds) {
      const cat = guild.channels.cache.get(catId);
      if (cat && cat.type === ChannelType.GuildCategory) {
        const hijos = guild.channels.cache.filter(function (c) {
          return c.parentId === catId;
        });
        if (hijos.size === 0) {
          await cat.delete('Categoria de estadisticas vacia').catch(function () {
            return null;
          });
        }
      }
    }
  }

  await saveServerCounters(interaction.client, guild.id, []);
  return interaction.editReply({
    content: debeBorrar
      ? 'Contadores desactivados y canales/categoria eliminados.'
      : 'Contadores desactivados (los canales se dejaron en el servidor).'
  });
}

async function subEstado(interaction) {
  const guild = interaction.guild;
  const counters = await getServerCounters(interaction.client, guild.id);
  const stats = await getGuildCounterStats(guild);

  if (!counters.length) {
    return interaction.editReply({
      content:
        'Sin contadores activos.\nMiembros ahora: **' +
        stats.totalCount.toLocaleString('es-AR') +
        '** (humanos: **' +
        stats.humanCount.toLocaleString('es-AR') +
        '**).'
    });
  }

  const lines = counters.map(function (c) {
    const ch = guild.channels.cache.get(c.channelId);
    return (
      '• `' +
      c.type +
      '` → ' +
      (ch ? '<#' + ch.id + '>' : 'canal borrado') +
      ' · enabled=' +
      (c.enabled !== false)
    );
  });

  return interaction.editReply({
    content:
      '**Contadores (' +
      counters.length +
      ')**\n' +
      lines.join('\n') +
      '\n\nTotales: **' +
      stats.totalCount.toLocaleString('es-AR') +
      '** · Humanos: **' +
      stats.humanCount.toLocaleString('es-AR') +
      '** · Bots: **' +
      stats.botCount.toLocaleString('es-AR') +
      '**'
  });
}
