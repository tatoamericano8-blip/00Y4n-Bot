import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { obtenerMulta, obtenerTodasLasMultas, guardarMulta, ROL_WARRANT_ID } from '../../utils/gestorMultas.js';
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

        // Búsqueda de la multa en la BD (asíncrono)
        let ticket = null;
        if (typeof obtenerMulta === 'function') {
            ticket = await obtenerMulta(ticketID);
        }

        // Búsqueda de respaldo en la lista completa
        if (!ticket && typeof obtenerTodasLasMultas === 'function') {
            const todas = await obtenerTodasLasMultas();
            const arrayMultas = Array.isArray(todas) ? todas : Object.values(todas || {});
            ticket = arrayMultas.find(m => String(m.id) === String(ticketID));
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

        // Detectar ID de usuario (soporte usuarioId o usuario_id)
        const infractorId = ticket.usuarioId || ticket.usuario_id;
        const oficialId = ticket.oficialId || ticket.oficial_id;
        const montoMulta = Number(ticket.monto);

        // 3. Validar que la persona que la paga sea el infractor
        if (String(infractorId) !== String(usuarioId)) {
            return await interaction.reply({
                content: `❌ Solo el usuario multado (<@${infractorId}>) puede abonar esta multa.`,
                ephemeral: true
            });
        }

        // 4. VERIFICAR DINERO SUFICIENTE (con await)
        const saldoActual = await obtenerSaldo(usuarioId);

        if (saldoActual < montoMulta) {
            return await interaction.reply({
                content: `❌ **Fondos insuficientes.**\n` +
                         `• Costo de la multa: **$${montoMulta.toLocaleString()}**\n` +
                         `• Tu saldo actual: **$${saldoActual.toLocaleString()}**\n\n` +
                         `💡 *Usa \`/work\` para trabajar y ganar dinero.*`,
                ephemeral: true
            });
        }

        // 5. Descontar el dinero y actualizar estado de la multa
        await restarSaldo(usuarioId, montoMulta);
        ticket.estado = 'PAGADA';

        // Guardar el estado 'PAGADA' permanentemente en la BD
        await guardarMulta(ticket.id || ticketID, ticket);

        // 6. Si tenía orden de arresto por mora (Warrant), remover el rol
        if (ROL_WARRANT_ID && interaction.member.roles.cache.has(ROL_WARRANT_ID)) {
            try {
                await interaction.member.roles.remove(ROL_WARRANT_ID);
            } catch (err) {
                console.error("Error al quitar el rol de Warrant:", err);
            }
        }

        const saldoRestante = await obtenerSaldo(usuarioId);

        // Embed tachado formato 00Y4n (#74d4fc)
        const embedPagada = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('✔️ ¡Ticket Pagado Exitosamente!')
            .setDescription(
                `~~User — <@${infractorId}>~~\n` +
                `~~Issuer — <@${oficialId}>~~\n` +
                `~~Reason — ${ticket.razon}~~\n` +
                `~~Amount — $${montoMulta.toLocaleString()}~~\n` +
                `~~ID — ${ticket.id || ticketID}~~\n\n` +
                `💳 **Nuevo saldo en tu cuenta:** $${saldoRestante.toLocaleString()}`
            )
            .setFooter({ text: '00Y4n Comunidad SWFL • Registro de Pagos', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [embedPagada]
        });
    },
};
