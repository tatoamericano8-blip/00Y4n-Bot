import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { obtenerMulta, obtenerTodasLasMultas, guardarMulta, ROL_WARRANT_ID, revisarWarrantTrasPago } from '../../utils/gestorMultas.js';
import { getDescuentoMultaPorSeguro } from '../../utils/gestorTienda.js';
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
        const ticketID = interaction.options.getString('id').replace('#', '').trim();
        const usuarioId = interaction.user.id;

        let ticket = null;
        if (typeof obtenerMulta === 'function') {
            ticket = await obtenerMulta(ticketID);
        }

        if (!ticket && typeof obtenerTodasLasMultas === 'function') {
            const todas = await obtenerTodasLasMultas();
            const arrayMultas = Array.isArray(todas) ? todas : Object.values(todas || {});
            ticket = arrayMultas.find(m => String(m.id) === String(ticketID));
        }

        if (!ticket) {
            return await interaction.reply({
                content: `❌ No se encontró ninguna multa registrada con el ID **#${ticketID}**.`,
                ephemeral: true
            });
        }

        if (ticket.estado === 'PAGADA') {
            return await interaction.reply({
                content: `⚠️ La multa **#${ticketID}** ya se encuentra completamente abonada.`,
                ephemeral: true
            });
        }

        const infractorId = ticket.usuarioId || ticket.usuario_id;
        const oficialId = ticket.emisorId || ticket.oficialId || ticket.oficial_id || ticket.emisor_id;
        const montoMulta = Number(ticket.monto);

        if (String(infractorId) !== String(usuarioId)) {
            return await interaction.reply({
                content: `<:cruz:1534937767652495360> Solo el usuario multado (<@${infractorId}>) puede abonar esta multa.`,
                ephemeral: true
            });
        }

        // Seguro: descuento al pagar
        const desc = await getDescuentoMultaPorSeguro(interaction.member);
        const montoOriginal = montoMulta;
        let montoAPagar = montoOriginal;
        let textoDescuento = '';
        if (desc.pct > 0) {
            montoAPagar = Math.max(1, Math.round(montoOriginal * (1 - desc.pct)));
            const ahorro = montoOriginal - montoAPagar;
            textoDescuento =
                `\n<:tilde:1534937809733812286> **${desc.label}:** -${Math.round(desc.pct * 100)}% ` +
                `(pagás **$${montoAPagar.toLocaleString()}** en vez de **$${montoOriginal.toLocaleString()}**, ` +
                `ahorrás **$${ahorro.toLocaleString()}**)`;
        }

        const saldoActual = await obtenerSaldo(usuarioId);

        if (saldoActual < montoAPagar) {
            return await interaction.reply({
                content: `<:cruz:1534937767652495360> **Fondos insuficientes.**\n` +
                         `• Costo de la multa: **$${montoAPagar.toLocaleString()}**` +
                         (desc.pct > 0 ? ` (original $${montoOriginal.toLocaleString()} con descuento)` : '') + `\n` +
                         `• Tu saldo actual: **$${saldoActual.toLocaleString()}**\n\n` +
                         `<:manual:1534999731019972671> *Usa \`/work\` para trabajar y ganar dinero.*`,
                ephemeral: true
            });
        }

        await restarSaldo(usuarioId, montoAPagar);
        ticket.estado = 'PAGADA';
        ticket.fechaPago = new Date().toISOString();
        ticket.montoPagado = montoAPagar;
        ticket.montoOriginal = montoOriginal;
        if (desc.plan) ticket.seguroAplicado = desc.plan;
        await guardarMulta(ticket.id || ticketID, ticket);

        try {
            await revisarWarrantTrasPago(interaction.member, usuarioId);
        } catch (err) {
            console.error('Error al revisar rol de Warrant tras pago:', err);
        }

        const saldoRestante = await obtenerSaldo(usuarioId);
        const issuerTxt = oficialId ? `<@${oficialId}>` : 'Sin registrar';

        const embedPagada = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<:tilde:1534937809733812286> ¡Ticket Pagado Exitosamente!')
            .setDescription(
                `~~User — <@${infractorId}>~~\n` +
                `~~Issuer — ${issuerTxt}~~\n` +
                `~~Reason — ${ticket.razon}~~\n` +
                `~~Amount — $${montoAPagar.toLocaleString()}~~` +
                (desc.pct > 0 ? ` (orig. $${montoOriginal.toLocaleString()})` : '') + `\n` +
                `~~ID — ${ticket.id || ticketID}~~` +
                (textoDescuento || '') + `\n\n` +
                `<:id:1534937551092187136> **Nuevo saldo en tu cuenta:** $${saldoRestante.toLocaleString()}`
            )
            .setFooter({ text: '00Y4n Comunidad SWFL • Registro de Pagos', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [embedPagada]
        });
    },
};
