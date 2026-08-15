import { SlashCommandBuilder, EmbedBuilder,
    MessageFlags} from 'discord.js';
import { obtenerMulta, guardarMulta } from '../../utils/gestorMultas.js';

export default {
    data: new SlashCommandBuilder()
        .setName('multa-remover')
        .setDescription('Anula una multa de tránsito (Exclusivo Policía de Sarasota).')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('ID de la multa a anular.')
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
                content: '❌ **Acceso denegado.** Solo los oficiales del **Departamento Policial del Condado de Sarasota** pueden anular multas.',
                ephemeral: true
            });
        }

        const ticketID = interaction.options.getString('id');
        const motivo = interaction.options.getString('motivo');

        const multa = await obtenerMulta(ticketID);
        if (!multa) {
            return await interaction.reply({
                content: `❌ No se encontró ninguna multa con el ID \`${ticketID}\`.`,
                ephemeral: true
            });
        }

        if (multa.estado === 'ANULADA' || multa.estado === 'PAGADA') {
            return await interaction.reply({
                content: `❌ La multa \`${ticketID}\` ya se encuentra en estado **${multa.estado}**.`,
                ephemeral: true
            });
        }

        multa.estado = 'ANULADA';
        multa.anuladoPor = interaction.user.id;
        multa.motivoAnulacion = motivo;
        multa.fechaAnulacion = new Date().toISOString();

        await guardarMulta(ticketID, multa);

        const embed = new EmbedBuilder()
            .setColor('#57f287')
            .setTitle('<:folder:1534938334650962115> Multa Anulada')
            .setDescription(
                `• **ID Multa -** \`${ticketID}\`\n` +
                `• **Ciudadano -** <@${multa.usuarioId}>\n` +
                `• **Anulada por -** <@${interaction.user.id}>\n` +
                `• **Motivo -** ${motivo}\n` +
                `• **Monto original -** $${multa.monto.toLocaleString()}`
            )
            .setFooter({
                text: '00Y4n Comunidad SWFL • Departamento Policial de Sarasota',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({
            content: '<:tilde:1534937809733812286> Multa anulada.',
            flags: MessageFlags.Ephemeral
        });
        await interaction.channel.send({ embeds: [embed] });

        const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);
        if (logsChannel) {
            const embedLog = new EmbedBuilder()
                .setColor('#57f287')
                .setTitle('<:folder:1534938334650962115> Multa Anulada')
                .setDescription(
                    `> **ID:** \`${ticketID}\`\n` +
                    `> **Ciudadano:** <@${multa.usuarioId}>\n` +
                    `> **Anulada por:** <@${interaction.user.id}>\n` +
                    `> **Motivo:** ${motivo}`
                )
                .setTimestamp();

            await logsChannel.send({ embeds: [embedLog] });
        }
    },
};
