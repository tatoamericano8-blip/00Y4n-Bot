import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

export default {
  id: 'faq',
  label: 'Preguntas Frecuentes (FAQ)',
  description: 'FAQ general del servidor (varios embeds)',

  build() {
    const e1 = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.faq || E.msj} Preguntas Frecuentes (FAQ)`)
      .setDescription(
        `**Si tu duda no está acá, abrí un ticket.**\n\n` +
          `${E.dot} **1.** ${E.flecha} **¿Qué es este servidor?**\n` +
          `Comunidad SWFL 00Y4n: roleplay en Roblox, sesiones, car meets y departamentos.\n` +
          `Al quedarte aceptás reglas del Discord, reglamento de RP y Términos de Discord/Roblox.\n\n` +
          `${E.dot} **2.** ${E.flecha} **¿Cómo empiezo?**\n` +
          `Leé reglas y reglamento · verificá · mirá anuncios · esperá sesión del staff · reaccioná al inicio cuando corresponda.\n\n` +
          `${E.dot} **3.** ${E.flecha} **¿Qué es una sesión?**\n` +
          `Evento de RP abierto/cerrado por staff.\n` +
          `Orden: 1) Inicio (voto) → 2) Reacciones → 3) Lanzamiento RP/meet → 4) Reinvitaciones/FastPass → 5) Cierre.\n` +
          `Seguí siempre al host, co-host y staff.`
      );

    const e2 = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.faq || E.msj} FAQ · Sesión y RP`)
      .setDescription(
        `${E.dot} **4.** ${E.flecha} **¿Tengo que votar para entrar?**\n` +
          `Sí, en casi todos los casos. Sin voto puede no darse el link. FastPass también exige voto en el inicio. **Filtrar links = ban.**\n\n` +
          `${E.dot} **5.** ${E.flecha} **¿Qué es el FastPass?**\n` +
          `Acceso prioritario con el rol/beneficio. Se reclama en el botón del anuncio (cumpliendo requisitos y voto). No compartir el link.\n\n` +
          `${E.dot} **6.** ${E.flecha} **¿Qué es Peacetime?**\n` +
          `Límite de velocidad / FRP:\n` +
          `• Estricto → 75 MPH · Normal → 85 MPH · Sin PT → 120 MPH\n` +
          `En PT: 1 prioridad a la vez, cooldown 5 min; en prioridad otro tope (ej. 145). El host lo anuncia.\n\n` +
          `${E.dot} **7.** ${E.flecha} **¿Qué es FRP?**\n` +
          `Acciones irreales que rompen la inmersión. Puede sancionarse.\n\n` +
          `${E.dot} **8.** ${E.flecha} **¿Cómo registro mi vehículo?**\n` +
          `\`/matricular registrar\` — circular sin matrícula puede traer control y multas.`
      );

    const e3 = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.faq || E.msj} FAQ · Economía y ley`)
      .setDescription(
        `${E.dot} **9.** ${E.flecha} **Economía**\n` +
          `Saldo por jugador:\n` +
          `\`/work\` · \`/crime\` · \`/recolectar\` · oportunidades en chat · \`/robar-banco\` · \`/pagar\`\n\n` +
          `${E.dot} **10.** ${E.flecha} **Multas**\n` +
          `Policía: \`/multar\` · Pagás: \`/pagar-multa\` (~7 días). Sin pago → orden de arresto.\n\n` +
          `${E.dot} **11.** ${E.flecha} **Orden de arresto**\n` +
          `Por multas u otras causas. Regularizala con policía/staff; no la ignores en sesión.\n\n` +
          `${E.dot} **12.** ${E.flecha} **Departamentos**\n` +
          `\`/solicitud-departamento\` → Policía · Bomberos · EMS · Sheriff (puede pedir pase Robux + pruebas).\n` +
          `El form no da el rol solo: revisa staff. *Postulaciones pausadas hasta la revamp.*\n\n` +
          `${E.dot} **13.** ${E.flecha} **Licencias**\n` +
          `Sistema 00Y4n (staff/depto). Multas pueden suspender o revocar. Con licencia baja no conduzcas en sesión.`
      );

    const e4 = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.faq || E.msj} FAQ · Comandos y staff`)
      .setDescription(
        `${E.dot} **14.** ${E.flecha} **Comandos útiles**\n` +
          `\`/perfil_swfl\` · \`/work\` · \`/crime\` · \`/recolectar\` · \`/pagar\` · \`/pagar-multa\` · \`/matricular\` · \`/solicitud-departamento\`\n` +
          `Si no ves un comando, no tenés permiso.\n\n` +
          `${E.dot} **15.** ${E.flecha} **Staff y sanciones**\n` +
          `Warn, timeout, strike, kick o ban. No discutás sanciones en público: usá ticket. Suplantar staff está prohibido.`
      );

    const e5 = new EmbedBuilder()
      .setColor(PRIMARIO)
      .setTitle(`${E.faq || E.msj} FAQ · Comunidad`)
      .setDescription(
        `${E.dot} **16.** ${E.flecha} **Horarios de sesión**\n` +
          `Varían según staff. Revisá anuncios y canales de sesión.\n\n` +
          `${E.dot} **17.** ${E.flecha} **Boost y roles**\n` +
          `Boost puede dar beneficios. FastPass y similares los da staff/bot. No compres ni vendas roles, cuentas ni accesos.\n\n` +
          `${E.dot} **18.** ${E.flecha} **Tickets**\n` +
          `Reportes, sanciones, bugs o dudas serias. Indicá qué, cuándo y capturas.\n\n` +
          `${E.dot} **19.** ${E.flecha} **Seguridad**\n` +
          `No compartas contraseñas ni códigos. El staff no pide tu cuenta por DM. Reportá scams.\n\n` +
          `${E.dot} **20.** ${E.flecha} **Publicidad**\n` +
          `Sin otros servers ni spam sin permiso.\n\n` +
          `${E.dot} **21.** ${E.flecha} **Apelaciones**\n` +
          `Canal/ticket de apelaciones, con respeto y pruebas. No garantiza quitar la sanción.\n\n` +
          `${E.dot} **22.** ${E.flecha} **El bot falló**\n` +
          `Esperá unos minutos y reintentá. Si sigue, ticket con comando, hora y captura.\n\n` +
          `${E.dot} **23.** ${E.flecha} **Resumen**\n` +
          `Reglas · Verificación · Votar · No FRP · No filtrar links · Matricular · Pagar multas · Respetar staff`
      )
      .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

    return { embeds: [e1, e2, e3, e4, e5] };
  }
};
