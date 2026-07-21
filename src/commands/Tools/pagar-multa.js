import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { multasDB, ROL_WARRANT_ID } from '../../utils/gestorMultas.js';

export default {
    data: new SlashCommandBuilder()
        .setName('pagar-multa')
        .setDescription('Salda una multa de tránsito pendiente.')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('El número de ID de la multa (ej: 572).')
                .setRequired(true)),

    async execute(interaction) {
        const ticketID = interaction.options.getString('id');
        const ticket = multasDB.get(ticketID);

        // Validar si la multa existe
        if (!ticket) {
            return await interaction.reply({
                content: `<:cruz:1523041302764191844> No se encontró ninguna multa registrada con el ID **#${ticketID}**.`,
                ephemeral: true
            });
        }

        // Validar si ya está pagada
        if (ticket.estado === 'PAGADA') {
            return await interaction.reply({
                content: `<a:adv:1523027438030946446> La multa **#${ticketID}** ya se encuentra abonada.`,
                ephemeral: true
            });
        }

        // Validar que la persona que la paga sea el sancionado
        if (ticket.usuarioId !== interaction.user.id) {
            return await interaction.reply({
                content: `<:cruz:1523041302764191844> Solo el usuario multado (<@${ticket.usuarioId}>) puede abonar este ticket.`,
                ephemeral: true
            });
        }

        // Marcar multa como pagada
        ticket.estado = 'PAGADA';

        // Si el usuario ya tenía el rol de Orden de Arresto por demora, se lo retiramos
        if (interaction.member.roles.cache.has(ROL_WARRANT_ID)) {
            try {
                await interaction.member.roles.remove(ROL_WARRANT_ID);
            } catch (err) {
                console.error("No se pudo remover el rol de Warrant:", err);
            }
        }

        // Diseñar Embed tachado replicando la imagen de GRVU cuando se paga
        const embedPagada = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<:tilde:1524936452574806076> ¡Ticket Pagado!')
            .setDescription(
                `~~User — <@${ticket.usuarioId}>~~\n` +
                `~~Issuer — <@${ticket.oficialId}>~~\n` +
                `~~Reason — ${ticket.razon}~~\n` +
                `~~Amount — $${ticket.monto.toLocaleString()}~~\n` +
                `~~ID — ${ticket.id}~~`
            )
            .setFooter({ text: '00Y4n Comunidad SWFL • Registro de Pagos', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [embedPagada],
            allowedMentions: { parse: [] }
        });
    },
};
