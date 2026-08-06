import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { obtenerStrikesUsuario } from '../../utils/gestorStrikes.js';
import { WarningService } from '../../services/warningService.js';
import { getModerationCases } from '../../utils/moderation.js';
import Staff from '../../../models/Staff.js';

const ROLE_STAFF = '1512120103771050005';
const ROLE_HIGH_COMMAND = '1528870731629465752';

export default {
    data: new SlashCommandBuilder()
        .setName('modlogs')
        .setDescription('Muestra el historial de moderación de un usuario (strikes, warns, casos, staff).')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Usuario a consultar.')
                .setRequired(true)),

    async execute(interaction) {
        const esStaff =
            interaction.member.roles.cache.has(ROLE_STAFF) ||
            interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) ||
            interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
            interaction.member.permissions.has(PermissionFlagsBits.ViewAuditLog);

        if (!esStaff) {
            return interaction.reply({
                content: '❌ Solo el **Staff** puede ver los modlogs.',
                flags: MessageFlags.Ephemeral
            });
        }

        const target = interaction.options.getUser('usuario');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // 1. Strikes de comunidad
        const strikes = await obtenerStrikesUsuario(interaction.guildId, target.id);
        const strikesActivos = strikes.filter(s => s.activo);
        const strikesTexto = strikes.length
            ? strikes
                .slice(-10)
                .reverse()
                .map(s => {
                    const estado = s.activo ? '🔴 ACTIVO' : '🟢 REMOVIDO';
                    const fecha = s.fecha ? `<t:${Math.floor(new Date(s.fecha).getTime() / 1000)}:d>` : '—';
                    return `• \`${s.id}\` [${estado}] **${s.regulacion}** — ${s.motivo} (${fecha})`;
                })
                .join('\n')
            : 'Sin strikes registrados.';

        // 2. Warnings
        let warnsTexto = 'Sin advertencias registradas.';
        let totalWarns = 0;
        try {
            const warns = await WarningService.getWarnings(interaction.guildId, target.id);
            totalWarns = warns.length;
            if (warns.length) {
                warnsTexto = warns
                    .slice(-8)
                    .reverse()
                    .map(w => {
                        const fecha = w.timestamp
                            ? `<t:${Math.floor(w.timestamp / 1000)}:d>`
                            : '—';
                        return `• **${w.reason}** — por <@${w.moderatorId}> (${fecha})`;
                    })
                    .join('\n');
            }
        } catch {
            warnsTexto = 'No se pudieron cargar las advertencias.';
        }

        // 3. Casos de moderación (ban, kick, timeout, etc.)
        let casosTexto = 'Sin casos registrados.';
        try {
            const casos = await getModerationCases(interaction.guildId, {
                userId: target.id,
                limit: 8
            });
            if (casos.length) {
                casosTexto = casos
                    .map(c => {
                        const fecha = c.createdAt
                            ? `<t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:d>`
                            : '—';
                        return `• **#${c.caseId}** ${c.action} — ${c.reason || 'Sin motivo'} (${fecha})`;
                    })
                    .join('\n');
            }
        } catch {
            casosTexto = 'No se pudieron cargar los casos.';
        }

        // 4. Staff strikes (si tiene registro de staff)
        let staffStrikesTexto = null;
        try {
            const staffData = await Staff.findOne({
                guildId: interaction.guildId,
                userId: target.id
            });
            if (staffData?.strikes?.length) {
                const activosStaff = staffData.strikes.filter(s => s.activo).length;
                staffStrikesTexto =
                    `**Activos:** \`${activosStaff}/3\`\n` +
                    staffData.strikes
                        .slice(-6)
                        .reverse()
                        .map(s => {
                            const estado = s.activo ? '🔴' : '🟢';
                            return `• ${estado} \`${s.idStrike}\` — ${s.motivo}`;
                        })
                        .join('\n');
            }
        } catch {
            // sin registro de staff
        }

        const embed = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle(`<:folder:1534938334650962115> Modlogs – ${target.username}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `**Usuario:** <@${target.id}>\n` +
                `**ID:** \`${target.id}\`\n` +
                `**Strikes activos:** \`${strikesActivos.length}\` · **Warns:** \`${totalWarns}\``
            )
            .addFields(
                {
                    name: `⚠️ Strikes de Comunidad (${strikes.length})`,
                    value: strikesTexto.length > 1024 ? strikesTexto.slice(0, 1000) + '...' : strikesTexto
                },
                {
                    name: `📝 Advertencias (${totalWarns})`,
                    value: warnsTexto.length > 1024 ? warnsTexto.slice(0, 1000) + '...' : warnsTexto
                },
                {
                    name: '🔨 Casos de Moderación',
                    value: casosTexto.length > 1024 ? casosTexto.slice(0, 1000) + '...' : casosTexto
                }
            )
            .setFooter({
                text: '00Y4n Comunidad SWFL • Sistema de Moderación',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        if (staffStrikesTexto) {
            embed.addFields({
                name: '<:staff:1534956881787752478> Staff Strikes',
                value: staffStrikesTexto.length > 1024
                    ? staffStrikesTexto.slice(0, 1000) + '...'
                    : staffStrikesTexto
            });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
