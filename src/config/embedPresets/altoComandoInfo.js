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
  id: 'alto_comando_info',
  label: 'Alto Comando Información',
  description: 'Manual completo para Alto Comando / liderazgo staff',

  build() {
    const main = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle('Southwest Florida 00Y4n — __Alto Comando Información__')
      .setDescription(
        [
          `${E.staff || E.corona || E.manual} Guía para **Alto Comando** y roles de liderazgo.`,
          `*Elegí una sección en el menú.*`,
          '',
          `${E.dot} Esto aplica **dentro y fuera** del servidor: Discord, sesiones en Roblox y representación de 00Y4n.`,
          `${E.dot} Ante la duda: consultá con **Equipo de Propietarios / Gerencia** antes de improvisar.`
        ].join('\n')
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId('embed_alto_comando_menu')
      .setPlaceholder('Manual Alto Comando 00Y4n')
      .addOptions(
        {
          label: 'Qué es Alto Comando',
          value: 'que_es',
          description: 'Rol, alcance y mentalidad',
          emoji: optEmoji('staff')
        },
        {
          label: 'Roles y autoridad',
          value: 'roles',
          description: 'Jerarquía desde Propietarios hasta AC',
          emoji: optEmoji('corona')
        },
        {
          label: 'Obligaciones y cuota',
          value: 'obligaciones',
          description: 'Actividad, sesiones y tickets',
          emoji: optEmoji('tilde')
        },
        {
          label: 'Supervisión de sesiones',
          value: 'supervision',
          description: 'Cómo supervisar y dejar rating',
          emoji: optEmoji('manual')
        },
        {
          label: 'Gestión del Bajo Comando',
          value: 'gestion_bc',
          description: 'Guiar, corregir y respaldar staff',
          emoji: optEmoji('msj')
        },
        {
          label: 'Casos serios y moderación',
          value: 'casos',
          description: 'Investigaciones, sanciones, escalado',
          emoji: optEmoji('warn')
        },
        {
          label: 'Conducta y confidencialidad',
          value: 'conducta',
          description: 'Dentro y fuera del servidor',
          emoji: optEmoji('lock')
        },
        {
          label: 'Comandos y canales clave',
          value: 'comandos',
          description: 'Herramientas del liderazgo',
          emoji: optEmoji('flecha')
        }
      );

    return {
      embeds: [main],
      components: [new ActionRowBuilder().addComponents(menu)]
    };
  }
};
