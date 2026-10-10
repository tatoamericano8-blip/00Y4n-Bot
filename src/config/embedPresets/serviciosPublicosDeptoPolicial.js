import { EmbedBuilder } from 'discord.js';

/** Color barra embed — tema oscuro Servicios Públicos */
const COLOR_SP = 0x1a1a1a;

const BANNER_URL =
  'https://media.discordapp.net/attachments/1555969515890810970/1558306417335599104/Departamento_Policial_de_Sarasota.png?ex=6acaf571&is=6ac9a3f1&hm=ea3677567ef3bfeaec27b164ffe48f81aae353f098f1d13ddeed0d5a323828a5&format=webp&quality=lossless';

/**
 * Anuncio de reclutamiento — Departamento de Policía de Sarasota.
 * Estilo RCRA (símbolos generales, sin emojis custom).
 */
export default {
  id: 'sp_depto_policial',
  label: 'SP · Depto. Policial Sarasota',
  description: 'Anuncio de reclutamiento del Departamento de Policía de Sarasota',

  build() {
    const embed = new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle('Únete al Departamento de Policía de Sarasota')
      .setDescription(
        [
          '• ¿Querés llevar tu experiencia de roleplay al siguiente nivel? El **Departamento de Policía de Sarasota** está comprometido a ofrecer sesiones de aplicación de la ley de alta calidad y realistas dentro de la comunidad de **Servicios Públicos 00Y4n**.',
          '',
          '• Nuestro departamento se apoya en un equipo de liderazgo sólido que fomenta un entorno profesional y de apoyo. Tanto si sos nuevo en el roleplay como si sos un supervisor experimentado, acá vas a encontrar un lugar donde la guía, el trabajo en equipo y el crecimiento son prioritarios.',
          '',
          '**El DPS ofrece:**',
          '• Sesiones de patrulla realistas e inmersivas',
          '• Liderazgo dedicado y cercano',
          '• Una comunidad dispuesta a ayudar',
          '• Academia de entrenamiento gratuita, disponible en cualquier momento con instructores activos',
          '',
          '📣 **Reclutando ahora:**',
          '• Buscamos reclutas nuevos con ganas de aprender y supervisores experimentados listos para liderar.',
          '',
          'Si estás listo para formar parte de un departamento que valora el realismo, el profesionalismo y la comunidad, el **Departamento de Policía de Sarasota** es el lugar para vos.',
          '',
          'Completá el formulario oficial con el comando **`/solicitud-departamento`**.'
        ].join('\n')
      )
      .setImage(BANNER_URL)
      .setFooter({ text: 'Servicios Públicos 00Y4n · Departamento de Policía de Sarasota' });

    return {
      embeds: [embed],
      components: []
    };
  }
};
