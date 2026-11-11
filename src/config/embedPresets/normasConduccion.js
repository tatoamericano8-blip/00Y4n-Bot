import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

/**
 * Normas de conducción — PARTE 1 (embeds directos, sin menú):
 * Terminología · Logística del vehículo · Normas generales · Velocidades y peacetime
 *
 * Parte 2 (carretera / FRP) se publica aparte más adelante.
 * buildSeccionNormasConduccion se mantiene por compatibilidad con el menú viejo.
 */
export default {
  id: 'normas_conduccion',
  label: 'Normas de conducción · Parte 1',
  description: 'Terminología, logística, normas generales, velocidades y peacetime',

  build() {
    const c = PRIMARIO;
    const d = E.dot;
    const f = E.flecha;

    const intro = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.auto || E.llaves} Southwest Florida 00Y4n · Normas de conducción`)
      .setDescription(
        `${d} Guía oficial de manejo en sesión. El objetivo es un tránsito **realista, prolijo y jugable**.\n` +
          `${d} Esta es la **Parte 1**: terminología, logística del vehículo, normas generales y velocidades / peacetime.\n` +
          `${d} La **Parte 2** (carretera, intersecciones, clima e imprudencia/FRP) se publica por separado.\n\n` +
          `${f} Si no entendés algo, leé esta guía o preguntá en staff **antes** de improvisar.\n` +
          `-# Se aplica en sesión. El staff puede ajustar detalles según el evento.`
      );

    const terminologia = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.manual || E.carpeta} Terminología de sesión`)
      .setDescription(
        `${d} **FRP (Fail Roleplay)** — Cualquier conducta **poco realista** o que ignore el rol a propósito (manejo absurdo, romper escena, ignorar reglas claras).\n\n` +
          `${d} **Velocidad FRP** — Límite de velocidad del servidor en **MPH**. Pasarlo puede ser infracción y, si es grave o a propósito, **FRP**.\n\n` +
          `${d} **Intruso / leaker** — Persona que **no debería** estar en la sesión (sin acceso, link filtrado, cuenta ajena, etc.). Reportalo al staff.\n\n` +
          `${d} **Peacetime (PT)** — Estado de control de la sesión (lo define el host / staff):\n` +
          `• **Estricto** — Máximo control; tope orientativo **75 MPH**.\n` +
          `• **Normal** — Tránsito ordenado; tope orientativo **85 MPH**.\n` +
          `• **Sin PT** — Más acción permitida; tope orientativo **120 MPH**.\n` +
          `-# Si el host publica otro número en el inicio, **manda ese**.\n\n` +
          `${d} **Prio (prioridad)** — Con sesión **sin peacetime**, es el **criminal prioritario** de la escena. Si no sos el prio, manejá con responsabilidad; el prio puede ir más agresivo **dentro de lo permitido**.\n\n` +
          `${d} **Scene (escena)** — Zona que requiere atención especial (operativo, accidente, evento, parada).\n\n` +
          `${d} **Canal de voz de la escena** — Si un oficial te detiene o estás en la escena, usá el canal de voz indicado.\n\n` +
          `${d} **Void** — **No reconocer** un hecho (como si no hubiera pasado). Solo cuando el **staff** o las reglas lo indiquen. No lo uses para “borrar” un error tuyo.`
      );

    const logistica = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.auto} Logística del vehículo`)
      .setDescription(
        `${f} **Licencia**\n` +
          `${d} Se gestiona con el bot (\`/perfil_swfl\` y comandos de staff).\n` +
          `${d} Si está **suspendida** o inactiva, regularizala antes de circular con normalidad.\n\n` +
          `${f} **Seguro**\n` +
          `${d} Podés contratarlo desde la **tienda del servidor**.\n` +
          `${d} Circular **sin seguro** puede terminar en multa u otras sanciones en rol.\n` +
          `${d} Solo puede haber **un plan de seguro activo** a la vez.\n\n` +
          `${f} **Matrícula / registro**\n` +
          `${d} Registrá tus vehículos con \`/matricular\` (flujo vigente del servidor).\n` +
          `${d} Respetá el formato del bot; no abuses del sistema ni uses placas falsas de forma OOC.\n\n` +
          `${f} **Multas**\n` +
          `${d} Se pagan por el sistema del bot cuando corresponda.\n` +
          `${d} Deudas colgadas afectan el perfil y pueden escalar (orden de arresto, etc.).\n\n` +
          `${f} **Trailers / acoplados**\n` +
          `${d} Solo si el juego y la sesión lo permiten, y sin bloquear vías ni generar caos.\n` +
          `${d} El host puede limitar o prohibir acoplados en esa sesión.`
      );

    const generales = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.warn || E.dot} Normas generales de conducción`)
      .setDescription(
        `${f} **Calidad de manejo**\n` +
          `${d} Conducí como si el tránsito importara: distancia, señales, sentido común.\n` +
          `${d} No uses el auto para romper escenas ajenas ni para “joder” a otros jugadores.\n\n` +
          `${f} **Crimen y persecuciones**\n` +
          `${d} Respetá peacetime, cupos criminales y lo que indique el host.\n` +
          `${d} Si no sos el **prio**, no te metas en la persecución a lo loco.\n` +
          `${d} No uses el crimen como excusa para FRP de manejo.\n\n` +
          `${f} **Chat y comunicación**\n` +
          `${d} En sesión, priorizá el rol. Evitá spam y discusiones OOC en canales de sesión.\n` +
          `${d} Si no tenés chat in-game, usá los canales de RP del Discord según la guía del server.\n\n` +
          `${f} **Emergencias (LEO / EMS / Bomberos)**\n` +
          `${d} Cedé el paso a vehículos de emergencia en rol cuando corresponda.\n` +
          `${d} No bloquees operativos ni te quedes mirando encima de la escena sin motivo.\n\n` +
          `${f} **Distancia y respeto de escena**\n` +
          `${d} No te tires encima de una scene activa sin razón IC.\n` +
          `${d} Si te piden alejarte (staff u oficiales en rol), cumplilo.\n\n` +
          `${f} **Accidentes**\n` +
          `${d} Si chocás, **roleá**: no digas “ex” y te vas.\n` +
          `${d} Intercambiá información cuando corresponda.\n` +
          `${d} **Chocar y huir** no se tolera.\n` +
          `${d} Reaparecer el vehículo **no borra** el rol del accidente.`
      );

    const velocidades = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.flecha} Velocidades y peacetime`)
      .setDescription(
        `${d} Los topes de abajo son el **estándar 00Y4n**. Si el host publica otro límite en el inicio, **ese manda**.\n\n` +
          `${f} **Referencia por peacetime**\n` +
          `${d} **Estricto** → hasta **75 MPH**\n` +
          `${d} **Normal** → hasta **85 MPH**\n` +
          `${d} **Sin peacetime** → hasta **120 MPH**\n\n` +
          `${f} **Cómo se aplica**\n` +
          `${d} Pasarte del límite vigente cuenta como infracción y puede ser **FRP** si es grave, repetido o a propósito.\n` +
          `${d} En zonas lentas (barrios, estacionamientos, spawn) andá **más despacio** aunque el tope de PT sea alto.\n` +
          `${d} Clima adverso: priorizá seguridad; el límite publicado sigue valiendo.\n\n` +
          `${f} **Sin peacetime**\n` +
          `${d} Hay más margen de acción, **no** carta blanca para destruir la sesión.\n` +
          `${d} Civilians y no-prio: responsabilidad. El caos injustificado sigue siendo sancionable.\n\n` +
          `${f} **Staff**\n` +
          `${d} Puede bajar el tope, pausar o cerrar la sesión si el manejo se va de las manos.\n` +
          `-# Parte 1 de 2 · Southwest Florida Comunidad 00Y4n ™`
      );

    return {
      embeds: [intro, terminologia, logistica, generales, velocidades]
    };
  }
};

/** Contenidos por sección (compatibilidad con menú antiguo / parte 2). */
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
            `${d} **FRP (Fail Roleplay)** — Conducta poco realista o que ignora el rol a propósito.\n\n` +
              `${d} **Velocidad FRP** — Límite en MPH. Superarlo puede ser infracción / FRP.\n\n` +
              `${d} **Intruso / leaker** — Quien no debería estar en la sesión.\n\n` +
              `${d} **Peacetime** — Estricto 75 · Normal 85 · Sin PT 120 (salvo que el host diga otro).\n\n` +
              `${d} **Prio** — Criminal prioritario con sin peacetime.\n\n` +
              `${d} **Scene** — Zona de atención especial.\n\n` +
              `${d} **Void** — No reconocer un hecho; solo con staff/reglas.`
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
            `${f} **Licencia** — Bot / perfil. Suspendida = regularizar.\n` +
              `${f} **Seguro** — Tienda del servidor; un plan a la vez.\n` +
              `${f} **Matrícula** — \`/matricular\`.\n` +
              `${f} **Multas** — Pago por bot; no dejes deudas.\n` +
              `${f} **Acoplados** — Solo si sesión/juego lo permiten.`
          )
      ]
    };
  }

  if (seccion === 'generales') {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(c)
          .setTitle(`${E.warn || E.dot} Normas generales`)
          .setDescription(
            `${d} Manejo realista · respetá peacetime y cupos · no rompas escenas ·\n` +
              `${d} Emergencias: ceder paso · accidentes: roleá, no huyas ·\n` +
              `${d} Reaparecer no borra el rol del choque.`
          )
      ]
    };
  }

  if (seccion === 'velocidades') {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(c)
          .setTitle(`${E.flecha} Velocidades y peacetime`)
          .setDescription(
            `${d} **Estricto 75** · **Normal 85** · **Sin PT 120** (o lo que diga el host).\n` +
              `${d} Pasarte del límite = infracción / posible FRP.\n` +
              `${d} Sin PT no es permiso para destruir la sesión.`
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
            `${f} **Autopista / vías rápidas**\n` +
              `${d} Izquierda más rápido · derecha entrar/salir y tráfico lento.\n` +
              `${d} No tejer carriles, no piques, no frenadas de prueba, no pararte en plena vía.\n\n` +
              `${f} **Calles estrechas**\n` +
              `${d} Velocidad baja, sin frenadas bruscas, estacioná bien.\n\n` +
              `${f} **Semáforos y stops**\n` +
              `${d} No te pases el rojo (en PT estricto, cero tolerancia).\n` +
              `${d} En cruce de cuatro vías, prioriza quien llegó primero.\n\n` +
              `${f} **Giros en U**\n` +
              `${d} Solo en intersecciones con semáforo, si es seguro. El resto prohibidos.\n\n` +
              `${f} **Clima**\n` +
              `${d} Lluvia/nieve: respetá el límite FRP. El clima no habilita manejar mal.`
          )
      ]
    };
  }

  if (seccion === 'frp') {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(c)
          .setTitle(`${E.warn} Imprudencia y Fail Roleplay (FRP)`)
          .setDescription(
            `${d} Conducción imprudente a propósito está **prohibida**.\n` +
              `${d} Cero tolerancia a FRP claro e irresponsabilidad al volante.\n` +
              `${d} Sentido común: si la guía no cubre un caso, no abuses.\n` +
              `${d} Al entrar a sesiones de 00Y4n **aceptás** estas normas.\n` +
              `-# Southwest Florida Comunidad 00Y4n ™`
          )
      ]
    };
  }

  return null;
}
