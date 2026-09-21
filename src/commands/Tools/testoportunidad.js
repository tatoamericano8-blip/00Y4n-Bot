import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { lanzarOportunidadEconomica } from '../../utils/gestorOportunidades.js';

export default {
    data: new SlashCommandBuilder()
        .setName('testoportunidad')
        .setDescription('Fuerza el envío de una Oportunidad Económica para probar el sistema.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const CANAL_GENERAL_ID = '1451939726230683753';

        // Responder a Discord YA (evita "La aplicación no ha respondido" a los 3s)
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            await lanzarOportunidadEconomica(interaction.client, CANAL_GENERAL_ID);
            await interaction.editReply({
                content: '✅ **¡Oportunidad Económica enviada con éxito al chat general!**'
            });
        } catch (error) {
            console.error('Error al probar la Oportunidad Económica:', error);
            try {
                await interaction.editReply({
                    content: '❌ Ocurrió un error al intentar enviar la Oportunidad Económica.'
                });
            } catch (_) {}
        }
    },
};
