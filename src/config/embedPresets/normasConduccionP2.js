import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

/**
 * Normas de conducción — PARTE 2 (embeds directos, sin menú):
 * Carretera y circulación · Accidentes y aparición · Imprudencia y FRP
 * Mismo estilo que Parte 1: completo, claro, emojis custom solo en títulos.
 */
export default {
  id: 'normas_conduccion_p2',
  label: 'Normas de conducción · Parte 2',
  description: 'Carretera, circulación, accidentes, aparición, imprudencia y FRP',

  build() {
    const c = PRIMARIO;

    const intro = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.auto || ''} 00Y4n · Normas de conducción (Parte 2)`)
      .setDescription(
        [
          'Continuación de la guía de manejo. Acá entra lo del día a día en la vía y lo que el staff considera **imprudencia / FRP**.',
          '',
          '**Esta Parte 2 cubre:** carretera y circulación · accidentes y aparición · imprudencia y FRP.',
          'Si no leíste la **Parte 1** (terminología, peacetime, logística), conviene hacerlo antes: varios términos se usan acá.',
          '',
          'Lo que publique el host en el inicio de la sesión tiene prioridad sobre cualquier duda puntual.'
        ].join('\n')
      );

    const carretera = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.auto || ''} Carretera y circulación`)
      .setDescription(
        [
          '**Autopista / vías rápidas**',
          '• Carril **izquierdo:** más rápido / adelantar.',
          '• Carril **derecho:** entrar, salir y tráfico más lento.',
          '• **Prohibido:** tejer entre carriles, piques, frenadas de prueba o detenerte en plena vía sin motivo de rol.',
          'Con mucho tráfico el staff es más estricto.',
          '',
          '**Calles estrechas y zonas lentas**',
          'Velocidad baja, sin frenadas bruscas. Estacioná bien (paralelo, sentido correcto). No bloquees la calzada ni entradas.',
          '',
          '**Semáforos y stops**',
          'No te pases el rojo. En peacetime **estricto** casi no hay margen de error; en otros estados un error leve puede tolerarse una vez, no el abuso.',
          'En un **cruce de cuatro vías** (pare en todas), prioriza quien llegó primero. Dejá distancia con el auto de adelante.',
          '',
          '**Giros en U**',
          'Solo en intersecciones **con semáforo**, y solo si es seguro. El resto de giros en U están **prohibidos**, aunque no haya cartel.',
          '',
          '**Clima**',
          'Lluvia, niebla u otras condiciones: respetá el límite de peacetime publicado. Que cambie el clima **no** habilita manejar mal ni chocar “porque resbala” a propósito.'
        ].join('\n')
      );

    const accidentes = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.warn || ''} Accidentes y aparición del vehículo`)
      .setDescription(
        [
          '**Si chocás**',
          '• **Roleá** el accidente. No digas “ex” y te vayas.',
          '• Bajá del auto (o usá el chat de sesión) e **intercambiá información** cuando corresponda.',
          '• Si dañaste propiedad pública en rol (postes, semáforos, etc.), reportalo según el flujo del server.',
          '• **Chocar y huir** no se tolera: espera moderación fuerte.',
          '',
          '**Reaparición del vehículo**',
          '• **No** reaparezcas en medio de la calle ni encima de una escena.',
          '• Buscá casa, playa de estacionamiento vacía o zona segura.',
          '• Si tenés que reaparecer fuera de zona, pedí permiso en el chat de sesión.',
          '• Reaparecer **no borra** el rol del accidente ni una persecución en curso.',
          '',
          '**Al spawnear / aparecer en el mapa**',
          'Salí con velocidad baja. No salgas disparado del spawn ni uses el aparcamiento como pista.',
          'No bloquees lugares reservados del mapa ni generes embotellamiento a propósito.',
          'Mal estacionado de forma reiterada puede terminar en kick de sesión o sanción.'
        ].join('\n')
      );

    const frp = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.warn || ''} Imprudencia y Fail Roleplay (FRP)`)
      .setDescription(
        [
          '**Qué es conducción imprudente**',
          'Cualquier manejo **a propósito** que rompa la sesión: exceso grave, agresividad al volante, causar choques, chocar y huir, usar el auto para molestar, ignorar peacetime, etc. **Está prohibido**.',
          '',
          '**Por qué existe esta guía**',
          'La mayoría de estas normas están para **evitar FRP**, subir la calidad del manejo y cortar el caos. No es un listado infinito: se espera **sentido común**. Si algo se repite mucho, el staff puede sumar criterios.',
          '',
          '**Cero tolerancia**',
          'Comportamiento irresponsable y FRP claro se moderan con firmeza. Generar un ambiente imprudente de forma continua termina en sanción (warn, kick de sesión, suspensión de eventos u otras medidas según el caso).',
          '',
          '**Qué esperamos en 00Y4n**',
          'Si seguís la Parte 1 y la Parte 2, casi no vas a tener problemas con el staff.',
          'El staff no está para “cazar” gente: está para que la sesión se disfrute. Sí moderamos a quien rompe el estándar.',
          '',
          'Al estar en el servidor y entrar a sesiones, **aceptás** estas normas de conducción.',
          '',
          '-# Parte 2 de 2 · Southwest Florida Comunidad 00Y4n'
        ].join('\n')
      );

    return {
      embeds: [intro, carretera, accidentes, frp]
    };
  }
};
