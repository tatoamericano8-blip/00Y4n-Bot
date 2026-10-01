import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

/** PLACEHOLDER — agregá banner general de conducción si tenés URL */
const IMG_MANEJO_HEADER = null;

const IMG_CARRILES =
  'https://cdn.discordapp.com/attachments/1505017301089652898/1548138045692313680/Gemini_Generated_Image_v32iuqv32iuqv32i.jfif';
const IMG_SERVICIOS =
  'https://cdn.discordapp.com/attachments/1505017301089652898/1548138044366921748/Gemini_Generated_Image_g1vsbxg1vsbxg1vs.jfif';
const IMG_CAMBIO =
  'https://cdn.discordapp.com/attachments/1505017301089652898/1548138043217674330/Gemini_Generated_Image_cq2avcq2avcq2avc.jfif';
const IMG_SEGURO =
  'https://cdn.discordapp.com/attachments/1505017301089652898/1548138045159514162/Gemini_Generated_Image_tld2witld2witld2.jfif';

export default {
  id: 'roleplay_manejo',
  label: 'Roleplay Manejo (conducción)',
  description: 'Normas de conducción con ejemplos visuales',

  build() {
    const intro = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.auto || E.llaves} __Normas de conducción__`)
      .setDescription(
        `Nos esforzamos por promover una **conducción realista** durante nuestras sesiones para crear una experiencia de juego de rol más __agradable para todos__. Es importante que revises rápidamente estas normas básicas de conducción para disfrutar más de la experiencia, tanto tú como quienes te rodean.\n\n` +
          `Las imágenes a continuación contienen las __normas de circulación__ **más importantes** con *ejemplos visuales*. Serás __expulsado__ de nuestras sesiones si no sigues estas normas básicas.`
      );
    if (IMG_MANEJO_HEADER) intro.setImage(IMG_MANEJO_HEADER);

    const carriles = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.llaves} Uso de carriles`)
      .setDescription(
        `La mayoría de las carreteras tienen **dos carriles**. El carril izquierdo es para __adelantar a los vehículos rápidos y sin retrasos__. Los **vehículos comerciales**, los que tienen retrasos y los que circulan más despacio deben __permanecer en el carril derecho__.`
      )
      .setImage(IMG_CARRILES);

    const servicios = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.llaves} Ceder ante los servicios públicos`)
      .setDescription(
        `Ceda **siempre** el __paso a los servicios públicos__ que estén ***atendiendo una emergencia***. __*Ceder el paso significa esperar y darles prioridad de paso*__, desplazándose hacia el **lado derecho** de la carretera.`
      )
      .setImage(IMG_SERVICIOS);

    const cambio = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.llaves} Cambio de carril`)
      .setDescription(
        `Al __cambiar de carril__, tenga en cuenta la **desincronización del sistema informático** *(retraso de 0,5 a 1,5 segundos, mayor a altas velocidades)*. __Mantenga siempre__ una distancia de **al menos 5 coches** al cambiar de carril o se enfrentará a una __**sanción**__.`
      )
      .setImage(IMG_CAMBIO);

    const seguro = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.llaves} Intercambio de información del seguro`)
      .setDescription(
        'En caso de accidente, oríllate inmediatamente sobre el lado derecho de la vía e intercambia la información de tu seguro utilizando `-intercambia información de seguro-`.\n\n' +
          'Si el accidente **dañó** __propiedad pública__ *(postes, semáforos, vegetación)*: __Reporta el daño al municipio__ utilizando `-llama al municipio e intercambia datos por los daños causados al objeto-`.'
      )
      .setImage(IMG_SEGURO);

    return { embeds: [intro, carriles, servicios, cambio, seguro] };
  }
};
