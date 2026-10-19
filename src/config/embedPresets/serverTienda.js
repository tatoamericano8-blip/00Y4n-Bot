import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

/** Banner — reemplazá si caduca */
const IMG_TIENDA =
  'https://media.discordapp.net/attachments/1505017301089652898/1561884470716661832/Copia_de_Server_Tienda_1.png?ex=6ad7f9c4&is=6ad6a844&hm=038a641cd693fbc77fa0eb1361d2cd46199eb857a5dc8be2a2fc9cb52903548b&=&format=webp&quality=lossless';

const LINK_IMAGEN =
  'https://www.roblox.com/es/catalog/76447815319095/Permisos-de-imagen';
const LINK_DEPORTES =
  'https://www.roblox.com/es/catalog/94966574563641/Deportes-Motorizados';
const LINK_FASTPASS =
  'https://www.roblox.com/es/catalog/81206122480063/Fast-Pass';

/** Canal #asistencia (ID del servidor) */
const CANAL_ASISTENCIA = '1497278448610316339';

export default {
  id: 'server_tienda',
  label: 'Server Tienda',
  description: 'Ventajas de Robux (imagen, deportes, FastPass)',

  build() {
    const banner = new EmbedBuilder().setColor(PRIMARIO).setImage(IMG_TIENDA);

    const body = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(
        `${E.aestrellas || E.mitadestrella || ''} __Southwest Florida 00Y4n, Server Tienda__ ${E.aestrellas || E.mitadestrella || ''}`.trim()
      )
      .setDescription(
        `${E.dot} [**Permiso de imagen** - 100 Robux](${LINK_IMAGEN})\n` +
          `${E.dot} [**Deportes Motorizados** - 100 Robux](${LINK_DEPORTES})\n` +
          `${E.dot} [**FastPass** - 200 Robux](${LINK_FASTPASS})\n\n` +
          `Al adquirir una ventaja, por favor abrí un ticket en <#${CANAL_ASISTENCIA}> para reclamar tus roles. ¡Asegurate de proporcionar pruebas suficientes de la compra al hacerlo! ${E.aflotacoras || E.dot}`
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    return { embeds: [banner, body] };
  }
};
