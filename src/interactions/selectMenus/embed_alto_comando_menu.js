import { MessageFlags, EmbedBuilder } from 'discord.js';
import { E } from '../../config/emojis.js';
import { PRIMARIO } from '../../utils/colores.js';

function buildQueEs() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.staff || E.corona} Qué es Alto Comando`)
        .setDescription(
          [
            '**Alto Comando** no es solo un rango: es **liderazgo operativo** del staff.',
            '',
            `${E.dot} **Dentro del servidor:** sesiones, moderación, cuotas, tickets, coordinación y respaldo al Bajo Comando.`,
            `${E.dot} **En Roblox:** calidad de sesión, control de FRP, apoyo al host y decisiones en el momento.`,
            `${E.dot} **Fuera del servidor:** representás a 00Y4n. Nada de filtrar info de staff, planes o casos internos.`,
            '',
            '**Mentalidad esperada**',
            '-# • Dar el ejemplo (actividad, tono, disciplina).',
            '-# • Resolver antes de escalar; escalar cuando el caso lo merece.',
            '-# • No improvisar políticas nuevas sin Propietarios / Gerencia.',
            '-# • Priorizar la comunidad y la calidad del roleplay, no el ego del rango.'
          ].join('\n')
        )
        .setFooter({ text: 'Manual Alto Comando · 00Y4n' })
    ]
  };
}

function buildRoles() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.corona || E.staff} Roles y autoridad`)
        .setDescription(
          [
            'Orden de referencia (de mayor a menor alcance). Cada uno **cumple y respalda** al de abajo.',
            '',
            `**Supervisor Ejecutivo** — Dirección máxima operativa. Cambios grandes, conflictos altos, última palabra en casos críticos.`,
            `**Co-Fundador** — Visión y respaldo fundacional. Decisiones estratégicas con Propietarios.`,
            `**Equipo de Propietarios** — Dueños / dirección. Control total del servidor y de la línea 00Y4n.`,
            `**Gerente de Staff** — Responsable del equipo. Evaluación, organización, nexo dirección ↔ staff diario.`,
            `**Senior Administrador** — Admin avanzada. Temas sensibles, sanciones pesadas, apoyo a Gerencia.`,
            `**Supervisor** — Supervisa rendimiento en sesiones y Discord. Corrige, reporta y cuida protocolos.`,
            `**Server Administrator** — Permisos amplios. Config, moderación fuerte, casos que superan al staff regular.`,
            `**Coordinador de Staff** — Turnos, cobertura, comunicación interna. Orden operativo del día a día.`,
            `**Alto Comando** — Núcleo de liderazgo staff. Supervisión, casos serios y guía del Bajo Comando.`,
            '',
            `${E.warn} Tener el rol **no** autoriza saltarse la cadena: si el caso es de Propietarios/Gerencia, **escalá**.`
          ].join('\n')
        )
        .setFooter({ text: 'Manual Alto Comando · 00Y4n' })
    ]
  };
}

function buildObligaciones() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.tilde || E.mitadestrella} Obligaciones y cuota`)
        .setDescription(
          [
            'Si tenés el rol **00Y4n Staff**, la meta es **la misma** para todos (incluido Alto Comando):',
            '',
            `${E.dot} **4 sesiones** por semana (host / co-host / supervisadas) — **obligatorio**.`,
            `${E.dot} **2 tickets** atendidos — **opcionales**, pero suman al score y se recomienda cumplirlos.`,
            '',
            '**También se espera**',
            '-# • Presencia en Discord (chat staff, avisos, cobertura cuando haga falta).',
            '-# • Responder consultas de Bajo Comando en tiempo razonable.',
            '-# • Usar LOA si no vas a poder cumplir (no desaparecer sin avisar).',
            '-# • Revisar tu progreso en `/staff-perfil`.',
            '',
            `${E.flecha} Incumplir de forma reiterada sin LOA puede derivar en revisión por Gerencia / Propietarios.`
          ].join('\n')
        )
        .setFooter({ text: 'Manual Alto Comando · 00Y4n' })
    ]
  };
}

function buildSupervision() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.manual} Supervisión de sesiones`)
        .setDescription(
          [
            'Supervisar **no** es “estar en el privado sin hacer nada”. Es **calidad + respaldo al host**.',
            '',
            '**En sesión**',
            '-# • Estar atento a FRP, toxicidad, cupos y flujo del host.',
            '-# • Intervenir si el host no puede o se desborda; no humillar al host en público.',
            '-# • Apoyar reinvites, orden en chat y claridad de reglas cuando haga falta.',
            '',
            '**Registro**',
            '-# • Usá los comandos de supervisión del bot (`/supervisar_swfl`, `/log-supervision`) cuando corresponda.',
            '-# • Rating 1–5 + notas honestas y útiles para el host.',
            '-# • El host recibe el feedback; no inventes notas para “quedar bien”.',
            '',
            `${E.dot} Si ves un patrón malo en un host, **documentá** y hablalo en canales de staff / Gerencia.`
          ].join('\n')
        )
        .setFooter({ text: 'Manual Alto Comando · 00Y4n' })
    ]
  };
}

function buildGestionBc() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.msj || E.manual} Gestión del Bajo Comando`)
        .setDescription(
          [
            'El Bajo Comando **aprende de vos**. Si improvisás, ellos improvisan.',
            '',
            '**Debés**',
            '-# • Orientar Aprendices / Junior / Server en dudas de sesión y moderación.',
            '-# • Corregir en privado cuando sea posible; público solo si es necesario y con respeto.',
            '-# • Asegurar cobertura: que haya host/sup cuando se anuncia sesión.',
            '-# • Reportar inactividad o mala conducta de staff por los canales correctos.',
            '',
            '**No debés**',
            '-# • Dejar que un Aprendiz maneje casos graves solo.',
            '-# • Prometer ascensos, permisos o excepciones que no te corresponden.',
            '-# • Discutir decisiones internas delante de civiles.',
            '',
            `${E.flecha} Si alguien del BC se pasa de autoridad, frenalo y escalá si hace falta.`
          ].join('\n')
        )
        .setFooter({ text: 'Manual Alto Comando · 00Y4n' })
    ]
  };
}

function buildCasos() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.warn} Casos serios y moderación`)
        .setDescription(
          [
            '**Cadena típica (civiles):** warn → timeout → strike → kick/ban según gravedad.',
            '',
            '**Alto Comando interviene cuando**',
            '-# • El caso supera al staff de turno.',
            '-# • Hay acoso, exploits, amenazas, multi-cuentas o filtraciones.',
            '-# • Hay conflicto entre staff o abuso de poder.',
            '-# • Se requiere investigación formal (`/investigacion` y rol Bajo investigación).',
            '',
            '**Reglas de oro**',
            '-# • Motivo claro y evidencia cuando exista.',
            '-# • No sancionar “de bronca”; documentá en logs/tickets.',
            '-# • Bans / casos políticos / PR → **Propietarios / Gerencia**.',
            '-# • No filtrar datos de tickets, DMs de staff ni investigaciones.',
            '',
            `${E.lock} Fuera de Discord: no comentes casos internos en TikTok, otros servers o DMs a civiles.`
          ].join('\n')
        )
        .setFooter({ text: 'Manual Alto Comando · 00Y4n' })
    ]
  };
}

function buildConducta() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.lock || E.warn} Conducta y confidencialidad`)
        .setDescription(
          [
            '**Dentro de 00Y4n**',
            '-# • Tono profesional en texto y voz.',
            '-# • No toxicidad, no favoritismos visibles, no humillar miembros ni staff.',
            '-# • Respetar formatos de sesión y decisiones de host salvo riesgo real.',
            '',
            '**Fuera del servidor**',
            '-# • Segís representando a 00Y4n si la gente te asocia al staff.',
            '-# • **Prohibido** filtrar: canales staff, comandos internos, planes, listas, sanciones, DMs.',
            '-# • No reclutar “en secreto” para otros proyectos usando contactos hechos aquí.',
            '-# • No hablar mal del servidor ni del staff en público; los reclamos van por ticket / HC.',
            '',
            `${E.cruz} Filtrar información de staff o romper confidencialidad puede terminar en **remoción del equipo**.`
          ].join('\n')
        )
        .setFooter({ text: 'Manual Alto Comando · 00Y4n' })
    ]
  };
}

function buildComandos() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.flecha || E.manual} Comandos y canales clave`)
        .setDescription(
          [
            '**Perfil y cuota**',
            '-# `/staff-perfil` — progreso, sesiones, tickets, score.',
            '',
            '**Sesiones**',
            '-# `/inicio` · `/lanzar_rp` · `/lanzar_meet` · `/cerrar` · `/reinvitaciones` · `/forzar-cierre`',
            '-# Supervisión: `/supervisar_swfl` · `/log-supervision`',
            '',
            '**Staff / liderazgo**',
            '-# Panel staff, LOA, investigación, sanciones según tu rango y permisos del bot.',
            '-# No uses comandos de Propietarios si no te corresponde el rol.',
            '',
            '**Canales (orientativo)**',
            '-# Chat staff · coordinación · cuotas · logs · anuncios staff · tickets/asistencia.',
            '',
            `${E.dot} Si un comando no te aparece, **no** es bug: no tenés el permiso de ese rango.`,
            `${E.dot} Ante duda de procedimiento: preguntá en el canal de Alto Comando / Gerencia, no inventes.`
          ].join('\n')
        )
        .setFooter({ text: 'Manual Alto Comando · 00Y4n' })
    ]
  };
}

export default {
  name: 'embed_alto_comando_menu',

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
    switch (value) {
      case 'que_es':
        payload = buildQueEs();
        break;
      case 'roles':
        payload = buildRoles();
        break;
      case 'obligaciones':
        payload = buildObligaciones();
        break;
      case 'supervision':
        payload = buildSupervision();
        break;
      case 'gestion_bc':
        payload = buildGestionBc();
        break;
      case 'casos':
        payload = buildCasos();
        break;
      case 'conducta':
        payload = buildConducta();
        break;
      case 'comandos':
        payload = buildComandos();
        break;
      default:
        payload = null;
    }

    if (!payload?.embeds?.length) {
      return interaction.editReply({
        content: E.cruz + ` Sección \`${value}\` no configurada.`
      });
    }

    return interaction.editReply({
      embeds: payload.embeds,
      components: []
    });
  }
};
