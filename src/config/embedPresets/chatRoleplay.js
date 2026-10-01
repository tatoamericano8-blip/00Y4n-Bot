import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

/** Banner Chat Roleplay — pegá la URL si la tenés */
const IMG_CHAT_RP = null;
// Ejemplo: 'https://cdn.discordapp.com/attachments/.../Chat_Roleplay_1.png'

export default {
  id: 'chat_roleplay',
  label: 'Chat Roleplay',
  description: 'Normas del canal de chat RP / servicios públicos',

  build() {
    const embeds = [];

    if (IMG_CHAT_RP) {
      embeds.push(new EmbedBuilder().setColor(PRIMARIO).setImage(IMG_CHAT_RP));
    }

    embeds.push(
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(
          `${E.amariposa2 || E.aestrellas} __Southwest Florida 00Y4n, Chat Roleplay__ ${E.amariposa2 || E.aestrellas}`
        )
        .setDescription(
          `${E.dot} Para hacer cumplir activamente nuestras normas de juego del roleplay independientemente de las restricciones de chat de Roblox, el equipo de administración utilizará este canal para comunicarse con jugadores que pertenezcan a un grupo de **edad diferente** o que no tengan **acceso al chat del juego**. Si te encontrás en alguna de estas situaciones, **asegurate** de revisar este canal con frecuencia, ya que los miembros del equipo o los agentes del orden podrían utilizarlo para contactarte.`
        )
    );

    embeds.push(
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.hyperlink || E.msj} __Servicios Públicos__`)
        .setDescription(
          `${E.dot} También deberán utilizar este canal para comunicarse con los ciudadanos durante las **paradas de tráfico** si estos no tienen acceso al chat del juego. Se espera que sigas todas las normas al chatear en este canal.\n\n` +
            `${E.flecha} Mantener conversaciones ajenas a la actividad principal en este canal resultará en una sanción de **silencio (mute)**; su uso solo está permitido durante las **sesiones de roleplay**.`
        )
        .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' })
    );

    return { embeds };
  }
};
