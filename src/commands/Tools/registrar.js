import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import fs from 'fs';

// 📂 Inicialización de la base de datos persistente (JSON)
const ARCHIVO_DB = './vehiculos_db.json';

// Función para leer los datos guardados
function leerBaseDatos() {
    if (!fs.existsSync(ARCHIVO_DB)) {
        fs.writeFileSync(ARCHIVO_DB, JSON.stringify({}));
    }
    const data = JSON.parse(fs.readFileSync(ARCHIVO_DB, 'utf-8'));
    return new Map(Object.entries(data));
}

// Función para guardar los datos en el archivo
function guardarBaseDatos(mapa) {
    const obj = Object.fromEntries(mapa);
    fs.writeFileSync(ARCHIVO_DB, JSON.stringify(obj, null, 4));
}

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
        
        // Cargamos la base de datos física
        const baseDatosVehiculos = leerBaseDatos();
        let misAutos = baseDatosVehiculos.get(usuarioId) || [];

        // 🏎️ LÓGICA DE REGISTRO
        if (subcomando === 'registrar') {
            const marca = interaction.options.getString('marca');
            const modelo = interaction.options.getString('modelo');
            const año = interaction.options.getString('año');
            const color = interaction.options.getString('color');
            const patente = interaction.options.getString('patente').toUpperCase();

            // 🚨 CONTROL DE LÍMITE DE VEHÍCULOS (Máximo 4 unidades)
            const LIMITE_MAXIMO = 4; 
            if (misAutos.length >= LIMITE_MAXIMO) {
                return await interaction.reply({
                    content: `<:cruz:1523041302764191844> **Límite alcanzado:** Ya tienes el máximo de **${LIMITE_MAXIMO}** vehículos registrados en tu perfil.\n\n*Si quieres registrar una nueva unidad, primero debes dar de baja alguna de tus patentes actuales usando \`/matricula_swfl remover\`.*`,
                    ephemeral: true
                });
            }

            // Evitar que registre dos veces la misma patente
            if (misAutos.some(auto => auto.patente === patente)) {
                return await interaction.reply({
                    content: `<:cruz:1523041302764191844> Ya tienes un vehículo registrado con la matrícula \`${patente}\`.`,
                    ephemeral: true
                });
            }

            // Guardar el vehículo en la lista y reescribir el JSON
            misAutos.push({ marca, modelo, año, color, patente });
            baseDatosVehiculos.set(usuarioId, misAutos);
            guardarBaseDatos(baseDatosVehiculos); // Se guarda físicamente

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
        }

        // 🗑️ LÓGICA DE REMOCIÓN
        if (subcomando === 'remover') {
            const patente = interaction.options.getString('patente').toUpperCase();

            const existe = misAutos.some(auto => auto.patente === patente);
            if (!existe) {
                return await interaction.reply({
                    content: `<:cruz:1523041302764191844> No posees ningún vehículo registrado bajo la matrícula \`${patente}\`.`,
                    ephemeral: true
                });
            }

            // Filtrar y quitar el auto seleccionado, luego guardar en el JSON
            misAutos = misAutos.filter(auto => auto.patente !== patente);
            baseDatosVehiculos.set(usuarioId, misAutos);
            guardarBaseDatos(baseDatosVehiculos);

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
        }
    }
};
