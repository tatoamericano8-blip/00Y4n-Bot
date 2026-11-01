import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E, EMOJI_DEF } from '../emojis.js';

function optEmoji(key) {
  const d = EMOJI_DEF[key];
  if (!d?.id) return undefined;
  return { id: d.id, name: d.name };
}

/**
 * Hub + menú: normas de conducción / sesión adaptadas a 00Y4n.
 * Contenido inspirado en guías de servidores grandes, sin temas ajenos
 * (límites de matrícula por rol, BVE/BLVE, Horton/Brookmere).
 */
export default {
  id: 'normas_conduccion',
  label: 'Normas de conducción (guía completa)',
  description: 'Terminología, logística, peacetime, velocidades y FRP',

  build() {
    const hub = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.auto || E.llaves} Southwest Florida 00Y4n · Guía de conducción`)
      .setDescription(
        `${E.dot} El objetivo es una experiencia **realista y prolija** dentro y fuera de las sesiones.\n` +
          `${E.dot} Mantenemos un estándar lógico: si no entendés algo, leé la sección del menú o preguntá en staff.\n\n` +
          `${E.flecha} **Elegí una sección** en el menú de abajo.\n` +
          `-# Las reglas se aplican en sesión. El staff puede ajustar detalles según el evento.`
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('embed_normas_conduccion_menu')
      .setPlaceholder('00Y4n · Guía de conducción')
      .addOptions(
        {
          label: 'Terminología',
          description: 'FRP, peacetime, prio, scene, void…',
          value: 'terminologia',
          emoji: optEmoji('manual') || optEmoji('dot')
        },
        {
          label: 'Logística del vehículo',
          description: 'Licencia, seguro, matrícula, trailers',
          value: 'logistica',
          emoji: optEmoji('auto')
        },
        {
          label: 'Normas generales',
          description: 'Crimen, chat, emergencias, distancia',
          value: 'generales',
          emoji: optEmoji('warn')
        },
        {
          label: 'Velocidades y peacetime',
          description: 'Límites FRP según estado de la sesión',
          value: 'velocidades',
          emoji: optEmoji('flecha')
        },
        {
          label: 'Carretera y circulación',
          description: 'Autopista, intersecciones, clima',
          value: 'circulacion',
          emoji: optEmoji('auto')
        },
        {
          label: 'Accidentes y spawn',
          description: 'Choques, ruedas pinchadas, reaparición',
          value: 'accidentes',
          emoji: optEmoji('cruz')
        },
        {
          label: 'Imprudencia y FRP',
          description: 'Qué se castiga y qué se espera de vos',
          value: 'frp',
          emoji: optEmoji('warn')
        }
      );

    return {
      embeds: [hub],
      components: [new ActionRowBuilder().addComponents(menu)]
    };
  }
};

/** Contenidos por sección (usados por el select menu). */
export function buildSeccionNormasConduccion(seccion) {
  const c = PRIMARIO;
  const d = E.dot;
  const f = E.flecha;

  if (seccion === 'terminologia') {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(c)
          .setTitle(`${E.manual || E.carpeta} Terminología de sesión`)
          .setDescription(
            `${d} **FRP (Fail Roleplay)** — Cualquier cosa **poco realista** o que ignore el rol a propósito.\n\n` +
              `${d} **Velocidad FRP** — Límite de velocidad del servidor en **mph**. Superarlo cuenta como infracción / FRP según el caso.\n\n` +
              `${d} **Intruso / leaker** — Persona que **no debería** estar en la sesión (sin acceso, filtró link, etc.).\n\n` +
              `${d} **Peacetime** — Estado de la sesión:\n` +
              `• **Estricto** — Máximo control; tope **75 MPH**.\n` +
              `• **Normal** — Tránsito ordenado; tope **85 MPH**.\n` +
              `• **Sin PT** — Más acción permitida; tope **120 MPH**.\n\n` +
              `${d} **Prio (prioridad)** — Con **sin peacetime**, es el **criminal prioritario** de la escena. Si no sos el prio, conducí con responsabilidad; el prio suele ir más agresivo.\n\n` +
              `${d} **Scene (escena)** — Zona de la sesión que requiere **atención especial** (operativo, accidente, evento).\n\n` +
              `${d} **Canal de voz de la escena** — Canal de voz de la escena; si un oficial te para, podés unirte ahí.\n\n` +
              `${d} **Void** (anular / no reconocer) — **No reconocés** un evento o acción (como si no hubiera pasado). Solo cuando el staff o las reglas lo indiquen.`
          )
      ]
    };
  }

  if (seccion === 'logistica') {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(c)
          .setTitle(`${E.auto} Logística del vehículo`)
          .setDescription(
            `${f} **Licencia**\n` +
              `${d} En 00Y4n la licencia se gestiona con el sistema del bot (\`/perfil_swfl\` y comandos de staff).\n` +
              `${d} Si está **suspendida**, debés regularizarla según indique el staff antes de circular con normalidad.\n\n` +
              `${f} **Seguro**\n` +
              `${d} Podés contratar seguro desde la **tienda del servidor** (planes disponibles en el momento).\n` +
              `${d} Circular **sin seguro** puede terminar en multa u otras sanciones en rol.\n\n` +
              `${f} **Matrícula / registro**\n` +
              `${d} Registrá tu(s) vehículo(s) con \`/matricular\` (o el flujo vigente en el canal de comandos).\n` +
              `${d} Respetá el formato que pida el bot y no abuses del sistema.\n\n` +
              `${f} **Pago de multas**\n` +
              `${d} Las multas se pagan por el sistema del bot cuando corresponda.\n` +
              `${d} No dejes deudas colgadas: afectan tu perfil y pueden escalar (orden de arresto, etc.).\n\n` +
              `${f} **Trailers / acoplados**\n` +
              `${d} Si el juego y la sesión lo permiten, manejá el trailer con cuidado.\n` +
              `${d} Sin permiso especial del host cuando se pida; circular mal con trailer puede ser sanción.\n` +
              `${d} Registrá el trailer si el staff o el sistema lo requieren.`
          )
      ]
    };
  }

  if (seccion === 'generales') {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(c)
          .setTitle(`${E.warn || E.dot} Normas generales en sesión`)
          .setDescription(
            `${f} **Crimen**\n` +
              `${d} Los **crímenes mayores** están **prohibidos** con peacetime **estricto** o **normal** (asaltos, daño a propósito a vehículos, robo de autos, etc.), salvo que el host habilite algo puntual.\n\n` +
              `${f} **Chat y voz**\n` +
              `${d} No evadas el filtro de Roblox con insultos.\n` +
              `${d} Moderá insultos en voz (incluida música molesta).\n` +
              `${d} Si tu cuenta de Roblox se banea por evitar el filtro, **no es responsabilidad** de 00Y4n.\n` +
              `${d} No rompas los Términos de Roblox. Roleplays de: bandas terroristas, suicidio, tiroteos escolares, contenido sexual, drogas pesadas, etc. **están prohibidos**.\n\n` +
              `${f} **Vehículos de emergencia**\n` +
              `${d} **Cedé el paso** si llevan luces/sirena.\n` +
              `${d} No te escapes de un móvil que te indica parar.\n` +
              `${d} No hostigues al vehículo ni a quien lo conduce.\n\n` +
              `${f} **Distancia y cambio de carril**\n` +
              `${d} Mantené distancia razonable (el juego tiene delay).\n` +
              `${d} Usá el carril correcto (izquierdo para pasar, derecho más lento).\n` +
              `${d} Dejá espacio de **varios autos** al cambiar de carril.\n` +
              `${d} No cortes ni te metás de golpe.`
          )
      ]
    };
  }

  if (seccion === 'velocidades') {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(c)
          .setTitle(`${E.flecha} Velocidades FRP y peacetime`)
          .setDescription(
            `${d} Los límites **FRP** se hacen cumplir. Pasarte **aunque sea un poco** puede costarte advertencia, expulsión de la sesión o más.\n\n` +
              `${f} **Límites oficiales de 00Y4n**\n` +
              `${d} **Peacetime estricto** → **75 MPH**\n` +
              `${d} **Peacetime normal** → **85 MPH**\n` +
              `${d} **Sin peacetime (Sin PT)** → **120 MPH**\n\n` +
              `${f} **Estados de peacetime**\n` +
              `${d} Hay **tres**: estricto, normal y sin PT.\n` +
              `${d} En **ninguno** se tolera imprudencia gratuita (agresividad al volante, etc.).\n` +
              `${d} Chocar y huir y conducción temeraria de civiles **no** están permitidos en sin PT “porque sí”.\n` +
              `${d} Prestá atención al canal de la sesión: el host actualiza el peacetime ahí.\n\n` +
              `${f} **Rueda pinchada**\n` +
              `${d} Tope orientativo **25 MPH**.\n` +
              `${d} Carril derecho o orillate.\n` +
              `${d} Si no hay grúa/taller en rol, reaparecé en zona segura cuando corresponda.`
          )
      ]
    };
  }

  if (seccion === 'circulacion') {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(c)
          .setTitle(`${E.auto} Carretera y circulación`)
          .setDescription(
            `${f} **Autopista / vía rápida**\n` +
              `${d} En autopista aplicá el **tope del peacetime actual** (75 / 85 / 120 MPH).\n` +
              `${d} Pasarte del límite del peacetime vigente cuenta como FRP.\n` +
              `${d} Si hay mucho tráfico, andá más despacio y con cuidado.\n\n` +
              `${f} **Uso de carriles**\n` +
              `${d} **Izquierdo** — adelantar.\n` +
              `${d} **Central** — marcha normal (si hay 3).\n` +
              `${d} **Derecho** — entrar/salir, tráfico más lento.\n` +
              `${d} **No:** tejer entre carriles, piques, frenadas de prueba, detenerte en plena vía.\n` +
              `${d} Con mucho tráfico, el staff es más estricto.\n\n` +
              `${f} **Calles estrechas**\n` +
              `${d} Sin frenadas bruscas; velocidad baja.\n` +
              `${d} Estacioná bien (no en ángulo raro; paralelo en el sentido correcto).\n\n` +
              `${f} **Semáforos y stops**\n` +
              `${d} No te pases el rojo; en peacetime ON a veces se tolera un error leve, en **STRICT** no.\n` +
              `${d} En un **cruce de cuatro vías (pare en las cuatro)**, el que llega primero tiene preferencia.\n` +
              `${d} Dejá distancia con otros autos.\n\n` +
              `${f} **Giros en U**\n` +
              `${d} Solo en intersecciones **con** semáforo, si es seguro.\n` +
              `${d} El resto de Giros en U están **prohibidos**, aunque no haya cartel.\n\n` +
              `${f} **Clima**\n` +
              `${d} Lluvia o nieve: respetá el límite FRP publicado.\n` +
              `${d} No causes choques por cambiar de entorno de golpe.\n` +
              `${d} Que haya cambiado el clima **no** habilita manejar mal.`
          )
      ]
    };
  }

  if (seccion === 'accidentes') {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(c)
          .setTitle(`${E.cruz || E.warn} Accidentes, spawn y estacionamiento`)
          .setDescription(
            `${f} **Choques (auto / peatón)**\n` +
              `${d} **Roleá completo** cualquier accidente sobre ~**20 mph**.\n` +
              `${d} Llamá a servicios si aplica, o roleá el choque si no hay nadie.\n` +
              `${d} Intercambiá datos con los involucrados.\n` +
              `${d} Decir “ex” y largarte **no vale**.\n` +
              `${d} Bajá del auto y roleá el intercambio (o equivalente en chat).\n` +
              `${d} **Chocar y huir** no se tolera: moderación fuerte.\n` +
              `${d} El spawn (reaparecer) **no** borra el rol del accidente.\n\n` +
              `${f} **Estacionamiento y spawn**\n` +
              `${d} Al aparecer / spawnear, velocidad baja (no salgas disparado).\n` +
              `${d} En playas de estacionamiento, manejá con cuidado.\n` +
              `${d} No bloquees lugares de discapacidad / espacios reservados del mapa.\n` +
              `${d} Si chocás ahí, intercambiá info.\n` +
              `${d} Mal estacionado o generar embotellamiento = expulsión de la sesión o sanción.\n\n` +
              `${f} **Reaparición del vehículo**\n` +
              `${d} **No** reapariciónees en medio de la calle.\n` +
              `${d} Buscá casa o estacionamiento vacío.\n` +
              `${d} Si debés reaparecer fuera de zona, pedí permiso en chat de sesión (ej. *reaparición perms*).`
          )
      ]
    };
  }

  if (seccion === 'frp') {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(c)
          .setTitle(`${E.warn} Imprudencia y Fail Roleplay`)
          .setDescription(
            `${d} **Conducción imprudente** = cualquier manejo a propósito que rompa la sesión: exceso grave, agresividad al volante, causar choques, chocar y huir, etc. **Está prohibido**.\n\n` +
              `${d} La mayoría de estas normas existen para **evitar FRP**, subir la calidad del manejo y cortar el caos.\n\n` +
              `${d} La lista **no** es todas las reglas del universo: si algo se repite mucho, el staff puede sumar criterios. Se espera **sentido común** al volante.\n\n` +
              `${d} Si generás un ambiente imprudente, esperá moderación.\n` +
              `${d} **Cero tolerancia** a comportamiento irresponsable y FRP claro.\n\n` +
              `${f} **Qué esperamos en 00Y4n**\n` +
              `${d} Si seguís la guía, casi no vas a tener problemas con el staff.\n` +
              `${d} El staff no está para “cazar” gente: está para que la sesión se disfrute.\n` +
              `${d} Moderamos con firmeza a los que rompen el estándar.\n\n` +
              `${d} Al estar en el servidor y entrar a sesiones, **aceptás** estas normas de conducción.\n` +
              `-# Southwest Florida Comunidad 00Y4n ™`
          )
      ]
    };
  }

  return null;
}
