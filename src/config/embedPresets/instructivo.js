import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E, EMOJI_DEF } from '../emojis.js';

/** Banner superior — reemplazá la URL si caduca */
const IMG_INSTRUCTIVO =
  'https://media.discordapp.net/attachments/1505017301089652898/1565769728352452658/Copia_de_Informacion_del_Servidor_1.png?ex=6ae61c31&is=6ae4cab1&hm=6d2c760e8d9cbe4d1d0563db0f12140b2824abd6f0d743de09304cf8f5893797&=&format=webp&quality=lossless';

function optEmoji(key) {
  const d = EMOJI_DEF[key];
  if (!d?.id) return undefined;
  return { id: d.id, name: d.name, animated: !!d.animated };
}

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
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('embed_instructivo_menu')
      .setPlaceholder('Southwest Florida 00Y4n, Menú')
      .addOptions(
        {
          label: 'Reglamento Discord',
          description: 'Reglas del servidor y conducta',
          value: 'reglas_discord',
          emoji: optEmoji('manual')
        },
        {
          label: 'Server Tienda',
          description: 'Mirá las ventajas que podés comprar',
          value: 'server_tienda',
          emoji: optEmoji('mitadestrella')
        },
        {
          label: 'Normas de las sesiones',
          description: 'Reglas de sesiones y roleplay',
          value: 'roleplay_normas',
          emoji: optEmoji('llaves')
        },
        {
          label: 'Ventajas de Boostear',
          description: 'Beneficios de boostear el servidor',
          value: 'boost_ventajas',
          emoji: optEmoji('corona')
        },
        {
          label: 'Preguntas Frecuentes',
          description: '¿Tenés dudas? Sacátelas acá',
          value: 'faq',
          emoji: optEmoji('faq')
        },
        {
          label: 'Roblox Comunidad',
          description: 'Grupo oficial de Roblox 00Y4n',
          value: 'roblox_comunidad',
          emoji: optEmoji('roblox')
        },
        {
          label: 'Servidor de Servicios Públicos',
          description: 'Unite al servidor de departamentos SP',
          value: 'servicios_publicos',
          emoji: optEmoji('multa') || optEmoji('multa') || optEmoji('multa')
        }
      );

    const row = new ActionRowBuilder().addComponents(menu);

    return {
      embeds: [embedBanner, embedTexto],
      components: [row]
    };
  }
};
