import { AttachmentBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import Sesion from '../../models/Session.js';

/** Canal de archivo/logs de sesiones */
export const CANAL_LOG_SESIONES = '1541940173011423322';

/**
 * Comandos que se registran dentro de una sesion activa.
 */
export const COMANDOS_SESION = new Set([
  'inicio',
  'inicio_swfl',
  'lanzar_rp',
  'lanzar_meet',
  'reinvitaciones',
  'host_swfl',
  'supervisar_swfl',
  'forzar-cierre',
  'finalizar_host',
  'sesion-blacklist',
  'sesion-suspender',
  'cerrar_swfl',
  'fastpass_swfl'
]);

const buffers = new Map();

function keyGuild(guildId) {
  return String(guildId || '');
}

function opcionesPlanas(options, prefix = '') {
  if (!Array.isArray(options) || options.length === 0) return {};
  const out = {};
  for (const opt of options) {
    const nombre = prefix ? `${prefix}.${opt.name}` : opt.name;
    if (opt.type === 1 || opt.type === 2) {
      Object.assign(out, opcionesPlanas(opt.options || [], nombre));
      continue;
    }
    let valor = opt.value;
    if (valor === undefined || valor === null) valor = null;
    else if (typeof valor === 'object' && valor?.id) valor = String(valor.id);
    else valor = String(valor);
    if (typeof valor === 'string' && valor.length > 300) valor = valor.slice(0, 297) + '...';
    out[nombre] = valor;
  }
  return out;
}

function formatearDuracionMinutos(minutos) {
  const m = Math.max(0, Math.round(Number(minutos) || 0));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest > 0 ? `${h}h ${rest}m` : `${h}h`;
}

export function iniciarLogSesion({
  guildId,
  idInicio,
  hostId,
  tipo,
  fechaInicio = new Date()
} = {}) {
  if (!guildId) return;
  buffers.set(keyGuild(guildId), {
    guildId: String(guildId),
    idInicio: idInicio ? String(idInicio) : null,
    hostId: hostId ? String(hostId) : null,
    coHostId: null,
    supervisorId: null,
    tipo: tipo || null,
    fechaInicio: new Date(fechaInicio),
    fechaCierre: null,
    notas: null,
    comandos: []
  });
}

export function actualizarRolesLogSesion(guildId, { hostId, coHostId, supervisorId } = {}) {
  const buf = buffers.get(keyGuild(guildId));
  if (!buf) return;
  if (hostId != null) buf.hostId = String(hostId);
  if (coHostId != null) buf.coHostId = String(coHostId);
  if (supervisorId != null) buf.supervisorId = String(supervisorId);
}

export async function registrarComandoSesion(interaction, estado = {}) {
  try {
    if (!interaction?.commandName || !interaction.guildId) return;
    if (!COMANDOS_SESION.has(interaction.commandName)) return;

    const guildId = interaction.guildId;
    let buf = buffers.get(keyGuild(guildId));

    if (!buf) {
      const sesion = await Sesion.findOne({
        guildId,
        estado: { $in: ['esperando_reacciones', 'activa'] }
      })
        .sort({ fechaInicio: -1 })
        .lean()
        .catch(() => null);

      if (!sesion) {
        if (interaction.commandName !== 'inicio' && interaction.commandName !== 'inicio_swfl') return;
        iniciarLogSesion({
          guildId,
          hostId: interaction.user.id,
          tipo: interaction.options?.getString?.('tipo') || null,
          fechaInicio: new Date()
        });
        buf = buffers.get(keyGuild(guildId));
      } else {
        iniciarLogSesion({
          guildId,
          idInicio: sesion.idInicio,
          hostId: sesion.hostId,
          tipo: sesion.tipo,
          fechaInicio: sesion.fechaInicio || new Date()
        });
        buf = buffers.get(keyGuild(guildId));
        if (buf) {
          buf.coHostId = sesion.coHostId || null;
          buf.supervisorId = sesion.supervisorId || null;
        }
      }
    }

    if (!buf) return;

    if (interaction.commandName === 'host_swfl') {
      const tipoRol = interaction.options?.getString?.('tipo');
      const usuario = interaction.options?.getUser?.('usuario');
      if (usuario && tipoRol === 'host') buf.hostId = usuario.id;
      if (usuario && tipoRol === 'cohost') buf.coHostId = usuario.id;
    }
    if (interaction.commandName === 'supervisar_swfl') {
      const sup = interaction.options?.getUser?.('supervisor') || interaction.user;
      if (sup) buf.supervisorId = sup.id;
    }
    if (interaction.commandName === 'inicio' || interaction.commandName === 'inicio_swfl') {
      buf.hostId = interaction.user.id;
      const tipo = interaction.options?.getString?.('tipo');
      if (tipo) buf.tipo = tipo;
    }

    const entrada = {
      comando: `/${interaction.commandName}`,
      usuario_id: interaction.user.id,
      usuario_tag: interaction.user.tag,
      canal_id: interaction.channelId || null,
      ok: estado.ok !== false,
      timestamp: Math.floor(Date.now() / 1000),
      opciones: opcionesPlanas(interaction.options?.data || [])
    };
    if (estado.error) {
      entrada.error = String(estado.error?.userMessage || estado.error?.message || estado.error).slice(0, 300);
    }
    buf.comandos.push(entrada);
  } catch (err) {
    console.error('[logSesionArchivo] registrarComandoSesion:', err?.message || err);
  }
}

export async function finalizarYPublicarLogSesion(client, sesion, { notas = null, motivoCierre = null } = {}) {
  try {
    if (!client) return;

    const guildId = sesion?.guildId;
    if (!guildId) return;

    const buf = buffers.get(keyGuild(guildId)) || {
      guildId: String(guildId),
      idInicio: sesion?.idInicio || null,
      hostId: sesion?.hostId || null,
      coHostId: sesion?.coHostId || null,
      supervisorId: sesion?.supervisorId || null,
      tipo: sesion?.tipo || null,
      fechaInicio: sesion?.fechaInicio ? new Date(sesion.fechaInicio) : new Date(),
      comandos: []
    };

    if (sesion?.hostId) buf.hostId = String(sesion.hostId);
    if (sesion?.coHostId) buf.coHostId = String(sesion.coHostId);
    if (sesion?.supervisorId) buf.supervisorId = String(sesion.supervisorId);
    if (sesion?.tipo) buf.tipo = sesion.tipo;
    if (sesion?.idInicio) buf.idInicio = String(sesion.idInicio);
    if (sesion?.fechaInicio) buf.fechaInicio = new Date(sesion.fechaInicio);

    const fechaCierre = sesion?.fechaCierre ? new Date(sesion.fechaCierre) : new Date();
    buf.fechaCierre = fechaCierre;

    const startMs = buf.fechaInicio ? new Date(buf.fechaInicio).getTime() : fechaCierre.getTime();
    const endMs = fechaCierre.getTime();
    const rawMinutes =
      typeof sesion?.duracionMinutos === 'number' && sesion.duracionMinutos > 0
        ? sesion.duracionMinutos
        : Math.max(0, Math.round((endMs - startMs) / 60000));

    const notasFinal =
      notas ||
      motivoCierre ||
      sesion?.motivoCierreForzado ||
      'Sin notas.';

    const payload = {
      host_id: buf.hostId || null,
      cohost_id: buf.coHostId || null,
      supervisor_id: buf.supervisorId || null,
      tipo: buf.tipo || null,
      id_inicio: buf.idInicio || null,
      start_timestamp: Math.floor(startMs / 1000),
      end_timestamp: Math.floor(endMs / 1000),
      duration: formatearDuracionMinutos(rawMinutes),
      raw_minutes: rawMinutes,
      notas: String(notasFinal).slice(0, 1000),
      cierre_forzado: Boolean(sesion?.cierreForzado),
      cuenta_para_cuota: sesion?.cuentaParaCuota !== false,
      total_comandos: buf.comandos.length,
      comandos: buf.comandos
    };

    const channel =
      client.channels.cache.get(CANAL_LOG_SESIONES) ||
      (await client.channels.fetch(CANAL_LOG_SESIONES).catch(() => null));

    if (
      !channel ||
      (channel.type !== ChannelType.GuildText &&
        channel.type !== ChannelType.GuildAnnouncement)
    ) {
      buffers.delete(keyGuild(guildId));
      return;
    }

    const hostIdSafe = (buf.hostId || 'desconocido').replace(/[^\w-]/g, '');
    const fileName = `sesion_log_${hostIdSafe}_${payload.end_timestamp}.json`;
    const jsonStr = JSON.stringify(payload, null, 2);
    const attachment = new AttachmentBuilder(Buffer.from(jsonStr, 'utf8'), {
      name: fileName,
      description: 'Archivo de comandos de la sesion'
    });

    const mention = (id) => (id ? `<@${id}>` : 'Ninguno');
    const tipoTxt =
      buf.tipo === 'meet' ? 'Car Meet' : buf.tipo === 'rp' ? 'Roleplay' : buf.tipo || 'No indicado';

    const embed = new EmbedBuilder()
      .setTitle('Registro de sesion')
      .setColor('#74d4fc')
      .addFields(
        { name: 'Tipo', value: tipoTxt, inline: true },
        { name: 'Duracion', value: payload.duration, inline: true },
        { name: 'Comandos', value: String(payload.total_comandos), inline: true },
        { name: 'Host', value: mention(buf.hostId), inline: true },
        { name: 'Co-Host', value: mention(buf.coHostId), inline: true },
        { name: 'Supervisor', value: mention(buf.supervisorId), inline: true },
        { name: 'Inicio', value: `<t:${payload.start_timestamp}:f>`, inline: true },
        { name: 'Cierre', value: `<t:${payload.end_timestamp}:f>`, inline: true },
        { name: 'Notas', value: String(notasFinal).slice(0, 1024) || 'Sin notas.', inline: false }
      )
      .setFooter({ text: `id_inicio: ${buf.idInicio || 'n/a'}` })
      .setTimestamp(fechaCierre);

    await channel.send({ embeds: [embed], files: [attachment] });
    buffers.delete(keyGuild(guildId));
  } catch (err) {
    console.error('[logSesionArchivo] finalizarYPublicarLogSesion:', err?.message || err);
    try {
      if (sesion?.guildId) buffers.delete(keyGuild(sesion.guildId));
    } catch (_) {}
  }
}

export default {
  COMANDOS_SESION,
  CANAL_LOG_SESIONES,
  iniciarLogSesion,
  actualizarRolesLogSesion,
  registrarComandoSesion,
  finalizarYPublicarLogSesion
};
