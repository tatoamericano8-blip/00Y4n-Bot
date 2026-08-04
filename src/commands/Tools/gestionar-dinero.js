import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { obtenerSaldo, agregarSaldo, restarSaldo } from '../../utils/gestorEconomia.js';

export default {
    data: new SlashCommandBuilder()
        .setName('gestionar-dinero')
        .setDescription('Administra la cuenta bancaria de un ciudadano (Exclusivo Gerente de Staff).')
        .addSubcommand(subcommand =>
            subcommand
                .setName('agregar')
                .setDescription('Añade fondos al balance de un usuario.')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('El ciudadano que recibirá el dinero.')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('cantidad')
                        .setDescription('Monto en dólares ($) a depositar.')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('quitar')
                .setDescription('Resta fondos del balance de un usuario.')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('El ciudadano al que se le retirará el dinero.')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('cantidad')
                        .setDescription('Monto en dólares ($) a retirar.')
                        .setRequired(true))
        ),

    async execute(interaction) {
        const ROL_GERENTE_STAFF = '1452684893850177587';

        if (!interaction.member.roles.cache.has(ROL_GERENTE_STAFF)) {
            return await interaction.reply({
                content: '❌ **Acceso denegado.** Este comando es exclusivo del rol **Gerente de Staff**.',
                ephemeral: true
            });
        }

        const subcomando = interaction.options.getSubcommand();
        const objetivo = interaction.options.getUser('usuario');
        const cantidad = interaction.options.getInteger('cantidad');

        if (cantidad <= 0) {
            return await interaction.reply({
                content: '⚠️ La cantidad a modificar debe ser mayor a 0 dólares.',
                ephemeral: true
            });
        }

        const saldoActual = await obtenerSaldo(objetivo.id);
        let nuevoSaldo = 0;
        let accionTexto = '';

        if (subcomando === 'agregar') {
            nuevoSaldo = await agregarSaldo(objetivo.id, cantidad);
            accionTexto = `✅ Se han depositado **$${cantidad.toLocaleString('es-AR')}** exitosamente en la cuenta de <@${objetivo.id}>.`;
        } else if (subcomando === 'quitar') {
            if (saldoActual <= 0) {
                return await interaction.reply({
                    content: `⚠️ <@${objetivo.id}> no tiene fondos en su cuenta (Saldo actual: **$0**). No es posible retirarle dinero.`,
                    ephemeral: true
                });
            }

            const montoARestar = Math.min(saldoActual, cantidad);
            nuevoSaldo = await restarSaldo(objetivo.id, montoARestar);

            accionTexto = `📉 Se han incautado/retirado **$${montoARestar.toLocaleString('es-AR')}** de la cuenta de <@${objetivo.id}>.`;
        }

        const embedAuditoria = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('🏦 Gestión Bancaria Central | Auditoría')
            .setDescription(
                `${accionTexto}\n\n` +
                `• **Balance anterior:** $${saldoActual.toLocaleString('es-AR')}\n` +
                `• **Nuevo balance:** **$${nuevoSaldo.toLocaleString('es-AR')}**\n\n` +
                `> *Operación autorizada por: <@${interaction.user.id}>*`
            )
            .setFooter({
                text: `${interaction.guild.name} • Auditoría Económica`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embedAuditoria],
            allowedMentions: { parse: [] }
        });
    },
};
