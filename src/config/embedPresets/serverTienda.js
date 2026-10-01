import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

/** Banner — reemplazá si caduca */
const IMG_TIENDA =
  'https://cdn.discordapp.com/attachments/1505017301089652898/1548119383874871316/Server_Tienda_1.png';

export default {
  id: 'server_tienda',
  label: 'Server Tienda',
  description: 'Ventajas de Robux (imagen, deportes, FastPass)',

  build() {
    const banner = new EmbedBuilder().setColor(PRIMARIO).setImage(IMG_TIENDA);

    const body = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.mitadestrella || E.premio || ''} Southwest Florida 00Y4n, Server Tienda`.trim())
      .setDescription(
        `${E.dot} **Permiso de imagen** — 100 Robux\n` +
          `${E.dot} **Deportes Motorizados** — 100 Robux\n` +
          `${E.dot} **FastPass** — 200 Robux\n\n` +
          `Al adquirir una ventaja, por favor abrí un ticket en **#asistencia** para reclamar tus roles. ¡Asegurate de proporcionar pruebas suficientes de la compra al hacerlo! ${E.dot}`
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    return { embeds: [banner, body] };
  }
};
