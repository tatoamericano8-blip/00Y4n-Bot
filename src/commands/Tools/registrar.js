import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

// 📦 Inicialización de la base de datos en memoria compartida
global.baseDatosVehiculos = global.baseDatosVehiculos || new Map();

export default {
    data: {
        name: 'matricula_swfl',
        description: 'Gestiona la matriculación de vehículos para el juego.',
        options: [
            {
                name: 'registrar',
                description: 'Registra un nuevo vehículo en la base de datos oficial.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    { name: 'marca', description: 'Marca del auto (Ej: Ferrari, Nissan)', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'modelo', description: 'Modelo exacto (Ej: 488 Pista, GTR)', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'año', description: 'Año de fabricación del vehículo', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'color', description: 'Color de la carrocería', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'patente', description: 'Texto de la matrícula / placa del auto', type: ApplicationCommandOptionType.String, required: true }
                ]
            },
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
        const usuarioId = interaction.user.id;

        // 🏎️ LÓGICA DE REGISTRO
        if (subcomando === 'registrar') {
            const marca = interaction.options.getString('marca');
            const modelo = interaction.options.getString('modelo');
            const año = interaction.options.getString('año');
            const color = interaction.options.getString('color');
            const patente = interaction.options.getString('patente').toUpperCase();

            // Obtener lista actual del usuario o crear una nueva
            const misAutos = global.baseDatosVehiculos.get(usuarioId) || [];

            // Evitar que registre dos veces la misma patente
            if (misAutos.some(auto => auto.patente === patente)) {
                return await interaction.reply({
                    content: `❌ Ya tienes un vehículo registrado con la matrícula \`${patente}\`.`,
                    ephemeral: true
                });
            }

            // Guardar el vehículo en la lista
            misAutos.push({ marca, modelo, año, color, patente });
            global.baseDatosVehiculos.set(usuarioId, misAutos);

            const embedRegistro = new EmbedBuilder()
                .setTitle('📋 SWFL | FORMATO DE MATRICULACIÓN DE VEHÍCULOS')
                .setDescription(
                    `> El siguiente vehículo ha sido cargado exitosamente en el sistema de patentes de la comunidad y se encuentra apto para circular.\n\n` +
                    `• **Marca:** ${marca}\n` +
                    `• **Modelo:** ${modelo}\n` +
                    `• **Año:** ${año}\n` +
                    `• **Color:** ${color}\n` +
                    `• **Matrícula:** \`${patente}\`\n` +
                    `• **Propietario:** <@${usuarioId}>`
                )
                .setColor('#ff6600')
                .setFooter({ text: 'Sistema de Tránsito Oficial' })
                .setTimestamp();

            return await interaction.reply({ embeds: [embedRegistro] });
        }

        // 🗑️ LÓGICA DE REMOCIÓN
        if (subcomando === 'remover') {
            const patente = interaction.options.getString('patente').toUpperCase();
            let misAutos = global.baseDatosVehiculos.get(usuarioId) || [];

            const existe = misAutos.some(auto => auto.patente === patente);
            if (!existe) {
                return await interaction.reply({
                    content: `❌ No posees ningún vehículo registrado bajo la matrícula \`${patente}\`.`,
                    ephemeral: true
                });
            }

            // Filtrar y quitar el auto seleccionado
            misAutos = misAutos.filter(auto => auto.patente !== patente);
            global.baseDatosVehiculos.set(usuarioId, misAutos);

            const embedRemover = new EmbedBuilder()
                .setTitle('🗑️ SWFL | ANULACIÓN DE MATRICULA')
                .setDescription(
                    `> Se ha revocado el permiso de circulación para el vehículo registrado con la siguiente placa:\n\n` +
                    `• **Matrícula Removida:** \`${patente}\`\n` +
                    `• **Solicitante:** <@${usuarioId}>\n\n` +
                    `*Nota: Si vendiste el auto o cambiaste de patente, recuerda volver a usar el subcomando /matricula_swfl registrar.*`
                )
                .setColor('#ff6600')
                .setFooter({ text: 'Bajas del Sistema de Tránsito' })
                .setTimestamp();

            return await interaction.reply({ embeds: [embedRemover] });
        }
    }
};
