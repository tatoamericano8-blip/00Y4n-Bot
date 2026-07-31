import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import {
    removerStrike,
    buscarStrikePorId,
    obtenerStrikesActivos
} from '../../utils/gestorStrikes.js';

const ROLE_STAFF = '1512120103771050005';
const ROLE_HIGH_COMMAND = '1528870731629465752';
const CHANNEL_LOGS = '1505015805891579934';

export default {
    data: new SlashCommandBuilder()
        .setName('delstrike')
        .setDescription('Remueve un strike activo de un miembro.')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Miembro al que se le remueve el strike.')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('id_strike')
                .setDescription('ID del strike (ej: STR-A1B2C3).')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('motivo')
                .setDescription('Motivo de la remoción.')
                .setRequired(true)),

    async execute(interaction) {
        const esStaff =
            interaction.member.roles.cache.has(ROLE_STAFF) ||
            interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) ||
            interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);

        if (!esStaff) {
            return interaction.reply({
                content: '❌ Solo el **Staff** puede remover strikes.',
                flags: MessageFlags.Ephemeral
            });
        }

        const target = interaction.options.getUser('usuario');
        const idStrike = interaction.options.getString('id_strike').trim().toUpperCase();
        const motivo = interaction.options.getString('motivo');

        await interaction.deferReply();

        const strike = await removerStrike(
            interaction.guildId,
            target.id,
            idStrike,
            interaction.user.id,
            motivo
        );

        if (!strike) {
            // Intentar búsqueda global por si el ID existe en otro usuario
            const encontrado = await buscarStrikePorId(interaction.guildId, idStrike);
            if (encontrado && encontrado.userId !== target.id) {
                return interaction.editReply({
                    content: `❌ El strike \`${idStrike}\` pertenece a <@${encontrado.userId}>, no a <@${target.id}>.`
                });
            }
            return interaction.editReply({
                content: `❌ No se encontró un strike **activo** con el ID \`${idStrike}\` para <@${target.id}>.`
            });
        }

        const activos = await obtenerStrikesActivos(interaction.guildId, target.id);

        const embed = new EmbedBuilder()
            .setColor('#57f287')
            .setTitle('✅ Strike removido')
            .setDescription(
                `• **Usuario:** <@${target.id}>\n` +
                `• **ID de Strike:** \`${strike.id}\`\n` +
                `• **Regulación original:** ${strike.regulacion}\n` +
                `• **Motivo de remoción:** ${motivo}\n` +
                `• **Removido por:** <@${interaction.user.id}>\n` +
                `• **Strikes activos restantes:** \`${activos.length}\``
            )
            .setFooter({
                text: '00Y4n Comunidad SWFL • Sistema de Moderación',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);
        if (logsChannel) {
            await logsChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#57f287')
                        .setTitle('✅ Strike de Comunidad Removido')
                        .setDescription(
                            `> **Usuario:** <@${target.id}>\n` +
                            `> **ID:** \`${strike.id}\`\n` +
                            `> **Motivo remoción:** ${motivo}\n` +
                            `> **Removido por:** <@${interaction.user.id}>\n` +
                            `> **Activos restantes:** \`${activos.length}\``
                        )
                        .setTimestamp()
                ]
            });
        }
    }
};
