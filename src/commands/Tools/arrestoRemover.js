import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { obtenerArresto, anularArresto } from '../../utils/gestorArrestos.js';

export default {
    data: new SlashCommandBuilder()
        .setName('arresto-remover')
        .setDescription('Anula un arresto registrado (Exclusivo Policía de Sarasota).')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('ID del arresto a anular.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo de la anulación.')
                .setRequired(true)),

    async execute(interaction) {
        const ROL_POLICIA_ID = '1529146302783422706';
        const CHANNEL_LOGS = '1529175493029531738';

        if (!interaction.member.roles.cache.has(ROL_POLICIA_ID)) {
            return await interaction.reply({
                content: '❌ **Acceso denegado.** Solo los oficiales del **Departamento Policial del Condado de Sarasota** pueden anular arrestos.',
                ephemeral: true
            });
        }

        const arrestoID = interaction.options.getString('id');
        const motivo = interaction.options.getString('motivo');

        const arresto = await obtenerArresto(arrestoID);
        if (!arresto) {
            return await interaction.reply({
                content: `❌ No se encontró ningún arresto con el ID \`${arrestoID}\`.`,
                ephemeral: true
            });
        }

        if (arresto.estado === 'ANULADO') {
            return await interaction.reply({
                content: `❌ El arresto \`${arrestoID}\` ya se encuentra anulado.`,
                ephemeral: true
            });
        }

        await anularArresto(arrestoID, interaction.user.id, motivo);

        const embed = new EmbedBuilder()
            .setColor('#57f287')
            .setTitle('<:folder:1523041295868756008> Arresto Anulado')
            .setDescription(
                `• **ID Arresto -** \`${arrestoID}\`\n` +
                `• **Ciudadano -** <@${arresto.usuarioId}>\n` +
                `• **Anulado por -** <@${interaction.user.id}>\n` +
                `• **Motivo -** ${motivo}`
            )
            .setFooter({
                text: '00Y4n Comunidad SWFL • Departamento Policial de Sarasota',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Log
        const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);
        if (logsChannel) {
            const embedLog = new EmbedBuilder()
                .setColor('#57f287')
                .setTitle('<:folder:1523041295868756008> Arresto Anulado')
                .setDescription(
                    `> **ID:** \`${arrestoID}\`\n` +
                    `> **Ciudadano:** <@${arresto.usuarioId}>\n` +
                    `> **Anulado por:** <@${interaction.user.id}>\n` +
                    `> **Motivo:** ${motivo}`
                )
                .setTimestamp();

            await logsChannel.send({ embeds: [embedLog] });
        }
    },
};
