import { MessageFlags, EmbedBuilder } from 'discord.js';
import { E } from '../../config/emojis.js';
import { PRIMARIO } from '../../utils/colores.js';

function buildSesiones() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.auto || E.flecha} Sesiones — flujo`)
        .setDescription(
          `**Flujo:**\n` +
            `-# 1. \`/inicio\`\n` +
            `-# 2. Esperar reacciones\n` +
            `-# 3. \`/lanzar_rp\` o \`/lanzar_meet\`\n` +
            `-# 4. \`/host\` y/o \`/supervisar_swfl\`\n` +
            `-# 5. \`/cerrar\` al terminar\n\n` +
            `**Extras:**\n` +
            `\`/reinvitaciones\` · \`/fastpass\` · \`/finalizar_host\`\n\n` +
            `**Reglas de sesión:**\n` +
            `-# • Seguir formatos aprobados (spawn, cupos crim, etc.)\n` +
            `-# • No inventar sistemas ni pausas no autorizadas\n` +
            `-# • Cupos criminales medidos según policías\n` +
            `-# • Si no podés seguir co-hosteando: \`/finalizar_host\``
        )
        .setFooter({ text: 'Manual de Staff 00Y4n' })
    ]
  };
}

function buildModeracion() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.warn} Moderación`)
        .setDescription(
          `- \`/warn\` — aviso leve\n` +
            `- \`/warnings\` — ver warns\n` +
            `- \`/strike\` — falta grave o reiterada\n` +
            `- \`/delstrike\` — quitar strike\n` +
            `- \`/timeout\` · \`/untimeout\` — silencio\n` +
            `- \`/kick\` — expulsar\n` +
            `- \`/purge\` — borrar mensajes\n` +
            `- \`/modlogs\` — historial\n\n` +
            `**Orden:** warn → timeout → strike → kick/ban.\n` +
            `Motivo claro siempre. Si dudás en algo grave, consultá.`
        )
        .setFooter({ text: 'Manual de Staff 00Y4n' })
    ]
  };
}

function buildCuotas() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.tilde || E.mitadestrella} Cuotas`)
        .setDescription(
          `-# \`/staff-perfil\` — **tu progreso semanal** (cuota, sesiones, tickets)\n\n` +
            `Suma cuota: hostear y tickets (según rango).\n` +
            `Cumplí la meta de tu rango. LOA = canal de solicitud de ausencia staff.`
        )
        .setFooter({ text: 'Manual de Staff 00Y4n' })
    ]
  };
}

function buildConducta() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.msj || E.manual} Conducta y escalamiento`)
        .setDescription(
          `**Conducta:**\n` +
            `-# • Profesional en texto y voz\n` +
            `-# • No discutir internos en público\n` +
            `-# • No desobedecer indicaciones de un superior en sesión\n` +
            `-# • No FRP / mecánicas inventadas\n\n` +
            `**Escalá si:**\n` +
            `-# • Ban o caso grave\n` +
            `-# • Conflicto entre staff\n` +
            `-# • Exploits / acoso / excepciones raras\n\n` +
            `*Canales: chat-staff · coordinación-hosts · staff-cuotas · asistencia*`
        )
        .setFooter({ text: 'Manual de Staff 00Y4n' })
    ]
  };
}

function buildComandosSwfl() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.manual} Comandos básicos de SWFL`)
        .setDescription(
          `### \`/bannersay\` [Color] [Mensaje]\n` +
            `Cartel explicativo arriba de la pantalla.\n\n` +
            `### \`/announce\` [all / usuario]\n` +
            `Anuncios importantes.\n\n` +
            `### \`/kick\` [user] · \`/ban\` [user] · \`/unban\` [user]\n` +
            `Expulsar / banear / desbanear del privado.\n\n` +
            `### \`/time\`\n` +
            `Modificar la hora del servidor.\n\n` +
            `### \`/track\` [all / user]\n` +
            `Ver el user original sobre cada jugador.\n\n` +
            `### \`/pausetime\`\n` +
            `Pausar el tiempo (solo si hace falta).\n\n` +
            `### \`/refresh\` [me / user]\n` +
            `Mata y reaparece; útil por bugs de estado o invisibilidad.\n\n` +
            `### \`/kill\` [me / user]\n` +
            `Elimina a un jugador.\n\n` +
            `### \`/fly\` [me / user]\n` +
            `Permite volar.\n\n` +
            `### \`/bring\` [user]\n` +
            `Trae al usuario a tu ubicación (más estable que TP).\n\n` +
            `-# Todo Host debe conocer estos comandos en el privado.`
        )
        .setFooter({ text: 'Manual de Staff 00Y4n' })
    ]
  };
}

function buildRolesStaff() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(PRIMARIO)
        .setTitle(`${E.staff || E.corona || E.manual} Roles staff`)
        .setDescription(
          `**Supervisor Ejecutivo** — Máxima autoridad operativa. Dirección, cambios grandes, conflictos altos, última palabra en sanciones graves.\n\n` +
            `**Co-Fundador** — Autoridad de fundación. Decisiones estratégicas y respaldo al liderazgo.\n\n` +
            `**Equipo de Propietarios** — Dueños / dirección. Control total (Discord + visión). Supervisan línea 00Y4n.\n\n` +
            `**Gerente de Staff** — Responsable del equipo. Contrata, evalúa, organiza. Nexo dirección ↔ staff diario.\n\n` +
            `**Senior Administrador** — Admin avanzada. Temas sensibles, sanciones pesadas, apoyo a Gerencia.\n\n` +
            `**Supervisor** — Supervisa rendimiento en sesiones y Discord. Corrige, reporta, protocolos.\n\n` +
            `**Server Administrator** — Permisos amplios. Config, moderación fuerte, situaciones que superan al staff regular.\n\n` +
            `**Coordinador de Staff** — Turnos, cobertura, comunicación interna. Orden operativo del equipo.\n\n` +
            `**Alto Comando** — Núcleo de liderazgo. Decisiones importantes, casos serios, respaldo a la estructura.\n\n` +
            `**Staff de la semana** — Reconocimiento, no jerarquía. No suma autoridad solo.\n\n` +
            `**Líder de Staff** — Lidera en sesiones. Guía a Senior/Server/Junior; responde a Coordinación / AC.\n\n` +
            `**Senior Staff** — Experimentado. Mentoría a juniors y casos que el base no resuelve solo.\n\n` +
            `**Server Staff** — Operativo principal. Moderación Discord/sesiones y soporte al liderazgo.\n\n` +
            `**Junior Staff** — En consolidación. Tareas básicas, menos autonomía; reporta lo que no puede resolver.\n\n` +
            `**Staff Aprendiz** — Entrada. Observa, asiste y practica bajo supervisión. No decisiones graves solo.`
        )
        .setFooter({ text: 'Manual de Staff 00Y4n' })
    ]
  };
}

export default {
  name: 'embed_staff_info_menu',

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
      case 'sesiones':
        payload = buildSesiones();
        break;
      case 'moderacion':
        payload = buildModeracion();
        break;
      case 'cuotas':
        payload = buildCuotas();
        break;
      case 'conducta':
        payload = buildConducta();
        break;
      case 'comandos_swfl':
        payload = buildComandosSwfl();
        break;
      case 'roles_staff':
        payload = buildRolesStaff();
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
