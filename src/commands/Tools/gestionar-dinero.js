import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { obtenerSaldo, agregarSaldo, saldosDB } from '../../utils/gestorEconomia.js';

export default {
    data: new SlashCommandBuilder()
        .setName('gestionar-dinero')
        .setDescription('Administra la cuenta bancaria de un ciudadano (Exclusivo Alto Mando).')
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
        // ID del Rol de Alto Mando
        const ROL_ALTO_MANDO = '1528870731629465752';

        // 🛑 Control de Seguridad: Verificar si tiene el rol de Alto Mando
        if (!interaction.member.roles.cache.has(ROL_ALTO_MANDO)) {
            return await interaction.reply({
                content: '❌ **Acceso denegado.** Esta acción es clasificada y está restringida únicamente para el **Alto Mando**.',
                ephemeral: true
            });
        }

        const subcomando = interaction.options.getSubcommand();
        const objetivo = interaction.options.getUser('usuario');
        const cantidad = interaction.options.getInteger('cantidad');

        // Validar que no ingresen números negativos ni ceros en el monto
        if (cantidad <= 0) {
            return await interaction.reply({ 
                content: '⚠️ La cantidad modificada debe ser mayor a 0 dólares.', 
                ephemeral: true 
            });
        }

        const saldoActual = obtenerSaldo(objetivo.id);
        let nuevoSaldo;
        let accionTexto = '';

        // Lógica según el subcomando elegido
        if (subcomando === 'agregar') {
            nuevoSaldo = agregarSaldo(objetivo.id, cantidad);
            accionTexto = `✅ Se han depositado **$${cantidad.toLocaleString()}** exitosamente en la cuenta de <@${objetivo.id}>.`;
            
        } else if (subcomando === 'quitar') {
            nuevoSaldo = saldoActual - cantidad;
            
            // Prevenir saldos negativos
            if (nuevoSaldo < 0) nuevoSaldo = 0; 
            
            // Forzamos la actualización directa en la DB para saltar la validación de fondos insuficientes
            saldosDB.set(objetivo.id, nuevoSaldo); 
            
            accionTexto = `📉 Se han incautado/retirado **$${cantidad.toLocaleString()}** de la cuenta de <@${objetivo.id}>.`;
        }

        // Armar el Embed al estilo 00Y4n (#74d4fc)
        const embedAuditoria = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('🏦 Gestión Bancaria Central | Auditoría')
            .setDescription(
                `${accionTexto}\n\n` +
                `• **Balance anterior:** $${saldoActual.toLocaleString()}\n` +
                `• **Nuevo balance:** **$${nuevoSaldo.toLocaleString()}**\n\n` +
                `> *Operación autorizada por: <@${interaction.user.id}>*`
            )
            .setFooter({ 
                text: '00Y4n Comunidad SWFL • Auditoría Económica', 
                iconURL: interaction.guild.iconURL() 
            })
            .setTimestamp();

        // Enviar respuesta
        await interaction.reply({
            embeds: [embedAuditoria],
            allowedMentions: { parse: [] } // Evita pinear al usuario al que le modifican el balance
        });
    },
};
