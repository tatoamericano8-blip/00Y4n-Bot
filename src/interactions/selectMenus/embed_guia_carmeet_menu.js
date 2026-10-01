import { MessageFlags, EmbedBuilder } from 'discord.js';
import { getPreset } from '../../config/embedPresets/index.js';
import { E } from '../../config/emojis.js';
import { PRIMARIO } from '../../utils/colores.js';

const LINK_ROBLOX =
  'https://www.roblox.com/es/communities/292739785/Clan-00Y4n#!/about';
const CANAL_SESIONES_1 = '1501739933495201925';
const CANAL_SESIONES_2 = '1452644461745148049';

const COLOR_MAL = 0xfc5400;
const COLOR_BIEN = 0x3dff00;

function buildNormasCarmeet() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(
          `${E.aestrellas || E.aflotacoras} __Normas de uso de automóviles (SWFL)__ ${E.aestrellas || E.aflotacoras}`
        )
        .setDescription(
          `${E.dot} *Para mantener la calidad de nuestras reuniones, todos deben seguir estas **normas de vehículos**. El incumplimiento puede resultar en **expulsión** del meet y, en casos extremos, **prohibición de participar**.*\n\n` +
            `${E.dot} **No se permiten coches de colores neón** — nada de neones brillantes.\n\n` +
            `${E.dot} **No se permiten modificaciones irreales** — el diseño debe ser realista y creíble.\n\n` +
            `${E.dot} **No superdeportivos/hyper con suspensión rebajada extrema** — se permite ligera inclinación negativa y llantas no muy profundas.\n\n` +
            `${E.dot} **Inclinación de ruedas** — máximo **-30** / **+30**. Nada excesivo.\n\n` +
            `${E.dot} **No ajustes drásticos** — ruedas muy metidas o que sobresalgan en exceso: no.\n\n` +
            `${E.dot} **No modificaciones exageradas** — alerones absurdos, kits demasiado llamativos, etc.\n\n` +
            `${E.dot} **No modificaciones provocativas** — nada pensado para interrumpir o molestar.\n\n` +
            `${E.dot} **Llantas adecuadas** — p. ej. llantas de SUV/camioneta solo en esos vehículos.\n\n` +
            `${E.dot} **Rebajados** — permitidos si cumplen reglas y son aptos para circular.\n\n` +
            `${E.dot} **Solo mods limpias** — apariencia limpia, sin recarga excesiva.\n\n` +
            `${E.dot} **Sin cromados / reflejos excesivos.**\n\n` +
            `${E.dot} **Tamaño de ruedas** — ni demasiado chicas ni demasiado grandes.\n\n` +
            `${E.dot} **No “stance” trasero más bajo que el delantero** (rebaje tipo truck).\n\n` +
            `${E.dot} **No llantas de gran diámetro en superdeportivos/hyper.**\n\n` +
            `${E.dot} **No roce de ruedas parado** — si rozan al girar y se ve bien, ok (no rebajes extremos).\n\n` +
            `${E.dot} **No deportes motorizados** (karts, etc.) salvo que el organizador lo indique.`
        )
        .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' })
    ]
  };
}

function buildGuiaMeets() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(
          `${E.aestrellas || E.auto} Reglas oficiales de los Car Meet 00Y4n ${E.aestrellas || E.auto}`
        )
        .setDescription(
          `${E.dot} **Adelantamientos**\n` +
            `Al cambiar de lugar, seguí las instrucciones del host y no adelantes a otros. Incumplir = reinicio; reiterado = expulsión o bloqueo.\n\n` +
            `${E.dot} **Uso del chat**\n` +
            `Prohibido: toxicidad, discusiones con miembros/staff, racismo, sexismo, spam, eludir filtros con insultos o lenguaje ofensivo. Puede resultar en bloqueo del servidor.\n\n` +
            `${E.dot} **Lugares de estacionamiento**\n` +
            `No discutas espacios. Estacioná en áreas designadas. No autos en techos ni lugares irreales.\n\n` +
            `${E.dot} **Avatares**\n` +
            `Evitá avatares excesivamente grandes: interfieren fotos, GDM y la experiencia.\n\n` +
            `${E.dot} **Conducta general**\n` +
            `Sin derrapes, acelerones ni bocina abusiva. No difundas info falsa del meet. Sé respetuoso y amable.`
        )
        .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' })
    ]
  };
}

function buildEjemplosAutos() {
  const intro = new EmbedBuilder()
    .setColor(PRIMARIO)
    .setTitle(`${E.aestrellas} Ejemplos de autos buenos y malos en Southwest Florida`)
    .setDescription(
      `${E.dot} Los autos en **verde** son **buenos ejemplos**; los de **rojo/naranja** son **malos** y __*no*__ están permitidos en las reuniones.\n` +
        `Si no estás seguro de tu vehículo, ¡preguntale a un organizador!`
    );

  const ejemplos = [
    { title: 'El color elegido para el coche es neón.', color: COLOR_MAL, img: 'https://i.ibb.co/TMcQyZmQ/image.webp' },
    { title: 'El ajuste es perfecto, no parece haber ningún roce visible, el color y la elección de las llantas de serie son muy sutiles y, en general, está impecable.', color: COLOR_BIEN, img: 'https://i.ibb.co/WWTKMFmV/image.webp' },
    { title: 'Variedad de llantas: llantas de arrastre traseras y llantas cóncavas delanteras.', color: 0xff0000, img: 'https://i.ibb.co/5x9FGYB6/image.webp' },
    { title: 'No parece haber ningún recorte visible, el color es muy sutil y, dado que se trata de un sedán, se permiten las carreras de aceleración.', color: 3407616, img: 'https://i.ibb.co/xqjkpNDG/image.webp' },
    { title: 'Cantidad exagerada de inclinación de las ruedas en el superdeportivo.', color: 16580608, img: 'https://i.ibb.co/chdv7SBg/image.webp' },
    { title: 'El ajuste es perfecto, no parece haber ningún recorte visible, el color es muy sutil y está limpio.', color: 2096896, img: 'https://i.ibb.co/LXFgbzxf/image.webp' },
    { title: 'Recorte obviamente visible enfrente cuando está parado.', color: 16252928, img: 'https://i.ibb.co/v6HPXMLb/image.webp' },
    { title: 'El ajuste es perfecto, no parece haber ningún recorte visible, el color es muy sutil y está limpio.', color: 3996672, img: 'https://i.ibb.co/cSgRykXF/image.webp' },
    { title: 'Exagerada reflexión.', color: 0xff0000, img: 'https://i.ibb.co/Kc7z2XXz/image.webp' }
  ];

  const embeds = [intro];
  for (const ex of ejemplos) {
    embeds.push(
      new EmbedBuilder().setColor(ex.color).setTitle(ex.title.slice(0, 256)).setImage(ex.img)
    );
  }
  return { embeds: embeds.slice(0, 10) };
}

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
          `*¡Hola a todos!* Tutorial paso a paso para entrar a Roleplay y Car Meets sin errores.\n\n` +
            `### ${flecha} __**PASO 1: Privacidad de Roblox**__\n` +
            `Configuración → Privacidad → Servidores privados → **«Todos» / «Everyone»**.\n` +
            `${nota} *Si está en «Nadie» o «Amigos», el botón del bot no funciona.*\n\n` +
            `### ${flecha} __**PASO 2: Votación**__\n` +
            `Un Host anuncia en <#${CANAL_SESIONES_1}> o <#${CANAL_SESIONES_2}>. Dejá tu voto en el mensaje.\n\n` +
            `### ${flecha} __**PASO 3: Link**__\n` +
            `FastPass entra antes; después apertura general. Tocá **«Link de la Sesión»** en el anuncio.\n\n` +
            `### ${warn} __**Importante**__\n` +
            `No compartas el link (ban). Respetá Peacetime y al Host apenas spawnees.`
        )
        .setFooter({ text: 'Southwest Florida 00Y4n ™' })
    ]
  };
}

export default {
  name: 'embed_guia_carmeet_menu',

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
      if (value === 'normas_carmeet') payload = buildNormasCarmeet();
      else if (value === 'ejemplos_autos') payload = buildEjemplosAutos();
      else if (value === 'guia_meets') payload = buildGuiaMeets();
      else if (value === 'roblox_comunidad') payload = buildRoblox();
      else if (value === 'como_unirse') payload = buildComoUnirse();
      else if (value === 'server_tienda') {
        const p = getPreset('server_tienda');
        payload = p ? await p.build({ interaction }) : null;
      } else {
        const p = getPreset(value);
        payload = p ? await p.build({ interaction }) : null;
      }
    } catch (e) {
      console.error('[embed_guia_carmeet_menu]', e);
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
