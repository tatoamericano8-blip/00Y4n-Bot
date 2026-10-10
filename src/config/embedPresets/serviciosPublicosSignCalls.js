import { EmbedBuilder } from 'discord.js';
import { ES } from '../emojisServicios.js';

const COLOR_SP = 0x1a1a1a;

/**
 * Preset: Sign Calls — Departamento Policial / Servicios Públicos 00Y4n
 * Explica qué son, cómo se asignan y cómo se usan en sesión.
 */
export default {
  id: 'sp_sign_calls',
  label: 'SP · Sign Calls',
  description: 'Guía de sign calls / identificadores de radio del departamento',

  build() {
    const intro = new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.alarm} Sign Calls — Guía del departamento`)
      .setDescription(
        [
          'Las **sign calls** (también llamadas *unit signs* o identificadores de radio) son el **código de unidad** de cada oficial en sesión.',
          '',
          'Sirven para que despacho y el resto del departamento sepan **quién habla**, **si está disponible** y **quién responde un llamado**, sin usar el nombre de Discord todo el tiempo.',
          '',
          `${ES.egpd} **Servicios Públicos 00Y4n** · Departamento Policial de Sarasota`
        ].join('\n')
      );

    const paraQue = new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.flecha} Para qué sirven`)
      .setDescription(
        [
          `${ES.dot} Identificarte en radio / chat de sesión (ejemplo: *Adam-12 en camino*, *2-L-5 en escena*)`,
          `${ES.dot} Organizar unidades: quién responde un llamado y quién está libre`,
          `${ES.dot} Evitar confusión cuando hay varios oficiales online`,
          `${ES.dot} Mantener un roleplay policial más ordenado y realista`
        ].join('\n')
      );

    const asignacion = new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.form} Cómo se asignan`)
      .setDescription(
        [
          `${ES.dot} El **liderazgo del departamento** (o quien gestione turnos) te da una sign al entrar o en tu primer turno.`,
          `${ES.dot} Suele verse en el nick de Discord, en el canal de turnos o en la lista del departamento.`,
          `${ES.dot} Ejemplos de formato: \`2-Adam-7\`, \`Lincoln-3\`, \`1-Boy-4\` (el formato exacto lo define el depto).`,
          '',
          `${ES.warn} **No te inventes una sign** si todavía no te la dieron. Pedila a un superior o por ticket de soporte.`,
          `${ES.dot} Si cambiás de rango o de unidad, la sign puede actualizarse.`
        ].join('\n')
      );

    const uso = new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.info} Cómo se usan en sesión`)
      .setDescription(
        [
          `${ES.flecha} **Al entrar en servicio**`,
          'Avisá por radio o salón con tu sign + estado.',
          'Ejemplo: *2-Adam-7, 10-8 / en servicio.*',
          '',
          `${ES.flecha} **Al responder un llamado**`,
          'Sign + que vas o que llegaste.',
          'Ejemplo: *2-Adam-7 en camino.* · *2-Adam-7 10-97 / en escena.*',
          '',
          `${ES.flecha} **Al salir de servicio**`,
          'Sign + fuera de servicio.',
          'Ejemplo: *2-Adam-7, 10-7.*',
          '',
          `${ES.dot} En el chat de sesión, anteponé o firmá con tu sign si el protocolo del departamento lo pide.`
        ].join('\n')
      );

    const codigos = new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.check} Códigos / estados frecuentes`)
      .setDescription(
        [
          'Orientativos. Si el departamento tiene lista propia en **#dp-información** o **#dp-ajustes**, esa lista manda.',
          '',
          `${ES.dot} **10-8** — En servicio / disponible`,
          `${ES.dot} **10-7** — Fuera de servicio`,
          `${ES.dot} **10-97** — En escena`,
          `${ES.dot} **10-6** — Ocupado (no disponible para otro llamado)`,
          `${ES.dot} **Prioridad / Code 3** — Respuesta urgente (según normas del servidor; no abuses)`,
          '',
          `${ES.dot} Si no hay lista publicada, usá lenguaje claro: *en camino*, *en escena*, *disponible*, *ocupado*.`,
          '',
          `${ES.warn} **No uses la sign de otro oficial.** Si alguien la usa mal, avisá a un superior.`,
          '',
          `-# ${ES.egpd} DPS / Servicios Públicos 00Y4n`
        ].join('\n')
      )
      .setFooter({ text: 'División de Servicios Públicos | 00Y4n' });

    return {
      embeds: [intro, paraQue, asignacion, uso, codigos],
      components: []
    };
  }
};
