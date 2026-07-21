import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { multasDB, generarIDMulta, programarWarrant } from '../../utils/gestorMultas.js';

export default {
    data: new SlashCommandBuilder()
        .setName('multar')
        .setDescription('Emite una multa oficial de tránsito (Exclusivo Policía de Sarasota).')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario que cometió la infracción.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Selecciona la infracción de tránsito exacta.')
                .setRequired(true)
                .addChoices(
                    // --- CLASES DE EXCESO DE VELOCIDAD ---
                    { name: '🏎️ Exceso de Velocidad Clase A (1 - 15 MPH sobre el límite)', value: 'Exceso de Velocidad Clase A (1-15 MPH sobre límite)' },
                    { name: '🏎️ Exceso de Velocidad Clase B (16 - 29 MPH sobre el límite)', value: 'Exceso de Velocidad Clase B (16-29 MPH sobre límite)' },
                    { name: '🏎️ Exceso de Velocidad Clase C (30+ MPH sobre el límite)', value: 'Exceso de Velocidad Clase C (30+ MPH sobre límite)' },
                    
                    // --- OTRAS INFRACCIONES DE TRÁNSITO ---
                    { name: '🚦 § 346.37 - Cruzar Semáforo en Rojo', value: '§ 346.37 - Cruzar Semáforo en Rojo' },
                    { name: '🛑 Ignorar Señal de PARE (Stop Sign)', value: 'Ignorar Señal de Stop' },
                    { name: '⚠️ Conducción Imprudente / Temeraria (Reckless Driving)', value: 'Conducción Imprudente' },
                    { name: '📄 § 341.04 - Vehículo No Registrado / Sin Patente', value: '§ 341.04 - Vehículo No Registrado' },
                    { name: '🪪 Conducir Sin Licencia de Manejar', value: 'Conducir Sin Licencia' },
                    { name: '🚨 Huir de la Escena de un Accidente (Hit & Run)', value: 'Huir de la Escena (Hit & Run)' }
                ))
        .addIntegerOption(option =>
            option.setName('monto')
                .setDescription('Monto en dólares ($) de la multa.')
                .setRequired(true)),

    async execute(interaction) {
        // ID del rol del Departamento Policial del Condado de Sarasota
        const ROL_POLICIA_ID = '1529146302783422706';

        // Validar que solo los oficiales de Sarasota puedan usar el comando
        if (!interaction.member.roles.cache.has(ROL_POLICIA_ID)) {
            return await interaction.reply({
                content: '❌ **Acceso denegado.** Solo los oficiales del **Departamento Policial del Condado de Sarasota** pueden emitir multas.',
                ephemeral: true
            });
        }

        const infractor = interaction.options.getUser('usuario');
        const razon = interaction.options.getString('razon');
        const monto = interaction.options.getInteger('monto');
        const ticketID = generarIDMulta();

        // Registrar la multa en el sistema
        multasDB.set(ticketID, {
            id: ticketID,
            usuarioId: infractor.id,
            oficialId: interaction.user.id,
            razon: razon,
            monto: monto,
            estado: 'PENDIENTE',
            fecha: new Date()
        });

        // Activar el temporizador de 7 días para la Orden de Arresto
        programarWarrant(interaction.client, interaction.guildId, infractor.id, ticketID);

        // Diseñar Embed con el estilo oficial 00Y4n (#74d4fc)
        const embedMulta = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<:folder:1523041295868756008> Ticket de Multa Emitido')
            .setDescription(
                `• **User -** <@${infractor.id}>\n` +
                `• **Issuer -** <@${interaction.user.id}>\n` +
                `• **Reason -** ${razon}\n` +
                `• **Amount -** $${monto.toLocaleString()}\n` +
                `• **ID -** ${ticketID}\n\n` +
                `*Usa \`/pagar-multa\` para abonar este ticket dentro de una semana, o recibirás una orden de arresto!*`
            )
            .setFooter({ 
                text: '00Y4n Comunidad SWFL • Departamento Policial de Sarasota', 
                iconURL: interaction.guild.iconURL() 
            })
            .setTimestamp();

        // Enviar la multa sin hacer menciones masivas
        await interaction.reply({
            embeds: [embedMulta],
            allowedMentions: { parse: [] }
        });
    },
};
