import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { obtenerSaldo, agregarSaldo } from '../../utils/gestorEconomia.js';

// Límite máximo por transferencia (igual al de la imagen)
const MONTO_MAXIMO_TRANSFERENCIA = 100000;

export default {
    data: new SlashCommandBuilder()
        .setName('pagar')
        .setDescription('Transfiere dinero de tu cuenta a otro ciudadano.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario al que le vas a transferir dinero.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('monto')
                .setDescription(`Monto en dólares (máximo $${MONTO_MAXIMO_TRANSFERENCIA.toLocaleString('es-AR')} por transferencia).`)
                .setMinValue(1)
                .setMaxValue(MONTO_MAXIMO_TRANSFERENCIA)
                .setRequired(true)),

    async execute(interaction) {
        const emisor = interaction.user;
        const receptor = interaction.options.getUser('usuario');
        const monto = interaction.options.getInteger('monto');

        // 1. Validaciones básicas de seguridad
        if (receptor.id === emisor.id) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> No podés transferirte dinero a vos mismo.',
                ephemeral: true
            });
        }

        if (receptor.bot) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> No podés transferirle dinero a un bot.',
                ephemeral: true
            });
        }

        // 2. Verificar si el usuario tiene saldo suficiente
        const saldoEmisor = await obtenerSaldo(emisor.id);

        if (saldoEmisor < monto) {
            return await interaction.reply({
                content: `<:cruz00y4n:1523041302764191844> No tenés suficiente dinero para realizar esta transferencia.\n` +
                         `• **Tu saldo actual:** $${saldoEmisor.toLocaleString('es-AR')}`,
                ephemeral: true
            });
        }

        // 3. Ejecutar la transferencia
        const nuevoSaldoEmisor = await agregarSaldo(emisor.id, -monto);
        const nuevoSaldoReceptor = await agregarSaldo(receptor.id, monto);

        // 4. Enviar confirmación en un Embed con diseño de 00Y4n
        const embedPay = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<a:dinero:1529160799392632832> Transferencia Exitosa')
            .setDescription(
                `Le has transferido **$${monto.toLocaleString('es-AR')}** a ${receptor}.\n\n` +
                `• **Tu nuevo saldo:** $${nuevoSaldoEmisor.toLocaleString('es-AR')}\n` +
                `• **Receptor:** ${receptor}`
            )
            .setFooter({ 
                text: `${interaction.guild.name} • Sistema de Economía`, 
                iconURL: interaction.guild.iconURL({ dynamic: true }) 
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embedPay] });
    }
};
