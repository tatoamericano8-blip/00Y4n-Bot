import { EmbedBuilder, MessageFlags } from 'discord.js';
import Staff from '../../../models/Staff.js';
import Sesion from '../../../models/Session.js';
import { E } from '../../config/emojis.js';

const COLOR = '#8ae6fa';
const ROL_STAFF = '1512120103771050005';

function fmtDuracionMin(min) {
  const m = Math.max(0, Number(min) || 0);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

function fmtFecha(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  } catch {
    return String(d);
  }
}

function inicioSemanaAR(ref = new Date()) {
  // Lunes 00:00 Argentina
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });
  // Usar offset simple: get Monday of current week in AR
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short'
  }).formatToParts(ref);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const y = Number(get('year'));
  const mo = Number(get('month'));
  const da = Number(get('day'));
  const wd = get('weekday'); // Mon, Tue...
  const map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const offset = map[wd] ?? 0;
  const base = new Date(Date.UTC(y, mo - 1, da, 3, 0, 0)); // ~00:00 AR = 03:00 UTC
  base.setUTCDate(base.getUTCDate() - offset);
  return base;
}

async function guardStaff(interaction) {
  if (!interaction.member.roles.cache.has(ROL_STAFF)) {
    await interaction.reply({
      content: E.cruz + ' Solo el Staff puede usar esto.',
      flags: MessageFlags.Ephemeral
    });
    return false;
  }
  return true;
}

async function listarSesiones(interaction, userId, soloSemana) {
  if (!(await guardStaff(interaction))) return;

  const guildId = interaction.guildId;
  const filtro = {
    guildId,
    hostId: userId,
    estado: 'cerrada'
  };

  let sesiones = await Sesion.find(filtro).sort({ fechaCierre: -1 }).limit(25).lean();

  if (soloSemana) {
    const desde = inicioSemanaAR();
    sesiones = sesiones.filter((s) => s.fechaCierre && new Date(s.fechaCierre) >= desde);
  }

  if (!sesiones.length) {
    return interaction.reply({
      content: soloSemana
        ? 'No hay sesiones hosteadas en la **semana actual**.'
        : 'No hay sesiones hosteadas registradas.',
      flags: MessageFlags.Ephemeral
    });
  }

  const lineas = sesiones.slice(0, 15).map((s, i) => {
    const peak =
      Number(s.reaccionesPico) ||
      (Array.isArray(s.reacciones) ? s.reacciones.length : 0);
    return (
      `**${i + 1}.** ${fmtFecha(s.fechaCierre)} · ` +
      `\`${fmtDuracionMin(s.duracionMinutos)}\` · ` +
      `Reacciones: **${peak}** · ` +
      `\`${s.tipo || 'rp'}\``
    );
  });

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(
      soloSemana
        ? `${E.lista || '📋'} Sesiones semanales — <@${userId}>`
        : `${E.carpeta || '📁'} Sesiones históricas — <@${userId}>`
    )
    .setDescription(lineas.join('\n'))
    .setFooter({
      text: `Mostrando ${Math.min(sesiones.length, 15)} de ${sesiones.length} · Solo host`
    })
    .setTimestamp();

  return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

const logros = {
  name: 'staff_perfil_logros',
  async execute(interaction, client, args = []) {
    if (!(await guardStaff(interaction))) return;
    const userId = args[0];
    if (!userId) {
      return interaction.reply({
        content: 'Usuario inválido.',
        flags: MessageFlags.Ephemeral
      });
    }

    const staff = await Staff.findOne({
      guildId: interaction.guildId,
      userId
    }).lean();

    if (!staff) {
      return interaction.reply({
        content: 'Sin registro de staff.',
        flags: MessageFlags.Ephemeral
      });
    }

    const premios = Array.isArray(staff.premios) ? staff.premios : [];
    const h = staff.estadisticasHistoricas || {};
    const host = Number(h.sesionesHosteadasTotales) || 0;
    const horas = Number(h.horasTotales) || 0;
    const racha = Number(staff.rachaActual) || 0;
    const rachaMax = Number(staff.rachaMaxima) || 0;

    const hitos = [];
    if (host >= 5) hitos.push('✅ 5 sesiones hosteadas');
    else hitos.push('🔒 5 sesiones hosteadas');
    if (host >= 25) hitos.push('✅ 25 sesiones hosteadas');
    else hitos.push('🔒 25 sesiones hosteadas');
    if (host >= 50) hitos.push('✅ 50 sesiones hosteadas');
    else hitos.push('🔒 50 sesiones hosteadas');
    if (horas >= 25) hitos.push('✅ 25 horas de servicio');
    else hitos.push('🔒 25 horas de servicio');
    if (horas >= 100) hitos.push('✅ 100 horas de servicio');
    else hitos.push('🔒 100 horas de servicio');
    if (rachaMax >= 3) hitos.push(`✅ Racha de cuota ×3 (máx. ${rachaMax})`);
    else hitos.push('🔒 Racha de cuota ×3');
    if (racha >= 1) hitos.push(`✅ Racha activa: ${racha} semana(s)`);

    let premiosTxt = '_Sin reconocimientos registrados._';
    if (premios.length) {
      premiosTxt = premios
        .slice(0, 10)
        .map((p, i) => {
          const f = p.fecha
            ? new Date(p.fecha).toLocaleDateString('es-AR', {
                timeZone: 'America/Argentina/Buenos_Aires'
              })
            : '';
          return `**${i + 1}.** ${p.titulo || 'Reconocimiento'}${f ? ` · ${f}` : ''}${
            p.descripcion ? `\n> ${p.descripcion}` : ''
          }`;
        })
        .join('\n\n');
    }

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${E.trofeo || '🏆'} Logros — <@${userId}>`)
      .addFields(
        { name: 'Reconocimientos', value: premiosTxt.slice(0, 1024) },
        { name: 'Hitos', value: hitos.join('\n').slice(0, 1024) }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};

const sesSem = {
  name: 'staff_perfil_ses_sem',
  async execute(interaction, client, args = []) {
    return listarSesiones(interaction, args[0], true);
  }
};

const sesAll = {
  name: 'staff_perfil_ses_all',
  async execute(interaction, client, args = []) {
    return listarSesiones(interaction, args[0], false);
  }
};

export default [logros, sesSem, sesAll];
