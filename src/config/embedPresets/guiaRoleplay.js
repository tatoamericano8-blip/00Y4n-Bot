import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E, EMOJI_DEF } from '../emojis.js';

const IMG_GUIA =
  'https://cdn.discordapp.com/attachments/1505017301089652898/1548119321019023400/Guia_Roleplay_1.png';

const CANAL_COMANDOS = '1505615426305130657';
const LINK_ROBLOX =
  'https://www.roblox.com/es/communities/292739785/Clan-00Y4n#!/about';

function optEmoji(key) {
  const d = EMOJI_DEF[key];
  if (!d?.id) return undefined;
  return { id: d.id, name: d.name, animated: !!d.animated };
}

export default {
  id: 'guia_roleplay',
  label: 'Guía Roleplay',
  description: 'Guía RP + menú (Roblox, vehículos, unirse, tienda)',

  build() {
    const banner = new EmbedBuilder().setColor(PRIMARIO).setImage(IMG_GUIA);

    const intro = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(
        `${E.amariposa2 || E.aestrellas} __**Southwest Florida 00Y4n** - ***Roleplay***__ ${E.amariposa2 || E.aestrellas}`
      )
      .setDescription(
        `Bienvenidos a la sesión de inicio de juego de rol n.º 1 de Southwest Florida Roleplay; en este canal, los miembros de nuestro equipo de administración organizarán sesiones de juego de rol para la participación de nuestros ciudadanos. Antes de unirte a nuestras sesiones en Roblox, asegurate de formar parte del __[grupo de Roblox](${LINK_ROBLOX})__ y de haberte familiarizado con todas las normas e información del juego.`
      );

    const info = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.manual} __**Información Roleplay**__`)
      .setDescription(
        `${E.dot} Familiarizate con las normas y reglas de nuestro servidor para disfrutar de una experiencia de juego de rol más fluida en nuestras sesiones.\n` +
          `${E.dot} Asegurate de registrar tu(s) vehículo(s) mediante el comando \`/matricular registrar\` en el canal <#${CANAL_COMANDOS}>.\n` +
          `${E.dot} Por favor, asegurate de tener los roles correspondientes para tus vehículos. Consultá el menú desplegable a continuación para ver la lista de vehículos restringidos.\n` +
          `${E.dot} Tu configuración de privacidad debe estar en **«Todos»/«Everyone»** para que puedas recibir invitaciones manuales del anfitrión si es necesario.`
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('embed_guia_rp_menu')
      .setPlaceholder('Southwest Florida 00Y4n - Roleplay')
      .addOptions(
        {
          label: 'ROBLOX Comunidad',
          description: '¡Unite a la comunidad antes de unirte a una sesión!',
          value: 'roblox_comunidad',
          emoji: optEmoji('roblox')
        },
        {
          label: 'Vehículos Baneados',
          description: 'Lista de vehículos restringidos en las sesiones',
          value: 'vehiculos_baneados',
          emoji: optEmoji('auto')
        },
        {
          label: 'Cómo unirse a las sesiones',
          description: 'Tutorial paso a paso para unirse',
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

    const row = new ActionRowBuilder().addComponents(menu);

    return {
      embeds: [banner, intro, info],
      components: [row]
    };
  }
};
