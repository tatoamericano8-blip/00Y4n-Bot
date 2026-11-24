import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E, EMOJI_DEF } from '../emojis.js';

const BANNER_ALIANZAS =
  'https://media.discordapp.net/attachments/1505017301089652898/1574576865316962355/Copia_de_Alianzas_1.png?ex=6b06267a&is=6b04d4fa&hm=b0dc2a9388969d357f3f74abc7a9dda91c8034cbcb3e0d8be912980f5aa44cf1&=&format=webp&quality=lossless';

function btnEmoji(key) {
  const d = EMOJI_DEF[key];
  if (!d?.id) return undefined;
  return { id: d.id, name: d.name };
}

/**
 * Precios publicidad paga (editables).
 * Ajustados a ~650 miembros; el owner puede actualizar números después.
 */
export const PRECIOS_PUBLICIDAD = {
  sin_ping: { usd: 4, robux: 500, label: 'Sin ping' },
  here: { usd: 10, robux: 1200, label: 'Mención @here' },
  everyone: { usd: 18, robux: 2200, label: 'Mención @everyone' }
};

export function buildPublicidadPagaEmbed() {
  const p = PRECIOS_PUBLICIDAD;
  return new EmbedBuilder()
    .setColor(PRIMARIO)
    .setTitle(`${E.money || '💰'} Publicidad paga · 00Y4n`)
    .setDescription(
      [
        `${E.dot} Si tu servidor **no cumple** los requisitos de alianza gratuita, podés contratar una publicación en 00Y4n.`,
        ``,
        `${E.flecha} **Precios**`,
        `${E.dot} **${p.sin_ping.label}** — $${p.sin_ping.usd} USD · ${p.sin_ping.robux.toLocaleString('es-AR')} Robux`,
        `Publicación en el canal de alianzas / anuncios, sin mención masiva.`,
        ``,
        `${E.dot} **${p.here.label}** — $${p.here.usd} USD · ${p.here.robux.toLocaleString('es-AR')} Robux`,
        `Publicación + mención \`@here\` una vez.`,
        ``,
        `${E.dot} **${p.everyone.label}** — $${p.everyone.usd} USD · ${p.everyone.robux.toLocaleString('es-AR')} Robux`,
        `Publicación + mención \`@everyone\` una vez.`,
        ``,
        `${E.flecha} **Incluye**`,
        `${E.dot} Texto e imagen de tu servidor (revisión previa del staff).`,
        `${E.dot} Un post; duraciones o packs se coordinan por DM.`,
        ``,
        `${E.msj || E.flecha} **¿Interesado?** Abrí ticket de soporte o escribí a un miembro del **Equipo de Propietarios** con el pack que querés y el método de pago (USD o Robux).`,
        ``,
        `-# Los precios pueden actualizarse. No hay reembolso una vez publicada la promo.`
      ].join('\n')
    )
    .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });
}

export default {
  id: 'alianzas',
  label: 'Alianzas',
  description: 'Requisitos de alianza entre servidores y publicidad paga',

  build() {
    const banner = new EmbedBuilder().setColor(PRIMARIO).setImage(BANNER_ALIANZAS);

    const cuerpo = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.corona || '🤝'} Southwest Florida 00Y4n · Alianzas`)
      .setDescription(
        [
          `${E.dot} Bienvenido a las **Alianzas** de **Southwest Florida 00Y4n**.`,
          `Apoyamos comunidades de roleplay en su crecimiento. Antes de asociarte con nosotros, tenés que cumplir los requisitos de abajo.`,
          ``,
          `${E.flecha} **Requisitos de alianza**`,
          `${E.dot} Comunidad **activa** (actividad real, no solo números).`,
          `${E.dot} Enfocado en **Southwest Florida** o **Roblox Roleplay**.`,
          `${E.dot} Buena **reputación** y gestión del staff.`,
          `${E.dot} Servidor **organizado** (canales, reglas, roles claros).`,
          `${E.dot} Mínimo orientativo: **~200 miembros** con actividad estable.`,
          ``,
          `${E.flecha} **Requisitos de ping** *(según el tamaño del servidor aliado)*`,
          `${E.dot} **400+ miembros:** sin ping obligatorio en el anuncio.`,
          `${E.dot} **1.000+ miembros:** mención \`@here\`.`,
          `${E.dot} **2.500+ miembros:** mención \`@everyone\`.`,
          ``,
          `${E.dot} Los servidores aliados deben mencionar a **00Y4n** con al menos \`@here\` al publicarnos (salvo acuerdo distinto).`,
          ``,
          `${E.msj || E.flecha} Si **no llegás** a los requisitos, podés usar **publicidad paga** con el botón de abajo.`
        ].join('\n')
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('embed_alianzas_publicidad')
        .setLabel('Publicidad paga')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(btnEmoji('money') || '💰')
    );

    return {
      embeds: [banner, cuerpo],
      components: [row]
    };
  }
};
