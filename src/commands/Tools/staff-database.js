import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import Staff from '../../../models/Staff.js';

const ROLE_HIGH_COMMAND = '1528870731629465752';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-database')
        .setDescription('Historial auditable de sanciones, contrataciones y renuncias del personal.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Staff a consultar.').setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> Solo Alto Comando tiene acceso a la Base de Datos auditable.',
                flags: MessageFlags.Ephemeral
            });
        }

        const targetUser = interaction.options.getUser('usuario');
        let staffData = await Staff.findOne({ guildId: interaction.guildId, userId: targetUser.id });

        if (!staffData) {
            return await interaction.reply({
                content: `<:cruz00y4n:1523041302764191844> No hay historial auditable para <@${targetUser.id}>.`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        const listaStrikes = staffData.strikes.map(s => 
            `• \`${s.idStrike}\` [${s.activo ? '🔴 ACTIVO' : '🟢 REMOVIDO'}]: ${s.motivo} (Por: <@${s.aplicadoPor}>)`
        ).join('\n') || 'Sin sanciones en el historial.';

        const embedAudit = new EmbedBuilder()
            .setTitle(`🗄️ Expediente Auditable – ${targetUser.username}`)
            .setColor('#74d4fc')
            .setThumbnail(targetUser.displayAvatarURL())
            .setDescription(
                `> **ID de Usuario:** \`${staffData.userId}\`\n` +
                `> **Estado Actual:** \`${staffData.estado}\`\n` +
                `> **Fecha de Ingreso:** <t:${Math.floor(new Date(staffData.ingreso).getTime() / 1000)}:R>`
            )
            .addFields(
                { name: '⚠️ Historial de Strikes', value: listaStrikes.length > 1024 ? listaStrikes.substring(0, 1000) + '...' : listaStrikes },
                { name: '📋 Historial de Ausencias (LOA)', value: `Total registradas: \`${staffData.loa.historial.length}\`` }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embedAudit] });
    }
};
