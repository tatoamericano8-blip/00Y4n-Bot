import Staff from '../../../models/Staff.js';
import Sesion from '../../../models/Session.js';
import { EmbedBuilder } from 'discord.js';
import { obtenerMetasPorRango, sesionesSemana } from '../../utils/metasCuota.js';
import { evaluarCumplimiento } from '../../utils/scoreCuota.js';
import { obtenerRangoDeUsuario } from '../../utils/rangoStaff.js';

const ROL_ALTO_MANDO = '1528870731629465752';

function autorizado(member) {
    return member.roles.cache.has(ROL_ALTO_MANDO) || member.permissions.has('Administrator');
}

async function handlePanelButton(interaction) {
    if (!autorizado(interaction.member)) {
        return interaction.reply({ content: 'Solo **Alto Comando** puede usar este panel.', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.customId;
    const guildId = interaction.guildId;

    if (id === 'panel_staff_forzar') {
        return interaction.editReply({
            content:
                '**Forzar cierre de sesión**\n\n' +
                '1. Usá el comando `/forzar-cierre`\n' +
                '2. Indicá el host de la sesión abierta\n' +
                '3. Esa sesión **no** contará para la cuota del host\n\n' +
                'También podés ver las sesiones abiertas con el botón **Sesiones abiertas** del panel.'
        });
    }

    if (id === 'panel_staff_sesiones') {
        const sesiones = await Sesion.find({ guildId, estado: { $in: ['esperando_reacciones', 'activa'] } }).sort({ fechaInicio: -1 }).limit(15);
        if (!sesiones.length) return interaction.editReply({ content: 'No hay sesiones abiertas ahora.' });
        const lineas = sesiones.map((s, i) => {
            const ini = s.fechaInicio ? `<t:${Math.floor(new Date(s.fechaInicio).getTime() / 1000)}:R>` : '—';
            return `**${i + 1}.** \`${s.estado}\` · host <@${s.hostId}>` + (s.coHostId ? ` · co-host <@${s.coHostId}>` : '') + ` · inicio ${ini}\nID inicio: \`${s.idInicio}\``;
        });
        return interaction.editReply({
            embeds: [new EmbedBuilder().setColor('#FB8B66').setTitle('Sesiones abiertas').setDescription(lineas.join('\n\n').slice(0, 4000)).setFooter({ text: 'Para cerrar: /cerrar_swfl o /forzar-cierre' })]
        });
    }

    if (id === 'panel_staff_loa') {
        const staffList = await Staff.find({ guildId, estado: { $nin: ['DESPEDIDO', 'RENUNCIADO'] } });
        const enLoa = staffList.filter((s) => s.loa?.activo || s.estado === 'LOA');
        if (!enLoa.length) return interaction.editReply({ content: 'No hay staff en LOA activo.' });
        const lineas = enLoa.map((s, i) => {
            const hasta = s.loa?.hasta ? `<t:${Math.floor(new Date(s.loa.hasta).getTime() / 1000)}:D>` : '—';
            return `**${i + 1}.** <@${s.userId}> · hasta ${hasta} · ${s.loa?.motivo || s.motivoLoa || '—'}`;
        });
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#fee75c').setTitle('LOA activos').setDescription(lineas.join('\n').slice(0, 4000))] });
    }

    if (id === 'panel_staff_incumplidores') {
        const staffList = await Staff.find({ guildId, estado: { $nin: ['DESPEDIDO', 'RENUNCIADO'] } });
        const incumplidores = [];
        for (const s of staffList) {
            if (s.loa?.activo || s.estado === 'LOA') continue;
            const member = await interaction.guild.members.fetch(s.userId).catch(() => null);
            const rango = member ? await obtenerRangoDeUsuario(member) : s.rango || 'Staff';
            const metas = obtenerMetasPorRango(rango);
            const sem = sesionesSemana(s);
            const ev = evaluarCumplimiento({ staff: s, metas, sesionesSemana: sem });
            if (ev && ev.cumple === false) {
                incumplidores.push(`<@${s.userId}> · ${rango} · sesiones ${sem?.length ?? 0}/${metas?.sesiones ?? '?'}`);
            }
        }
        if (!incumplidores.length) {
            return interaction.editReply({ content: 'No hay incumplidores de cuota esta semana (o la cuota está pausada).' });
        }
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#E60404').setTitle('Incumplidores de cuota').setDescription(incumplidores.slice(0, 25).join('\n').slice(0, 4000))] });
    }

    return interaction.editReply({ content: 'Botón no reconocido.' });
}

const make = (name) => ({ name, customId: name, execute: handlePanelButton, run: (_c, i) => handlePanelButton(i) });

export default [
  make('panel_staff_sesiones'),
  make('panel_staff_loa'),
  make('panel_staff_incumplidores'),
  make('panel_staff_forzar'),
];
