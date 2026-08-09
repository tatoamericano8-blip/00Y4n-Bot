import Staff from '../../../models/Staff.js';
import Sesion from '../../../models/Session.js';
import { EmbedBuilder } from 'discord.js';
import { rankingHostsSemana } from '../../utils/gestorHostScore.js';
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
                '**Forzar cierre de sesi\u00f3n**\n\n' +
                '1. Us\u00e1 el comando `/forzar-cierre`\n' +
                '2. Indic\u00e1 el host de la sesi\u00f3n abierta\n' +
                '3. Esa sesi\u00f3n **no** contar\u00e1 para la cuota del host\n\n' +
                'Tambi\u00e9n pod\u00e9s ver las sesiones abiertas con el bot\u00f3n **Sesiones abiertas** del panel.'
        });
    }

    if (id === 'panel_staff_sesiones') {
        const sesiones = await Sesion.find({ guildId, estado: { $in: ['esperando_reacciones', 'activa'] } }).sort({ fechaInicio: -1 }).limit(15);
        if (!sesiones.length) return interaction.editReply({ content: 'No hay sesiones abiertas ahora.' });
        const lineas = sesiones.map((s, i) => {
            const ini = s.fechaInicio ? `<t:${Math.floor(new Date(s.fechaInicio).getTime() / 1000)}:R>` : '\u2014';
            return `**${i + 1}.** \`${s.estado}\` \u00b7 host <@${s.hostId}>` + (s.coHostId ? ` \u00b7 co-host <@${s.coHostId}>` : '') + ` \u00b7 inicio ${ini}\nID inicio: \`${s.idInicio}\``;
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
            const hasta = s.loa?.hasta ? `<t:${Math.floor(new Date(s.loa.hasta).getTime() / 1000)}:D>` : '\u2014';
            return `**${i + 1}.** <@${s.userId}> \u00b7 hasta ${hasta} \u00b7 ${s.loa?.motivo || s.motivoLoa || '\u2014'}`;
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
                incumplidores.push(`<@${s.userId}> \u00b7 ${rango} \u00b7 sesiones ${sem?.length ?? 0}/${metas?.sesiones ?? '?'}`);
            }
        }
        if (!incumplidores.length) {
            return interaction.editReply({ content: 'No hay incumplidores de cuota esta semana (o la cuota est\u00e1 pausada).' });
        }
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#E60404').setTitle('Incumplidores de cuota').setDescription(incumplidores.slice(0, 25).join('\n').slice(0, 4000))] });
    }

    if (id === 'panel_staff_hosts') {
        const ranking = await rankingHostsSemana(guildId, 15);
        if (!ranking.length) {
            return interaction.editReply({
                content: 'A\u00fan no hay datos de host score esta semana (hace falta feedback con nota 1-10 y menci\u00f3n del host).'
            });
        }
        const lineas = ranking.map((r, i) => {
            const medal = i === 0 ? '\ud83e\udd47' : i === 1 ? '\ud83e\udd48' : i === 2 ? '\ud83e\udd49' : `**${i + 1}.**`;
            return (
                `${medal} <@${r.userId}> \u00b7 \u2b50 **${r.promedioSemana || r.promedioGlobal || 0}**/10` +
                ` \u00b7 feedbacks sem. ${r.feedbacksSemana} \u00b7 hosteos cuota ${r.sesionesSemana}`
            );
        });
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('#faa61a')
                    .setTitle('Ranking de hosts (7 d\u00edas)')
                    .setDescription(lineas.join('\n').slice(0, 4000))
                    .setFooter({ text: 'Basado en feedback de /cerrar_swfl \u00b7 Opini\u00f3n de la Sesi\u00f3n' })
            ]
        });
    }

    return interaction.editReply({ content: 'Bot\u00f3n no reconocido.' });
}

const make = (name) => ({ name, customId: name, execute: handlePanelButton, run: (_c, i) => handlePanelButton(i) });

export default [
  make('panel_staff_sesiones'),
  make('panel_staff_loa'),
  make('panel_staff_incumplidores'),
  make('panel_staff_forzar'),
  make('panel_staff_hosts'),
];
