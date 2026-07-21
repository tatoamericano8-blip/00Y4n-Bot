import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { multasDB, ROL_WARRANT_ID, guardarMultas } from '../../utils/gestorMultas.js';
import { obtenerSaldo, restarSaldo } from '../../utils/gestorEconomia.js';

export default {
    data: new SlashCommandBuilder()
        .setName('pagar-multa')
        .setDescription('Salda una multa de tránsito pendiente descontando de tu saldo.')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('El número de ID de la multa (ej: 1, 2, 3...).')
                .setRequired(true)),

    async execute(interaction) {
        // Limpiamos el texto ingresado por si ponen "#1" o " 1 "
        const ticketID = interaction.options.getString('id').replace('#', '').trim();
        const usuarioId = interaction.user.id;

        // Búsqueda directa del ticket
        let ticket = multasDB.get(ticketID);

        // Búsqueda de respaldo por si se guardó como string/número
        if (!ticket && multasDB instanceof Map) {
            ticket = Array.from(multasDB.values()).find(m => String(m.id) === String(ticketID));
        }

        // 1. Validar existencia del ticket
        if (!ticket) {
            return await interaction.reply({
                content: `❌ No se encontró ninguna multa registrada con el ID **#${ticketID}**.`,
                ephemeral: true
            });
        }

        // 2. Validar estado del ticket
        if (ticket.estado === 'PAGADA') {
            return await interaction.reply({
                content: `⚠️ La multa **#${ticketID}** ya se encuentra completamente abonada.`,
                ephemeral: true
            });
        }

        // 3. Validar que la persona que la paga sea el infractor
        if (ticket.usuarioId !== usuarioId) {
            return await interaction.reply({
                content: `❌ Solo el usuario multado (<@${ticket.usuarioId}>) puede abonar esta multa.`,
                ephemeral: true
            });
        }

        // 4. VERIFICAR DINERO SUFICIENTE
        const saldoActual = obtenerSaldo(usuarioId);

        if (saldoActual < ticket.monto) {
            return await interaction.reply({
                content: `❌ **Fondos insuficientes.**\n` +
                         `• Costo de la multa: **$${ticket.monto.toLocaleString()}**\n` +
                         `• Tu saldo actual: **$${saldoActual.toLocaleString()}**\n\n` +
                         `💡 *Usa \`/work\` para trabajar y ganar dinero.*`,
                ephemeral: true
            });
        }

        // 5. Descontar el dinero y actualizar estado de la multa
        restarSaldo(usuarioId, ticket.monto);
        ticket.estado = 'PAGADA';
        multasDB.set(ticket.id, ticket);

        // 💾 Guardar permanentemente el nuevo estado ('PAGADA') en disco
        guardarMultas();

        // 6. Si tenía orden de arresto por mora, remover el rol
        if (interaction.member.roles.cache.has(ROL_WARRANT_ID)) {
            try {
                await interaction.member.roles.remove(ROL_WARRANT_ID);
            } catch (err) {
                console.error("Error al quitar el rol de Warrant:", err);
            }
        }

        const saldoRestante = obtenerSaldo(usuarioId);

        // Embed tachado formato GRVU adaptado a 00Y4n (#74d4fc)
        const embedPagada = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('✔️ ¡Ticket Pagado Exitosamente!')
            .setDescription(
                `~~User — <@${ticket.usuarioId}>~~\n` +
                `~~Issuer — <@${ticket.oficialId}>~~\n` +
                `~~Reason — ${ticket.razon}~~\n` +
                `~~Amount — $${ticket.monto.toLocaleString()}~~\n` +
                `~~ID — ${ticket.id}~~\n\n` +
                `💳 **Nuevo saldo en tu cuenta:** $${saldoRestante.toLocaleString()}`
            )
            .setFooter({ text: '00Y4n Comunidad SWFL • Registro de Pagos', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [embedPagada]
        });
    },
};
