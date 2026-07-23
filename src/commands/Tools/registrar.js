import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import Vehiculo from '../../models/Vehiculo.js'; // Ajusta la ruta a tu modelo de Vehiculo

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

            // 🚨 Control de longitud de patente
            if (patente.length > 8) {
                return await interaction.reply({
                    content: `<:cruz:1523041302764191844> La matrícula es demasiado larga. El máximo permitido es de 8 caracteres.`,
                    ephemeral: true
                });
            }

            try {
                // 1. Verificamos cuántos autos tiene este usuario en MongoDB
                const cantidadAutos = await Vehiculo.countDocuments({ usuario_id: usuarioId });

                // 🚨 Control de límite (Máximo 4)
                const LIMITE_MAXIMO = 4; 
                if (cantidadAutos >= LIMITE_MAXIMO) {
                    return await interaction.reply({
                        content: `<:cruz:1523041302764191844> **Límite alcanzado:** Ya tienes el máximo de **${LIMITE_MAXIMO}** vehículos registrados en tu perfil.\n\n*Si quieres registrar una nueva unidad, primero debes dar de baja alguna de tus patentes actuales usando \`/matricula_swfl remover\`.*`,
                        ephemeral: true
                    });
                }

                // 2. Verificamos que OTRA persona no tenga esa patente (patente única global)
                const patenteExistente = await Vehiculo.findOne({ patente: patente });
                if (patenteExistente) {
                    return await interaction.reply({
                        content: `<:cruz:1523041302764191844> La matrícula \`${patente}\` ya se encuentra registrada en el sistema del estado por otro ciudadano.`,
                        ephemeral: true
                    });
                }

                // 3. Guardamos el vehículo en MongoDB Atlas
                await Vehiculo.create({
                    usuario_id: usuarioId,
                    marca: marca,
                    modelo: modelo,
                    ano: año,
                    color: color,
                    patente: patente
                });

                const embedRegistro = new EmbedBuilder()
                    .setTitle('<:seguro:1523041347869868253> SWFL | FORMATO DE MATRICULACIÓN DE VEHÍCULOS <:seguro:1523041347869868253>')
                    .setDescription(
                        `> <:punto:1523041306836996156> El siguiente vehículo ha sido cargado exitosamente en el sistema de patentes de la comunidad y se encuentra apto para circular.\n\n` +
                        `<:si:1523041359441952970> **Marca:** \`${marca}\`\n` +
                        `<:si:1523041359441952970> **Modelo:** \`${modelo}\`\n` +
                        `<:si:1523041359441952970> **Año:** \`${año}\`\n` +
                        `<:si:1523041359441952970> **Color:** \`${color}\`\n` +
                        `<:si:1523041359441952970> **Matrícula:** \`${patente}\`\n` +
                        `<:si:1523041359441952970> **Propietario:** <@${usuarioId}>`
                    )
                    .setColor('#74d4fc')
                    .setFooter({ text: 'Sistema de Tránsito Oficial' })
                    .setTimestamp();

                return await interaction.reply({ embeds: [embedRegistro] });

            } catch (error) {
                console.error('Error guardando en MongoDB:', error);
                return await interaction.reply({ content: 'Hubo un error interno al registrar el vehículo.', ephemeral: true });
            }
        }

        // 🗑️ LÓGICA DE REMOCIÓN
        if (subcomando === 'remover') {
            const patente = interaction.options.getString('patente').toUpperCase();

            try {
                // Buscamos y eliminamos el vehículo del usuario
                const autoBorrado = await Vehiculo.findOneAndDelete({ usuario_id: usuarioId, patente: patente });

                // Si no se encontró el vehículo para ese usuario
                if (!autoBorrado) {
                    return await interaction.reply({
                        content: `<:cruz:1523041302764191844> No posees ningún vehículo registrado bajo la matrícula \`${patente}\`.`,
                        ephemeral: true
                    });
                }

                const embedRemover = new EmbedBuilder()
                    .setTitle('<:no:1523041304911544502> SWFL | ANULACIÓN DE MATRICULA <:no:1523041304911544502>')
                    .setDescription(
                        `> Se ha revocado el permiso de circulación para el vehículo registrado con la siguiente placa:\n\n` +
                        `<:si:1523041359441952970> **Matrícula Removida:** \`${patente}\`\n` +
                        `<:si:1523041359441952970> **Solicitante:** <@${usuarioId}>\n\n` +
                        `*Nota: Si vendiste el auto o cambiaste de patente, recuerda volver a usar el subcomando /matricula_swfl registrar.*`
                    )
                    .setColor('#74d4fc')
                    .setFooter({ text: 'Bajas del Sistema de Tránsito' })
                    .setTimestamp();

                return await interaction.reply({ embeds: [embedRemover] });

            } catch (error) {
                console.error('Error borrando en MongoDB:', error);
                return await interaction.reply({ content: 'Hubo un error interno al remover el vehículo.', ephemeral: true });
            }
        }
    }
};
