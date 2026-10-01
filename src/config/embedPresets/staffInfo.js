import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E, EMOJI_DEF } from '../emojis.js';

function optEmoji(key) {
  const d = EMOJI_DEF[key];
  if (!d?.id) return undefined;
  return { id: d.id, name: d.name, animated: !!d.animated };
}

export default {
  id: 'staff_info',
  label: 'Staff Información',
  description: 'Manual rápido Staff / Bajo Comando',

  build() {
    const main = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle('Southwest Florida 00Y4n - __Staff Información__')
      .setDescription(
        `Guía rápida para **00Y4n** Staff / Bajo Comando.\n` +
          `*Elegí una sección en el menú.*\n\n` +
          `-# Ante la duda: chat-staff antes de improvisar.`
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId('embed_staff_info_menu')
      .setPlaceholder('Manual de Staff 00Y4n')
      .addOptions(
        { label: 'Sesiones', value: 'sesiones', emoji: optEmoji('auto') },
        { label: 'Moderación', value: 'moderacion', emoji: optEmoji('warn') },
        { label: 'Cuotas', value: 'cuotas', emoji: optEmoji('tilde') },
        { label: 'Conducta y escalamiento', value: 'conducta', emoji: optEmoji('msj') },
        { label: 'Comandos de SWFL', value: 'comandos_swfl', emoji: optEmoji('manual') },
        { label: 'Roles staff', value: 'roles_staff', emoji: optEmoji('staff') }
      );

    return {
      embeds: [main],
      components: [new ActionRowBuilder().addComponents(menu)]
    };
  }
};
