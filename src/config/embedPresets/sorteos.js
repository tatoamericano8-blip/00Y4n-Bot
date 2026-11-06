import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

const IMG_SORTEOS =
  'https://media.discordapp.net/attachments/1505017301089652898/1568271109718155334/Copia_de_Sorteos_1.png?ex=6aef35c9&is=6aede449&hm=86f9983ab79aa071f3c147f4de9b0675c15b0d3b3d80b16e3d08e90e00eac6d4&=&format=webp&quality=lossless';

export default {
  id: 'sorteos',
  label: 'Sorteos',
  description: 'Canal de sorteos / giveaways de la comunidad',

  build() {
    const banner = new EmbedBuilder().setColor(PRIMARIO).setImage(IMG_SORTEOS);

    const cuerpo = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.abow2 || E.abow2 || '🎁'} Southwest Florida 00Y4n, Sorteos`)
      .setDescription(
        [
          `${E.dot} Bienvenido al canal de **sorteos** de **Southwest Florida 00Y4n**.`,
          `Acá organizamos sorteos para agradecer a la comunidad, con premios que pueden incluir **Nitro**, **Robux**, beneficios exclusivos del servidor y más.`,
          `¡Estate atento a los próximos anuncios!`,
          ``,
          `${E.flecha} **Importante:** participar con **más de una cuenta** puede terminar en **ban** de Southwest Florida 00Y4n.`,
          `Tampoco nos hacemos responsables de sorteos organizados por **otros servidores**.`
        ].join('\n')
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    return { embeds: [banner, cuerpo] };
  }
};
