import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { lanzarOportunidadEconomica } from '../../utils/gestorOportunidades.js';

export default {
    data: new SlashCommandBuilder()
        .setName('testoportunidad')
        .setDescription('Fuerza el envío de una Oportunidad Económica para probar el sistema.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Solo Administradores

    async execute(interaction) {
        // ID de tu canal general
        const CANAL_GENERAL_ID = '1451939726230683753';

        try {
            // Lanzar la oportunidad en el canal general usando el cliente del bot
            await lanzarOportunidadEconomica(interaction.client, CANAL_GENERAL_ID);

            // Responder solo a quien ejecutó el comando
            await interaction.reply({
                content: '✅ **¡Oportunidad Económica enviada con éxito al chat general!**',
                ephemeral: true
            });
        } catch (error) {
            console.error('Error al probar la Oportunidad Económica:', error);
            await interaction.reply({
                content: '❌ Ocurrió un error al intentar enviar la Oportunidad Económica.',
                ephemeral: true
            });
        }
    },
};
