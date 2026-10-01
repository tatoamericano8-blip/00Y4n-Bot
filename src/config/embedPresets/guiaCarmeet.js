import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E, EMOJI_DEF } from '../emojis.js';

const IMG_CARMEET =
  'https://cdn.discordapp.com/attachments/1505017301089652898/1548119379953324162/Guia_carmeet_1.png';

const LINK_ROBLOX =
  'https://www.roblox.com/es/communities/292739785/Clan-00Y4n#!/about';

function optEmoji(key) {
  const d = EMOJI_DEF[key];
  if (!d?.id) return undefined;
  return { id: d.id, name: d.name, animated: !!d.animated };
}

export default {
  id: 'guia_carmeet',
  label: 'Guía Car Meet',
  description: 'Guía Carmeet + menú (normas, ejemplos, guía, etc.)',

  build() {
    const banner = new EmbedBuilder().setColor(PRIMARIO).setImage(IMG_CARMEET);

    const intro = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(
        `${E.amariposa2 || E.aestrellas} __**Southwest Florida 00Y4n** - ***Carmeet***__ ${E.amariposa2 || E.aestrellas}`
      )
      .setDescription(
        `Bienvenidos al canal de *Inicio de Carmeets de 00Y4n*; en este canal, los miembros de nuestro equipo de staff organizarán sesiones para la participación de nuestros miembros. Antes de unirte a nuestras sesiones en Roblox, asegurate de formar parte del __[grupo de Roblox](${LINK_ROBLOX})__ y de haberte familiarizado con todas las normas e información del juego.`
      );

    const info = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.manual} __**Información Carmeet**__`)
      .setDescription(
        `${E.dot} Aquí se publicará la información sobre el Inicio. Las sesiones se realizarán en el juego Southwest Florida.\n` +
          `${E.dot} Familiarizate con las normas y reglas de nuestro servidor para disfrutar de una experiencia de juego más fluida en nuestras sesiones.\n` +
          `${E.dot} Tu configuración de privacidad debe estar en **«Todos»/«Everyone»** para que puedas recibir invitaciones manuales del anfitrión si es necesario.\n` +
          `${E.dot} Asegurate de desplegar el menú de abajo de este mensaje para conocer las normas que debés seguir.`
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('embed_guia_carmeet_menu')
      .setPlaceholder('Southwest Florida 00Y4n - Carmeets')
      .addOptions(
        {
          label: 'Normas',
          description: 'Normas de vehículos durante las sesiones',
          value: 'normas_carmeet',
          emoji: optEmoji('msj')
        },
        {
          label: 'Ejemplos de autos bien o mal',
          description: 'Qué vehículos usar en un Carmeet',
          value: 'ejemplos_autos',
          emoji: optEmoji('tilde')
        },
        {
          label: 'Guía de Carmeets',
          description: 'Reglas oficiales del meet',
          value: 'guia_meets',
          emoji: optEmoji('auto')
        },
        {
          label: 'ROBLOX Comunidad',
          description: '¡Unite antes de unirte a una sesión!',
          value: 'roblox_comunidad',
          emoji: optEmoji('roblox')
        },
        {
          label: 'Cómo unirse a las sesiones',
          description: 'Tutorial paso a paso',
          value: 'como_unirse',
          emoji: optEmoji('manual')
        },
        {
          label: 'Server Tienda',
          description: 'Ventajas que podés adquirir',
          value: 'server_tienda',
          emoji: optEmoji('mitadestrella')
        }
      );

    return {
      embeds: [banner, intro, info],
      components: [new ActionRowBuilder().addComponents(menu)]
    };
  }
};
