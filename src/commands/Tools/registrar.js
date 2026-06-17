import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'registrar_swfl',
        description: 'Gestiona la matriculación de vehículos para el juego.',
        options: [
            // 📝 SUBCOMANDO: REGISTRAR
            {
                name: 'registrar',
                description: 'Registra un nuevo vehículo en la base de datos oficial.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'marca', description: 'Marca del auto (Ej: Ferrari, Aston Martin, Nissan)', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'modelo', description: 'Modelo exacto (Ej: 488 Pista, Vantage, GTR)', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'año', description: 'Año de fabricación del vehículo', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'color', description: 'Color de la carrocería', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'patente', description: 'Texto de la matrícula / placa del auto', type: ApplicationCommandOptionType.String, required: true }
                ]
            },
            // 🗑️ SUBCOMANDO: REMOVER
            {
                name: 'remover',
                description: 'Da de baja un vehículo registrado anteriormente.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'patente', description: 'Escribe la matrícula del auto que deseas remover.', type: ApplicationCommandOptionType.String, required: true }
                ]
            }
        ]
    },

    async execute(interaction) {
        const subcomando = interaction.options.getSubcommand();

        // 🏎️ LÓGICA DE REGISTRO
        if (subcomando === 'registrar') {
            const marca = interaction.options.getString('marca');
            const modelo = interaction.options.getString('modelo');
            const año = interaction.options.getString('año');
            const color = interaction.options.getString('color');
            const patente = interaction.options.getString('patente').toUpperCase();

            // Formato ultra estético evolucionado de la imagen image_43f483.png
            const embedRegistro = new EmbedBuilder()
                .setTitle('📋 SWFL | FORMATO DE MATRICULACIÓN DE VEHÍCULOS')
                .setDescription(
                    `> El siguiente vehículo ha sido cargado exitosamente en el sistema de patentes de la comunidad y se encuentra apto para circular.\n\n` +
                    `• **Marca:** ${marca}\n` +
                    `• **Modelo:** ${modelo}\n` +
                    `• **Año:** ${año}\n` +
                    `• **Color:** ${color}\n` +
                    `• **Matrícula:** \`${patente}\`\n` +
                    `• **Propietario:** <@${interaction.user.id}>`
                )
                .setColor('#ff6600')
                .setFooter({ text: 'Sistema de Tránsito Oficial' })
                .setTimestamp();

            return await interaction.reply({ embeds: [embedRegistro] });
        }

        // 🗑️ LÓGICA DE REMOCIÓN / UNREGISTER
        if (subcomando === 'remover') {
            const patente = interaction.options.getString('patente').toUpperCase();

            const embedRemover = new EmbedBuilder()
                .setTitle('🗑️ SWFL | ANULACIÓN DE MATRICULA')
                .setDescription(
                    `> Se ha revocado el permiso de circulación para el vehículo registrado con la siguiente placa:\n\n` +
                    `• **Matrícula Removida:** \`${patente}\`\n` +
                    `• **Solicitante:** <@${interaction.user.id}>\n\n` +
                    `*Nota: Si vendiste el auto o cambiaste de patente, recuerda volver a usar el subcomando /matricula_swfl registrar.*`
                )
                .setColor('#ff6600')
                .setFooter({ text: 'Bajas del Sistema de Tránsito' })
                .setTimestamp();

            return await interaction.reply({ embeds: [embedRemover] });
        }
    }
};
