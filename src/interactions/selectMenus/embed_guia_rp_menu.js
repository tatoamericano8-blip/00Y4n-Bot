import { MessageFlags, EmbedBuilder } from 'discord.js';
import { getPreset } from '../../config/embedPresets/index.js';
import { E } from '../../config/emojis.js';
import { PRIMARIO } from '../../utils/colores.js';

const LINK_ROBLOX =
  'https://www.roblox.com/es/communities/292739785/Clan-00Y4n#!/about';
const CANAL_SESIONES_1 = '1501739933495201925';
const CANAL_SESIONES_2 = '1452644461745148049';

function buildRoblox() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.roblox} ROBLOX Comunidad`)
        .setDescription(
          `${E.dot} Debés hacer clic [aquí](${LINK_ROBLOX}) para acceder a la comunidad de Roblox de **Southwest Florida 00Y4n.**\n\n` +
            `¡Unite a la comunidad **antes** de unirte a una sesión!`
        )
        .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' })
    ]
  };
}

function buildVehiculosBaneados() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.auto || E.warn} __Vehículos Restringidos | 00Y4n__`)
        .setDescription(
          `*Para mantener el realismo en Roleplay y Car Meets, estos vehículos tienen límites:*\n\n` +
            `${E.flecha} **__Restringidos__**\n\n` +
            `• **Motocicletas**\n` +
            `• **Karts**\n` +
            `• **Limusinas**\n` +
            `• **Vehículos Hyper** (baneados en RP salvo permiso o boost del servidor; en meets no están)\n` +
            `• Cualquier otro que el Staff marque como inapropiado en la sesión\n\n` +
            `${E.flecha} **__Normativa__**\n\n` +
            `• **Motos**: solo con permiso de Staff (o permiso de deportes motorizados, según corresponda).\n` +
            `• **Karts**: autorización del Host de la sesión.\n` +
            `• **F1 / deportes motorizados**: permiso de deportes motorizados + anfitrión; F1 solo con el rol de Staff indicado.\n` +
            `• **Limusinas**: solo con autorización de Staff, en eventos aprobados o con roles de boost.\n` +
            `• **Hyper**: no se usan en sesiones de RP sin permiso o mejora del servidor.\n` +
            `Sin autorización no se pueden usar, aunque tengas rango, antigüedad o gamepasses.\n\n` +
            `${E.flecha} **__Sanciones posibles__**\n\n` +
            `*Warn* • *Kick de la sesión* • *Suspensión de eventos* • *Sanciones mayores según el caso*\n` +
            `El objetivo es evitar FRP y cuidar la calidad de las sesiones.\n\n` +
            `[Comunidad Roblox 00Y4n](${LINK_ROBLOX})`
        )
        .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' })
    ]
  };
}

function buildComoUnirse() {
  const flecha = E.flecha;
  const warn = E.warn;
  const nota = E.replican || E.flechareplica || E.dot;

  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(
          `${E.aestrellas || E.aestrellitas} __Guía de Ingreso: ¿Cómo unirse a las Sesiones?__ ${E.aestrellas || E.aestrellitas}`
        )
        .setDescription(
          `*¡Hola a todos!* Para que puedan disfrutar de nuestras sesiones de Roleplay y Car Meets sin errores, armamos este tutorial paso a paso. Síganlo al pie de la letra para no quedarse afuera.\n\n` +
            `### ${flecha} __**PASO 1: Configuración de Roblox (¡antes!)**__\n` +
            `Si no configurás tu privacidad correctamente, Roblox te tirará un error y no te dejará entrar al servidor privado.\n\n` +
            `1. Entrá a **Configuración** de tu cuenta de Roblox.\n` +
            `2. Andá a **Privacidad** → Restricciones de privacidad y contenido.\n` +
            `3. **Visibilidad y servidores privados** → **Servidores privados**.\n` +
            `4. Cambiala a **«Todos» / «Everyone»**.\n\n` +
            `${nota} *Si está en «Nadie» o «Amigos», el botón del bot no va a funcionar para vos.*\n\n` +
            `### ${flecha} __**PASO 2: El Inicio y la Votación**__\n` +
            `Un Host lanzará un anuncio en <#${CANAL_SESIONES_1}> o en <#${CANAL_SESIONES_2}> avisando que se prepara una sesión.\n\n` +
            `Vas a ver un mensaje con meta de votos (reacciones o botones).\n` +
            `¡Dejá tu voto! Cuanto más rápido se llegue a la meta, más rápido se abre el servidor.\n\n` +
            `### ${flecha} __**PASO 3: El Lanzamiento y Cómo Unirse**__\n` +
            `Una vez cumplida la meta:\n\n` +
            `• **FastPass** — Staff y FastPass reciben el acceso unos minutos antes.\n` +
            `• **Apertura general** — después se libera el anuncio para todos.\n` +
            `• **Cómo entrar** — en el último mensaje del canal tocá **«Link de la Sesión»**. El bot verifica tu voto y te redirige a Roblox / SWFL.\n\n` +
            `### ${warn} __**Reglas durante el ingreso**__\n` +
            `• **Prohibido** compartir el link — exclusivo para miembros del Discord. Pasarlo a alguien externo = **ban**.\n` +
            `• **Respetá** el Peacetime y las reglas apenas spawnees; seguí al Host y los límites de velocidad del anuncio.`
        )
        .setFooter({ text: 'Southwest Florida 00Y4n ™' })
    ]
  };
}

export default {
  name: 'embed_guia_rp_menu',

  async execute(interaction) {
    const value = interaction.values?.[0];
    if (!value) {
      return interaction.reply({
        content: E.cruz + ' Opción inválida.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let payload;
    try {
      if (value === 'roblox_comunidad') {
        payload = buildRoblox();
      } else if (value === 'vehiculos_baneados') {
        payload = buildVehiculosBaneados();
      } else if (value === 'como_unirse') {
        payload = buildComoUnirse();
      } else if (value === 'server_tienda') {
        const preset = getPreset('server_tienda');
        payload = preset ? await preset.build({ interaction }) : null;
      } else {
        const preset = getPreset(value);
        payload = preset ? await preset.build({ interaction }) : null;
      }
    } catch (e) {
      console.error('[embed_guia_rp_menu]', e);
      return interaction.editReply({
        content: E.cruz + ` Error: ${e?.message || e}`
      });
    }

    if (!payload?.embeds?.length) {
      return interaction.editReply({
        content: E.cruz + ` Sección \`${value}\` no configurada.`
      });
    }

    return interaction.editReply({
      embeds: payload.embeds.slice(0, 10),
      components: []
    });
  }
};
