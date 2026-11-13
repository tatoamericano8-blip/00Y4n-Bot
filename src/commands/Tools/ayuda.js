import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  MessageFlags
} from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E, EMOJI_DEF } from '../../config/emojis.js';

function optEmoji(key) {
  const d = EMOJI_DEF[key];
  if (!d?.id) return undefined;
  return { id: d.id, name: d.name, animated: Boolean(d.animated) };
}

const d = () => E.dot || '•';
const f = () => E.flecha || '→';

/** Contenido completo de ayuda por categoría */
const SECCIONES = {
  inicio: {
    label: 'Primeros pasos',
    title: `${E.tilde || '✅'} Primeros pasos en 00Y4n`,
    desc: [
      `${d()} **Bienvenida** — Leé los canales de información y las normas del server.`,
      `${d()} **Verificación** — Completá Bloxlink / verificación si el server lo pide (\`/verificacion-bloxlink\` o el panel del canal).`,
      `${d()} **Grupo Roblox** — Unite al grupo oficial de la comunidad antes de entrar a sesiones.`,
      `${d()} **Normas de conducción** — Publicadas con \`/embed-send\` (Parte 1 y Parte 2). Obligatorias en sesión.`,
      `${d()} **Perfil** — \`/perfil_swfl\` muestra dinero, licencia, historial y más.`,
      '',
      `${f()} **Flujo típico de una sesión RP/Meet**`,
      `${d()} 1. Staff: \`/inicio\` (voto / reacciones)`,
      `${d()} 2. Al llegar la meta: \`/comienzo-rp\` o \`/comienzo-meet\``,
      `${d()} 3. Ciudadanos: reaccionan / usan **Link de la sesión** o FastPass según corresponda`,
      `${d()} 4. Staff: \`/cerrar\` al terminar`,
      '',
      `${d()} **Ayuda de este menú** — Elegí otra categoría abajo para ver comandos por tema.`
    ].join('\n')
  },

  sesiones: {
    label: 'Sesiones',
    title: `${E.auto || '🚗'} Sesiones (RP y Car Meet)`,
    desc: [
      `${f()} **Ciclo de sesión**`,
      `${d()} \`/inicio\` — Abre el conteo de reacciones / anuncio de sesión.`,
      `${d()} \`/comienzo-rp\` — Libera accesos de **Roleplay** (link, peacetime, límite de velocidad).`,
      `${d()} \`/comienzo-meet\` — Libera accesos de **Car Meet**.`,
      `${d()} \`/cerrar\` — Cierra la sesión (pagos, notas, opinión).`,
      `${d()} \`/forzar-cierre\` — Cierre forzado con motivo (staff alto).`,
      '',
      `${f()} **Durante la sesión**`,
      `${d()} \`/host\` / \`/host_swfl\` — Registrar host / co-host.`,
      `${d()} \`/finalizar_host\` — Dejar de co-hostear.`,
      `${d()} \`/reingreso\` — Nuevo mensaje de acceso si alguien llegó tarde.`,
      `${d()} \`/fastpass_swfl\` — Acceso prioritario (se bloquea si la sesión ya empezó).`,
      `${d()} \`/regenerar\` — Regenerar link de sesión.`,
      `${d()} \`/special-roleplay\` — Roleplays especiales (funeral, cars & coffee, etc.).`,
      `${d()} \`/session\` — Herramientas extra de sesión (bar/unbar, etc.).`,
      '',
      `${f()} **Staff de sesión**`,
      `${d()} \`/sesion-blacklist\` · \`/sesion-suspender\` — Restricciones a usuarios en sesiones.`,
      `${d()} \`/supervisar_swfl\` · \`/log-supervision\` — Supervisión y rating del host.`
    ].join('\n')
  },

  economia: {
    label: 'Economía y juegos',
    title: `${E.dinero || E.gift || '💰'} Economía y juegos`,
    desc: [
      `${f()} **Dinero diario**`,
      `${d()} \`/work\` — Trabajar (historial / situaciones).`,
      `${d()} \`/crime\` — Crimen (~50% éxito / fallo).`,
      `${d()} **Oportunidades económicas** — Mensajes en el canal general; botón **Reclamar**. Tras reclamar, el mensaje se borra a los 15 min.`,
      '',
      `${f()} **Tienda y pagos**`,
      `${d()} \`/tienda\` — Permisos, seguros y ítems del server.`,
      `${d()} \`/pagar-multa\` — Pagar multas activas.`,
      `${d()} \`/gestionar-dinero\` — Staff: sumar/quitar saldo (admin).`,
      `${d()} \`/auditoria-financiera\` — Revisión de movimientos.`,
      `${d()} \`/resetear-economia\` — Solo alto mando (peligroso).`,
      '',
      `${f()} **Mercado y azar**`,
      `${d()} \`/bolsa\` — Bolsa de valores 00Y4n (comprar / vender / cartera / mercado).`,
      `${d()} \`/loteria\` — Boletos y pozo (\`comprar\` · \`pozo\` · \`ultimo\`).`,
      `${d()} \`/sorteo\` — Sorteos del server (solo Equipo de Propietarios: iniciar / finalizar / reroll).`,
      `${d()} \`/blackjack\` — Blackjack con apuesta.`,
      `${d()} \`/juegos\` — Menú de juegos (adivina el auto, slots, cara o cruz, etc.).`,
      `${d()} \`/robar-banco\` — Robo al banco en grupo (\`iniciar\` · \`unirse\` · \`intervenir\`).`
    ].join('\n')
  },

  perfil: {
    label: 'Perfil y ranking',
    title: `${E.msj || '📋'} Perfil, ranking y registros`,
    desc: [
      `${d()} \`/perfil_swfl\` — Perfil del ciudadano: dinero, licencia, historial, logros, orden de arresto si aplica.`,
      `${d()} \`/tabla-posiciones\` — Ranking (mensajes, economía, reacciones, host staff, horas).`,
      `${d()} \`/ciudadano\` / sistema **Ciudadano del Día** — Premio diario automático + MD.`,
      `${d()} \`/matricular\` — Registrar / remover vehículos y permisos de matrícula.`,
      `${d()} \`/licencia\` · \`/licencia_swfl\` — Estado de licencia (activa / suspendida / revocada).`,
      `${d()} \`/buscar-patente\` — Buscar matrícula registrada.`,
      `${d()} \`/membercount_swfl\` — Conteo de miembros al estilo anuncio.`,
      `${d()} \`/estadisticas\` — Stats del server.`,
      `${d()} \`/hito-miembros\` — Hitos de cantidad de miembros.`
    ].join('\n')
  },

  policia: {
    label: 'Policía / MDT',
    title: `${E.esposas || '👮'} Policía, multas y MDT`,
    desc: [
      `${d()} \`/multar\` — Emitir multa (códigos / montos del sistema).`,
      `${d()} \`/multa-remover\` — Anular multa.`,
      `${d()} \`/pagar-multa\` — El ciudadano paga desde su saldo.`,
      `${d()} \`/arrestar\` — Registrar arresto (si había Orden de Arresto, se cumple y se quita el rol).`,
      `${d()} \`/arresto-remover\` — Quitar / anular arresto.`,
      `${d()} \`/historial-arrestos\` — Ver historial.`,
      `${d()} \`/orden\` — Gestión de órdenes relacionadas.`,
      `${d()} \`/mdt\` — Panel MDT / navegación policial del bot.`,
      `${d()} \`/buscar-patente\` — Consulta de placas.`,
      '',
      `${f()} **Servicios Públicos (otro server)**`,
      `${d()} \`/solicitud-departamento\` — Formulario para postularse (policía, EMS, bomberos).`,
      `${d()} Tickets y embeds de SP se manejan con presets de \`/embed-send\` en ese servidor.`
    ].join('\n')
  },

  staff: {
    label: 'Staff',
    title: `${E.staff_icon || E.corona || '🛡️'} Staff y liderazgo`,
    desc: [
      `${f()} **Perfil y cuotas**`,
      `${d()} \`/staff-perfil\` — Perfil completo (sesiones, horas, cuota por puntos, ratings, logros).`,
      `${d()} \`/staff-clasificacion\` — Ranking / cuotas de la semana.`,
      `${d()} \`/panel-staff\` — Panel rápido (sesiones, LOA, hosts, etc.).`,
      `${d()} \`/cargar-cuota\` — Ajustar puntos / sesiones / tickets / LOA (liderazgo).`,
      `${d()} \`/resetear-cuotas\` — Reinicio de ciclo (programado también los domingos).`,
      '',
      `${f()} **Gestión de equipo**`,
      `${d()} \`/promover\` · \`/handpick\` — Ascensos / selección.`,
      `${d()} \`/staff-remover\` · \`/renunciar\` — Baja del equipo (limpia roles).`,
      `${d()} \`/staff-reconocimiento\` — Premios / reconocimientos.`,
      `${d()} \`/staff-announce\` · \`/staffstrike\` · \`/strike\` · \`/delstrike\` — Comunicación y strikes.`,
      `${d()} \`/solicitud-ausencia\` / LOA — Ausencias temporales.`,
      `${d()} \`/investigacion\` — Strip de roles + rol “Bajo investigación”.`,
      `${d()} \`/log-supervision\` — Notas y puntaje al host supervisado.`,
      `${d()} \`/staff-database\` — Base / consultas de staff.`,
      '',
      `${f()} **Cuota**`,
      `${d()} Se aprueba por **puntos** (host, co-host, supervisión y tickets suman). Mínimo para aprobar y techo semanal según el sistema actual del bot.`
    ].join('\n')
  },

  tickets: {
    label: 'Tickets y soporte',
    title: `${E.msj || '🎫'} Tickets y soporte`,
    desc: [
      `${d()} \`/panel-tickets\` — Publica el panel de tickets del server principal.`,
      `${d()} Tipos de ticket según el menú del panel (soporte, reportes internos, etc.).`,
      `${d()} Staff: reclamar, cerrar, reabrir, pin, feedback del ticket.`,
      `${d()} \`/lista-negra-tickets\` — Restricción de uso de tickets (propietarios).`,
      '',
      `${d()} **Servicios Públicos** tiene su propio sistema de tickets/soporte en ese Discord (no mezclar con el panel de 00Y4n RP).`,
      '',
      `${d()} Si necesitás reportar a un usuario in-game o en Discord de forma formal, usá el ticket de soporte o el canal que indique staff (comando \`/reporte\` está planificado; ver categoría *Próximamente*).`
    ].join('\n')
  },

  moderacion: {
    label: 'Moderación',
    title: `${E.warn || '🔨'} Moderación Discord`,
    desc: [
      `${d()} \`/warn\` · \`/warnings\` — Advertencias.`,
      `${d()} \`/timeout\` · \`/untimeout\` — Silencio temporal.`,
      `${d()} \`/kick\` · \`/ban\` · \`/unban\` — Expulsión / ban.`,
      `${d()} \`/masskick\` · \`/massban\` — Acciones masivas (solo alto mando).`,
      `${d()} \`/lock\` · \`/unlock\` — Bloquear / desbloquear canal.`,
      `${d()} \`/purge\` — Borrar mensajes en lote.`,
      `${d()} \`/cases\` · \`/modlogs\` — Historial de casos.`,
      `${d()} \`/restringir\` · \`/desrestringir\` · \`/restricciones\` — Restricciones internas 00Y4n.`,
      `${d()} \`/blacklist_swfl\` — Blacklist de comunidad.`,
      '',
      `${d()} El bot también tiene **anti spam de @everyone / @here** (kick automático si se abusa).`
    ].join('\n')
  },

  info: {
    label: 'Info del server',
    title: `${E.faq || E.carpeta || '📚'} Información y embeds`,
    desc: [
      `${d()} \`/embed-send\` — Publica presets oficiales (solo staff autorizado / admin).`,
      '',
      `${f()} **Presets principales 00Y4n**`,
      `${d()} Instructivo · Reglas Discord · Server Tienda · FAQ · Roleplay normas/manejo`,
      `${d()} Guía Roleplay · Guía Carmeet · Chat Roleplay · Normas de conducción (Parte 1 y 2)`,
      `${d()} Staff Info · Alto Comando · Sorteos`,
      '',
      `${f()} **Servicios Públicos**`,
      `${d()} Bienvenida · Info · FAQ · Soporte/tickets · Depto policial · Sign calls`,
      '',
      `${d()} \`/decir\` — Hablar como el bot (propietarios).`,
      `${d()} \`/recolectar\` — Utilidad de recolección (uso general según diseño del comando).`
    ].join('\n')
  },

  util: {
    label: 'Utilidades',
    title: `${E.bot || '🛠️'} Utilidades`,
    desc: [
      `${d()} \`/ayuda\` — Este menú.`,
      `${d()} \`/ping\` · \`/uptime\` — Latencia y tiempo online del bot.`,
      `${d()} \`/snipe\` — Último mensaje borrado del canal (si está activo).`,
      `${d()} \`/dm\` — Mensaje directo vía bot (staff autorizado).`,
      `${d()} \`/emojis-sync\` · \`/emojis-recolor\` — Mantenimiento de emojis del server.`,
      `${d()} \`/roleall\` — Asignación masiva de roles (propietarios).`,
      `${d()} \`/testoportunidad\` — Prueba del sistema de oportunidades (staff).`
    ].join('\n')
  },

  proximamente: {
    label: 'Próximamente',
    title: `${E.flecha || '➡️'} Comandos planificados`,
    desc: [
      `${f()} **\`/sesion estado\`** (planeado)`,
      `${d()} Cualquiera podría ver si hay sesión abierta: tipo (RP/Meet), host, peacetime, límite de velocidad, reacciones y si ya se liberó el link — **sin** spamear el canal de sesiones.`,
      '',
      `${f()} **\`/reporte\`** (planeado)`,
      `${d()} Reporte rápido de un usuario o situación (Discord o en sesión) hacia un canal/log de staff o ticket, con motivo y pruebas, para no depender solo del chat.`,
      '',
      `${d()} **Mafias organizadas** — Solicitud, reglas y estructura oficial (en diseño).`,
      `${d()} Más guías y onboarding cuando se acerque la revamp de Southwest Florida.`,
      '',
      `-# Southwest Florida Comunidad 00Y4n · Bot de la comunidad`
    ].join('\n')
  }
};

const ORDER = [
  'inicio',
  'sesiones',
  'economia',
  'perfil',
  'policia',
  'staff',
  'tickets',
  'moderacion',
  'info',
  'util',
  'proximamente'
];

function buildEmbed(key) {
  const s = SECCIONES[key] || SECCIONES.inicio;
  return new EmbedBuilder()
    .setColor(PRIMARIO)
    .setTitle(s.title)
    .setDescription(s.desc)
    .setFooter({ text: 'Elegí otra categoría en el menú · /ayuda' });
}

function buildSelect(selected) {
  const options = ORDER.map((key) => {
    const s = SECCIONES[key];
    const opt = {
      label: s.label.slice(0, 100),
      value: key,
      description: key === 'proximamente' ? 'Sesión estado, reporte, mafias…' : `Ver: ${s.label}`,
      default: key === selected
    };
    return opt;
  });
  // emojis opcionales en opciones (máx legible)
  const emojiMap = {
    inicio: 'tilde',
    sesiones: 'auto',
    economia: 'dinero',
    perfil: 'msj',
    policia: 'esposas',
    staff: 'staff_icon',
    tickets: 'carpeta',
    moderacion: 'warn',
    info: 'faq',
    util: 'bot',
    proximamente: 'flecha'
  };
  for (const o of options) {
    const em = optEmoji(emojiMap[o.value]);
    if (em) o.emoji = em;
  }
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ayuda_menu')
      .setPlaceholder('Elegí una categoría de ayuda')
      .addOptions(options)
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName('ayuda')
    .setDescription('Guía completa del servidor y del bot 00Y4n (comandos por categoría).')
    .addStringOption((opt) =>
      opt
        .setName('categoria')
        .setDescription('Abrir directo en una categoría')
        .setRequired(false)
        .addChoices(
          { name: 'Primeros pasos', value: 'inicio' },
          { name: 'Sesiones', value: 'sesiones' },
          { name: 'Economía y juegos', value: 'economia' },
          { name: 'Perfil y ranking', value: 'perfil' },
          { name: 'Policía / MDT', value: 'policia' },
          { name: 'Staff', value: 'staff' },
          { name: 'Tickets y soporte', value: 'tickets' },
          { name: 'Moderación', value: 'moderacion' },
          { name: 'Info del server', value: 'info' },
          { name: 'Utilidades', value: 'util' },
          { name: 'Próximamente', value: 'proximamente' }
        )
    ),

  async execute(interaction) {
    const inicial = interaction.options.getString('categoria') || 'inicio';
    const key = SECCIONES[inicial] ? inicial : 'inicio';

    const msg = await interaction.reply({
      embeds: [buildEmbed(key)],
      components: [buildSelect(key)],
      flags: MessageFlags.Ephemeral,
      fetchReply: true
    }).catch(async () => {
      // fallback API vieja
      return interaction.reply({
        embeds: [buildEmbed(key)],
        components: [buildSelect(key)],
        ephemeral: true,
        fetchReply: true
      });
    });

    const message = msg?.id ? msg : await interaction.fetchReply().catch(() => null);
    if (!message) return;

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 5 * 60_000,
      filter: (i) => i.user.id === interaction.user.id && i.customId === 'ayuda_menu'
    });

    collector.on('collect', async (i) => {
      try {
        const v = i.values[0];
        await i.update({
          embeds: [buildEmbed(v)],
          components: [buildSelect(v)]
        });
      } catch (e) {
        try {
          await i.deferUpdate();
        } catch (_) {}
      }
    });

    collector.on('end', async () => {
      try {
        await interaction.editReply({ components: [] }).catch(() => null);
      } catch (_) {}
    });
  }
};
