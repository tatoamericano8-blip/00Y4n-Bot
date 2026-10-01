import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E, EMOJI_DEF } from '../emojis.js';

/** Banner superior — reemplazá la URL si caduca */
const IMG_INSTRUCTIVO =
  'https://cdn.discordapp.com/attachments/1505017301089652898/1548119380565434468/Instructivo_1.png';

export default {
  id: 'instructivo',
  label: 'Informativo / Instructivo',
  description: 'Bienvenida + menú de información del servidor',

  build() {
    const embedBanner = new EmbedBuilder().setColor(PRIMARIO).setImage(IMG_INSTRUCTIVO);

    const embedTexto = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.logo} ¡Bienvenidos a Southwest Florida 00Y4n!`)
      .setDescription(
        `${E.flecha} Nos emociona darles la bienvenida a nuestra comunidad orgánica y en constante crecimiento. Desde su lanzamiento en **Diciembre de 2025**, nuestra comunidad ha crecido significativamente, y cada momento de nuestra historia nos ha moldeado hasta convertirnos en la familia que somos hoy.\n\n` +
          `${E.flecha} **Nuestro objetivo es simple**: crear una experiencia de rol única, inmersiva y atractiva basada en el juego de Roblox \"Southwest Florida\". Nuestra prioridad siempre ha sido una: **nuestros ciudadanos**. Creemos en fomentar un entorno centrado en la comunidad, donde la participación y la libertad son primordiales. **A continuación, encontrarán toda nuestra información, como las normas, los vehículos baneados, las ventajas de los boosters, etc.**\n\n` +
          `${E.dot} **Si tienen alguna pregunta o inquietud, ¡nuestro equipo estará encantado de ayudarles!** Si lo necesitan, no duden en contactar al propietario, quien participa activamente en nuestra comunidad de 00Y4n.`
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId('embed_instructivo_menu')
      .setPlaceholder('Elegí una sección…')
      .addOptions(
        {
          label: 'Server Tienda',
          value: 'server_tienda',
          emoji: EMOJI_DEF.mitadestrella?.id || undefined
        },
        {
          label: 'Normas de las sesiones',
          value: 'roleplay_normas',
          emoji: EMOJI_DEF.llaves?.id || undefined
        },
        {
          label: 'Ventajas de Boostear',
          value: 'boost_ventajas',
          emoji: EMOJI_DEF.corona?.id || undefined
        },
        {
          label: 'Preguntas Frecuentes',
          value: 'faq',
          emoji: EMOJI_DEF.faq?.id || undefined
        },
        {
          label: 'Roblox Comunidad',
          value: 'roblox_comunidad',
          emoji: EMOJI_DEF.roblox?.id || undefined
        }
      );

    const row = new ActionRowBuilder().addComponents(menu);

    return {
      embeds: [embedBanner, embedTexto],
      components: [row]
    };
  }
};
