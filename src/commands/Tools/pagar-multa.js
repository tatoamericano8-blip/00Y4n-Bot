import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { obtenerMulta, obtenerTodasLasMultas, guardarMulta, ROL_WARRANT_ID, revisarWarrantTrasPago } from '../../utils/gestorMultas.js';
import { getDescuentoMultaPorSeguro } from '../../utils/gestorTienda.js';
import { obtenerSaldo, restarSaldo } from '../../utils/gestorEconomia.js';
import { E } from '../../config/emojis.js';

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

        if (ticket.estado === 'ANULADA') {
            return await interaction.reply({
                content: `⚠️ La multa **#${ticketID}** está **anulada** y no se puede pagar.`,
                ephemeral: true
            });
        }

        const infractorId = ticket.usuarioId || ticket.usuario_id;
        const oficialId = ticket.emisorId || ticket.oficialId || ticket.oficial_id || ticket.emisor_id;
        const montoMulta = Number(ticket.monto);

        if (String(infractorId) !== String(usuarioId)) {
            return await interaction.reply({
                content: `${E.cruz} Solo el usuario multado (<@${infractorId}>) puede abonar esta multa.`,
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
                `\n${E.tilde} **${desc.label}:** -${Math.round(desc.pct * 100)}% ` +
                `(pagás **$${montoAPagar.toLocaleString('es-AR')}** en vez de **$${montoOriginal.toLocaleString('es-AR')}**, ` +
                `ahorrás **$${ahorro.toLocaleString('es-AR')}**)`;
        }

        const saldoActual = await obtenerSaldo(usuarioId);

        if (saldoActual < montoAPagar) {
            return await interaction.reply({
                content: `${E.cruz} **Fondos insuficientes.**\n` +
                         `• Costo de la multa: **$${montoAPagar.toLocaleString('es-AR')}**` +
                         (desc.pct > 0 ? ` (original $${montoOriginal.toLocaleString('es-AR')} con descuento)` : '') + `\n` +
                         `• Tu saldo actual: **$${saldoActual.toLocaleString('es-AR')}**\n\n` +
                         `${E.manual} *Usa \`/work\` para trabajar y ganar dinero.*`,
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
        const idFinal = ticket.id || ticketID;

        const embedPagada = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle(E.tilde + ' ¡Ticket Pagado Exitosamente!')
            .setDescription(
                `~~Usuario — <@${infractorId}>~~\n` +
                `~~Oficial — ${issuerTxt}~~\n` +
                `~~Infracción — ${ticket.razon}~~\n` +
                `~~Monto — $${montoAPagar.toLocaleString('es-AR')}~~` +
                (desc.pct > 0 ? ` (orig. $${montoOriginal.toLocaleString('es-AR')})` : '') + `\n` +
                `~~ID — ${idFinal}~~` +
                (textoDescuento || '') + `\n\n` +
                `${E.id || E.dot} **Nuevo saldo en tu cuenta:** $${saldoRestante.toLocaleString('es-AR')}`
            )
            .setFooter({ text: '00Y4n Comunidad SWFL • Registro de Pagos', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        // Editar el mensaje público de "multa emitida" (si existe referencia)
        let mensajeEditado = false;
        try {
            const channelId = ticket.channelId;
            const messageId = ticket.messageId;
            if (channelId && messageId) {
                const canal =
                    interaction.client.channels.cache.get(channelId) ||
                    (await interaction.client.channels.fetch(channelId).catch(() => null));
                if (canal?.messages) {
                    const msg = await canal.messages.fetch(messageId).catch(() => null);
                    if (msg) {
                        await msg.edit({
                            content: `${E.tilde} **Multa #${idFinal} pagada** — <@${infractorId}>`,
                            embeds: [embedPagada],
                            allowedMentions: { users: [] }
                        });
                        mensajeEditado = true;
                    }
                }
            }
        } catch (e) {
            console.error('[pagar-multa] No se pudo editar mensaje de multa:', e?.message || e);
        }

        // Confirmación solo para quien paga (efímero)
        return await interaction.reply({
            content:
                `${E.tilde} **Multa #${idFinal} pagada exitosamente.**` +
                (mensajeEditado ? '' : ' *(El aviso público original no se pudo actualizar; la multa quedó registrada como pagada.)*') +
                `\n${E.dot} Monto abonado: **$${montoAPagar.toLocaleString('es-AR')}**` +
                `\n${E.dot} Nuevo saldo: **$${saldoRestante.toLocaleString('es-AR')}**`,
            flags: MessageFlags.Ephemeral
        });
    },
};
