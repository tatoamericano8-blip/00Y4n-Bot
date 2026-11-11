import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

/**
 * Parte 1 completa y legible.
 * Emojis custom solo en títulos (ahorra caracteres para el contenido).
 * embed-send parte el envío si se acerca al límite de 6000.
 */
export default {
  id: 'normas_conduccion',
  label: 'Normas de conducción · Parte 1',
  description: 'Terminología, logística, normas generales, velocidades y peacetime',

  build() {
    const c = PRIMARIO;

    const intro = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.auto || ''} 00Y4n · Normas de conducción (Parte 1)`)
      .setDescription(
        [
          'Guía oficial de manejo en sesión. El objetivo es un tránsito **realista, ordenado y jugable**.',
          '',
          '**Esta Parte 1 cubre:** terminología · logística del vehículo · normas generales · velocidades y peacetime.',
          '**Parte 2** (carretera, intersecciones, clima e imprudencia/FRP) se publica aparte.',
          '',
          'Si el host publica un límite distinto en el inicio de la sesión, **ese número manda**.'
        ].join('\n')
      );

    const terminologia = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.manual || E.carpeta || ''} Terminología (qué significa cada cosa)`)
      .setDescription(
        [
          '**FRP (Fail Roleplay)**',
          'Cualquier acción **poco realista** o que ignore el rol a propósito: manejo absurdo, romper una escena, fingir que no pasó algo importante, etc. El staff puede sancionar FRP en sesión.',
          '',
          '**Velocidad FRP**',
          'Es el **límite de velocidad del servidor**, medido en **MPH**. Superarlo puede ser infracción (multa/warn en rol) y, si es grave o a propósito, tratarse como **FRP**.',
          '',
          '**Intruso / leaker**',
          'Persona que **no debería** estar en la sesión (entró sin acceso, usó un link filtrado, cuenta que no corresponde, etc.). Si ves uno, **avisá al staff**.',
          '',
          '**Peacetime (PT)** — nivel de control de la sesión (lo define host/staff):',
          '• **Estricto** → máximo control; tope orientativo **75 MPH**',
          '• **Normal** → tránsito ordenado; tope orientativo **85 MPH**',
          '• **Sin peacetime** → más acción; tope orientativo **120 MPH**',
          '',
          '**Prio (prioridad)**',
          'Cuando la sesión está **sin peacetime**, el **prio** es el criminal prioritario de la escena. Si **no** sos el prio, conducí con responsabilidad y no te metas en la persecución a lo loco.',
          '',
          '**Scene (escena)**',
          'Zona de la sesión que pide atención especial: operativo policial, accidente, evento, parada de tráfico, etc. No la uses de estacionamiento ni la atravieses sin motivo.',
          '',
          '**Void**',
          'Significa **no reconocer** un hecho (como si no hubiera pasado). **Solo** cuando el staff o las reglas lo indiquen. No sirve para “borrar” un error tuyo.'
        ].join('\n')
      );

    const logistica = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.auto || ''} Logística del vehículo`)
      .setDescription(
        [
          '**Licencia**',
          'Se gestiona con el bot (por ejemplo en `/perfil_swfl` y comandos de staff). Si está **suspendida** o inactiva, regularizala antes de circular con normalidad en sesión.',
          '',
          '**Seguro**',
          'Se contrata desde la **tienda del servidor**. Circular sin seguro puede terminar en multa u otras sanciones en rol. Solo puede haber **un plan de seguro activo** a la vez.',
          '',
          '**Matrícula / registro**',
          'Registrá tu(s) vehículo(s) con `/matricular` (o el flujo vigente del server). Usá el formato que pida el bot; no abuses del sistema.',
          '',
          '**Multas**',
          'Se pagan con el sistema del bot cuando corresponda. No dejes deudas colgadas: afectan el perfil y pueden escalar (por ejemplo orden de arresto).',
          '',
          '**Trailers / acoplados**',
          'Solo si el juego y la sesión lo permiten, y sin bloquear vías. El host puede limitarlos o prohibirlos en esa sesión.'
        ].join('\n')
      );

    const generales = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.warn || ''} Normas generales de conducción`)
      .setDescription(
        [
          '**Calidad de manejo**',
          'Conducí como si el tránsito importara: distancia, carriles, señales y sentido común. El auto no es una herramienta para romper el rol de otros.',
          '',
          '**Crimen y persecuciones**',
          'Respetá peacetime, cupos criminales y lo que diga el host. Si no sos el **prio**, no te sumes a la persecución de forma caótica. El crimen no justifica FRP de manejo.',
          '',
          '**Emergencias (policía / EMS / bomberos)**',
          'En rol, cedé el paso cuando corresponda. No bloquees un operativo ni te quedes encima de la escena sin motivo IC.',
          '',
          '**Distancia y escenas**',
          'No te tires sobre una scene activa sin razón. Si staff u oficiales en rol te piden alejarte, cumplilo.',
          '',
          '**Accidentes**',
          'Si chocás, **roleá**: no digas “ex” y te vayas. Intercambiá información cuando corresponda. **Chocar y huir** no se tolera. Reaparecer el vehículo **no borra** el rol del accidente.'
        ].join('\n')
      );

    const velocidades = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.flecha || ''} Velocidades y peacetime`)
      .setDescription(
        [
          '**Topes estándar 00Y4n** (si el host publica otro, manda el del host):',
          '• Peacetime **estricto** → hasta **75 MPH**',
          '• Peacetime **normal** → hasta **85 MPH**',
          '• **Sin peacetime** → hasta **120 MPH**',
          '',
          '**Cómo se aplica**',
          'Pasarte del límite vigente es infracción. Si el exceso es grave, repetido o a propósito, puede contarse como **FRP**.',
          'En barrios, spawn, estacionamientos y zonas lentas andá **más despacio**, aunque el tope de PT sea alto.',
          '',
          '**Sin peacetime**',
          'Hay más margen de acción, **no** carta blanca. Civiles y quienes no son prio siguen teniendo que manejar con responsabilidad. El caos injustificado se sanciona.',
          '',
          '**Staff**',
          'Puede bajar el tope, pausar o cerrar la sesión si el manejo se va de las manos.',
          '',
          '-# Parte 1 de 2 · Southwest Florida Comunidad 00Y4n'
        ].join('\n')
      );

    return {
      embeds: [intro, terminologia, logistica, generales, velocidades]
    };
  }
};

export function buildSeccionNormasConduccion(seccion) {
  const c = PRIMARIO;
  const map = {
    terminologia: {
      title: `${E.manual || ''} Terminología`,
      desc: 'FRP, velocidad FRP, intruso/leaker, peacetime (75/85/120), prio, scene y void (solo staff).'
    },
    logistica: {
      title: `${E.auto || ''} Logística`,
      desc: 'Licencia, seguro (un plan), /matricular, multas y acoplados según sesión.'
    },
    generales: {
      title: `${E.warn || ''} Normas generales`,
      desc: 'Manejo realista, peacetime/cupos, emergencias, no romper escenas, accidentes se rolean.'
    },
    velocidades: {
      title: `${E.flecha || ''} Velocidades`,
      desc: 'Estricto 75 · Normal 85 · Sin PT 120. Pasarte del tope = infracción / posible FRP.'
    },
    circulacion: {
      title: `${E.auto || ''} Carretera`,
      desc: 'Carriles, semáforos, stops, giros en U y clima. Detalle completo en Parte 2.'
    },
    frp: {
      title: `${E.warn || ''} FRP`,
      desc: 'Imprudencia a propósito prohibida. Cero tolerancia a FRP claro.'
    }
  };
  const item = map[seccion];
  if (!item) return null;
  return {
    embeds: [new EmbedBuilder().setColor(c).setTitle(item.title).setDescription(item.desc)]
  };
}
