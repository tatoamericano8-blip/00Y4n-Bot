import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

/** PLACEHOLDER — agregá banner general de conducción si tenés URL */
const IMG_MANEJO_HEADER = null;

const IMG_CARRILES =
  'https://media.discordapp.net/attachments/1505017301089652898/1561884674710704129/xFe3F.jpg?ex=6ad7f9f4&is=6ad6a874&hm=ce4296738b421fdb965c19c45f2eb51eb5ff0921d6cb299f4f3efe13a1900e73&=&format=webp';
const IMG_SERVICIOS =
  'https://media.discordapp.net/attachments/1505017301089652898/1561884673532108902/SGnjt.jpg?ex=6ad7f9f4&is=6ad6a874&hm=cd3957446132f48fc791cc45d627a14b9d07174fd8705dae67655438bfdb236c&=&format=webp';
const IMG_CAMBIO =
  'https://media.discordapp.net/attachments/1505017301089652898/1561884674425356430/Tjpe1.jpg?ex=6ad7f9f4&is=6ad6a874&hm=654855b14dfde81fa20735de9bcdd4b1c21e7dc51833d38aaf0ccca9cce632e9&=&format=webp';
const IMG_SEGURO =
  'https://media.discordapp.net/attachments/1505017301089652898/1561884670981832744/3Ss61.jpg?ex=6ad7f9f3&is=6ad6a873&hm=897a464e47609b9a3e328fdb4c6115bc8b7e1c24fff61518d1d04dcbbb5c6df9&=&format=webp';

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
