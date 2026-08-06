import { EmbedBuilder, ChannelType } from 'discord.js';

/** Canal de logs de comandos del bot */
export const CANAL_LOGS_COMANDOS = '1451959498049851493';

function formatearOpciones(options, prefix = '') {
  if (!Array.isArray(options) || options.length === 0) return [];

  const lineas = [];
  for (const opt of options) {
    const nombre = prefix ? `${prefix} ${opt.name}` : opt.name;

    if (opt.type === 1 || opt.type === 2) {
      lineas.push(`> **${opt.type === 2 ? 'Grupo' : 'Subcomando'}:** \`${opt.name}\`);
      if (opt.options?.length) {
        lineas.push(...formatearOpciones(opt.options, opt.name));
      }
      continue;
    }

    let valor = opt.value;
    if (valor === undefined || valor === null) {
      valor = '—';
    } else if (typeof valor === 'string' && /^\d{17,20}$/.test(valor)) {
      valor = `\`${valor}\`;
    } else {
      valor = String(valor);
      if (valor.length > 200) valor = valor.slice(0, 197) + '...';
      valor = `\`${valor.replace(/`/g, "'")}\`;
    }

    lineas.push(`> **${nombre}:** ${valor}`);
  }
  return lineas;
}

/**
 * Envía un registro al canal de logs de comandos.
 * Nunca rompe la ejecución del comando si el log falla.
 */
export async function logComandoUsado(client, interaction, estado = {}) {
  const { ok = true, error = null } = estado;

  try {
    if (!client || !interaction?.commandName) return;

    const channel =
      client.channels.cache.get(CANAL_LOGS_COMANDOS) ||
      (await client.channels.fetch(CANAL_LOGS_COMANDOS).catch(() => null));

    if (
      !channel ||
      (channel.type !== ChannelType.GuildText &&
        channel.type !== ChannelType.GuildAnnouncement)
    ) {
      return;
    }

    const opciones = formatearOpciones(interaction.options?.data || []);
    const opcionesTexto =
      opciones.length > 0 ? opciones.join('\n') : '> *Sin opciones*';

    const embed = new EmbedBuilder()
      .setColor(ok ? '#74d4fc' : '#ed4245')
      .setTitle(ok ? '📋 Comando utilizado' : '⚠️ Comando con error')
      .setDescription(
        `> **Comando:** \`/${interaction.commandName}\`\n` +
          `> **Usuario:** <@${interaction.user.id}> (\`${interaction.user.tag}\`)\n` +
          `> **ID:** \`${interaction.user.id}\`\n` +
          `> **Canal:** ${interaction.channelId ? `<#${interaction.channelId}>` : 'DM'}\n` +
          `> **Servidor:** ${interaction.guild?.name || 'DM'} (\`${interaction.guildId || '—'}\`)`
      )
      .addFields({
        name: 'Opciones',
        value: opcionesTexto.slice(0, 1024) || '> *Sin opciones*'
      })
      .setTimestamp();

    if (!ok && error) {
      const msg = String(error?.userMessage || error?.message || error).slice(0, 500);
      embed.addFields({
        name: 'Error',
        value: `\`\`\`\n${msg}\n\`\`\``
      });
    }

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[logComandoUsado] No se pudo enviar el log:', err?.message || err);
  }
}

export default logComandoUsado;
