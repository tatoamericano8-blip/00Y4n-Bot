import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';
import { ES, EMOJI_DEF_SERVICIOS } from '../emojisServicios.js';

const COLOR_SP = 0x1a1a1a;

function optEmoji(key) {
  const d = EMOJI_DEF_SERVICIOS[key];
  // Discord rechaza el mensaje entero si el emoji.id no existe / no es usable
  if (!d?.id || !/^\d{17,20}$/.test(String(d.id))) return undefined;
  return { id: String(d.id), name: d.name, animated: !!d.animated };
}

/**
 * FAQ Servicios Públicos — menú + embeds por categoría.
 * customId menú: embed_sp_faq_menu (nuevo; no toca otros).
 */
export default {
  id: 'servicios_publicos_faq',
  label: 'SP · Preguntas Frecuentes',
  description: 'FAQ de Servicios Públicos 00Y4n (menú por temas)',

  build() {
    const intro = new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.faq || ES.info} Preguntas Frecuentes · Servicios Públicos`)
      .setDescription(
        `${ES.flecha} Guía rápida para **ubicarte** en el servidor de **Servicios Públicos 00Y4n**.\n\n` +
          `${ES.dot} Elegí una sección en el menú de abajo.\n` +
          `${ES.dot} Si tu duda no está acá, abrí un **ticket de soporte**.\n\n` +
          `-# ${ES.lock} Ante la duda: leé el **Reglamento** y preguntá al staff de SP.`
      )
      .setFooter({ text: 'División de Servicios Públicos | 00Y4n' });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('embed_sp_faq_menu')
        .setPlaceholder('FAQ Servicios Públicos — elegí un tema')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          {
            label: 'General',
            description: 'Qué es SP, cómo empezar, reglas básicas',
            value: 'sp_faq_general',
            emoji: optEmoji('info') || optEmoji('dot')
          },
          {
            label: 'Postulaciones y Manager',
            description: 'Cómo postular, requisitos, formularios',
            value: 'sp_faq_postulacion',
            emoji: optEmoji('form') || optEmoji('perfil')
          },
          {
            label: 'Departamentos',
            description: 'Policía, bomberos, EMS y más',
            value: 'sp_faq_deptos',
            emoji: optEmoji('egpd') || optEmoji('check')
          },
          {
            label: 'Servicio y radio',
            description: 'Cómo operar en sesión y en radio/voz',
            value: 'sp_faq_radio',
            emoji: optEmoji('alarm') || optEmoji('warn')
          },
          {
            label: 'Sign Calls',
            description: 'Identificadores de radio: qué son y cómo se usan',
            value: 'sp_faq_sign_calls',
            emoji: optEmoji('alarm') || optEmoji('star')
          },
          {
            label: 'Cuotas y liderazgo',
            description: 'Cuotas, sanciones y roles de liderazgo',
            value: 'sp_faq_cuotas',
            emoji: optEmoji('check') || optEmoji('dot')
          },
          {
            label: 'Tickets y soporte',
            description: 'Cuándo y cómo pedir ayuda',
            value: 'sp_faq_tickets',
            emoji: optEmoji('faq') || optEmoji('reply')
          }
        )
    );

    return { embeds: [intro], components: [row] };
  }
};

/** Contenido por opción del menú (embeds efímeros). */
export function buildSpFaqEmbeds(value) {
  const map = {
    sp_faq_general: new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.info} FAQ · General`)
      .setDescription(
        `${ES.dot} **¿Qué es este servidor?**\n` +
          `Es la **División de Servicios Públicos de 00Y4n**: departamentos de emergencia (policía, etc.) vinculados al roleplay de Southwest Florida.\n\n` +
          `${ES.dot} **¿Cómo empiezo?**\n` +
          `1. Leé el canal **informativo / reglamento**.\n` +
          `2. Unite al server principal de 00Y4n si aún no estás.\n` +
          `3. Postulá con \`/solicitud-departamento\` (server principal) o el formulario que indiquen.\n` +
          `4. Esperá revisión del staff; no insistás en público.\n\n` +
          `${ES.dot} **¿Debo tener el pase de Servicios Públicos en el juego?**\n` +
          `Sí, cuando el juego lo exija para roles de emergencia. Sin el pase podés quedar fuera de ciertas operaciones.\n\n` +
          `${ES.dot} **Edad mínima**\n` +
          `Más de **13 años**. Micrófono y PC/laptop recomendados para servicio serio.`
      ),

    sp_faq_postulacion: new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.form || ES.perfil} FAQ · Postulaciones y Manager`)
      .setDescription(
        `${ES.dot} **¿Cómo me postulo a un departamento?**\n` +
          `En el servidor **principal** de 00Y4n usá \`/solicitud-departamento\` o el formulario oficial que publique el staff.\n\n` +
          `${ES.dot} **¿Puedo postularme a Manager / liderazgo?**\n` +
          `Solo si **ya estás en un departamento** de Servicios Públicos. Si no estás en ninguno, la postulación se rechaza.\n\n` +
          `${ES.dot} **Requisitos típicos**\n` +
          `Historial limpio · micrófono · buena comunicación en español · cumplir reglamento · respuestas propias (sin IA).\n\n` +
          `${ES.dot} **¿Cuánto tardan en revisar?**\n` +
          `Aprox. **una semana**. Si no hay respuesta, abrí un **ticket de soporte** (no spamees en chat).\n\n` +
          `${ES.dot} **Pedir que lean tu form antes de tiempo**\n` +
          `Puede hacer que te **rechacen** la postulación.`
      ),

    sp_faq_deptos: new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.egpd || ES.corona} FAQ · Departamentos`)
      .setDescription(
        `${ES.dot} **¿Qué departamentos hay?**\n` +
          `Policía del Condado / unidades de emergencia según lo publicado por Alto Comando. Solo **un departamento** a la vez en la mayoría de los casos.\n\n` +
          `${ES.dot} **¿El form me da el rol solo?**\n` +
          `No. El staff revisa, aprueba y asigna roles tras entrenamiento o inducción.\n\n` +
          `${ES.dot} **¿Dónde opero en Roblox?**\n` +
          `En las sesiones de Southwest Florida organizadas por 00Y4n, siguiendo al host y a tu superior de departamento.\n\n` +
          `${ES.dot} **Call-signs / identificaciones**\n` +
          `Las asigna el liderazgo del depto. No te inventes un rango ni un código que no te dieron. Ver también **Sign Calls** en este menú.`
      ),

    sp_faq_radio: new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.alarm || ES.warn} FAQ · Servicio y radio`)
      .setDescription(
        `${ES.dot} **¿Qué es la “radio” o el canal de operaciones?**\n` +
          `Es la **comunicación en servicio** (voz/texto del departamento) mientras operás: códigos, priorización, respeto y claridad. No es el chat general del server.\n\n` +
          `${ES.dot} **¿Cómo debo comportarme en servicio?**\n` +
          `Profesional · sin FRP · sin faltarle el respeto a civiles ni a compañeros · seguir códigos y órdenes del superior.\n\n` +
          `${ES.dot} **Si un superior maltrata a un subordinado en radio/voz**\n` +
          `Documentá (hora, canal, testigos) y reportá por **ticket** o a Alto Comando. No escales pelea en público.\n\n` +
          `${ES.dot} **Si varios no usan códigos / procedimientos**\n` +
          `Primero **corregí y enseñá**; strikes o anuncios solo si el liderazgo lo autoriza y es reiterado.\n\n` +
          `${ES.dot} **Conducción imprudente o abuso de poder**\n` +
          `Puede terminar en warn, strike, suspensión o baja, según gravedad y historial.`
      ),

    sp_faq_sign_calls: new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.alarm} FAQ · Sign Calls`)
      .setDescription(
        [
          'Las **sign calls** (unit signs / identificadores de radio) son el **código de unidad** de cada oficial en sesión.',
          '',
          `${ES.flecha} **Para qué sirven**`,
          `${ES.dot} Identificarte en radio/chat sin usar solo el nombre de Discord`,
          `${ES.dot} Saber quién está disponible, quién va a un llamado y quién está en escena`,
          `${ES.dot} Ordenar el RP policial cuando hay varios oficiales online`,
          '',
          `${ES.flecha} **Cómo se asignan**`,
          `${ES.dot} Las da el **liderazgo del departamento** (o quien gestione turnos)`,
          `${ES.dot} Suelen verse en nick de Discord, canal de turnos o lista del depto`,
          `${ES.dot} Ejemplos: \`2-Adam-7\`, \`Lincoln-3\`, \`1-Boy-4\` (el formato lo define el depto)`,
          `${ES.warn} **No te inventes una sign.** Si no te la dieron, pedila a un superior o por ticket.`,
          '',
          `${ES.flecha} **Cómo se usan**`,
          `${ES.dot} Entrar en servicio: *2-Adam-7, 10-8 / en servicio*`,
          `${ES.dot} Responder llamado: *2-Adam-7 en camino* · *2-Adam-7 10-97 / en escena*`,
          `${ES.dot} Salir de servicio: *2-Adam-7, 10-7*`,
          '',
          `${ES.flecha} **Códigos frecuentes** (si el depto tiene lista propia, esa manda)`,
          `${ES.dot} **10-8** — En servicio / disponible`,
          `${ES.dot} **10-7** — Fuera de servicio`,
          `${ES.dot} **10-97** — En escena`,
          `${ES.dot} **10-6** — Ocupado`,
          `${ES.dot} **Prioridad** — Respuesta urgente (sin abusar)`,
          '',
          `${ES.warn} No uses la sign de otro oficial. Si alguien la usa mal, avisá a un superior.`,
          '',
          `-# ${ES.egpd} DPS / Servicios Públicos 00Y4n`
        ].join('\n')
      ),

    sp_faq_cuotas: new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.corona || ES.star} FAQ · Cuotas y liderazgo`)
      .setDescription(
        `${ES.dot} **¿Qué son las cuotas?**\n` +
          `Metas mínimas de actividad (sesiones, servicio, etc.) que define el liderazgo. **No** las bajas por tu cuenta sin aprobación.\n\n` +
          `${ES.dot} **¿Cada cuánto se revisan?**\n` +
          `Según política interna (suele ser semanal o quincenal). Lo anuncia Alto Comando / Manager.\n\n` +
          `${ES.dot} **Roles de liderazgo (resumen)**\n` +
          `Manager / Alto Comando: supervisión, cuotas, casos serios.\n` +
          `Líderes de depto: operación diaria y mentoría.\n` +
          `Staff de depto: servicio en sesión y disciplina básica.\n\n` +
          `${ES.dot} **Sanciones posibles**\n` +
          `Strike de departamento · licencia administrativa · suspensión · terminación del equipo.`
      ),

    sp_faq_tickets: new EmbedBuilder()
      .setColor(COLOR_SP)
      .setTitle(`${ES.faq || ES.reply} FAQ · Tickets y soporte`)
      .setDescription(
        `${ES.dot} **¿Cuándo abro ticket?**\n` +
          `Dudas serias · reportes · postulaciones sin respuesta · conflictos de depto · bugs del panel SP.\n\n` +
          `${ES.dot} **¿Dónde?**\n` +
          `Canal de **asistencia / soporte** de este server (menú de tickets). No abras tickets falsos o de broma.\n\n` +
          `${ES.dot} **¿Quién atiende?**\n` +
          `Staff de Servicios Públicos. Solo ellos reclaman y cierran tickets de SP.\n\n` +
          `${ES.dot} **Tips al abrir**\n` +
          `Explicá qué, cuándo y adjuntá capturas. Sé respetuoso: el tono cuenta.`
      )
  };

  const emb = map[value];
  return emb ? [emb] : [];
}
