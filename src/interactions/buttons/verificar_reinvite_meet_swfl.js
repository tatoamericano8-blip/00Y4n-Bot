import { EmbedBuilder } from 'discord.js';
import { E } from '../../config/emojis.js';
import { crearEmbedEnlaceSesion } from '../../utils/embedEnlaceSesion.js';

export default {
    name: 'verificar_reinvite_meet_swfl', // Mismo customId que el botón del Meet

    async execute(interaction) {
        // Frenamos los 3 segundos de Discord de una
        await interaction.deferReply({ ephemeral: true });

        global.coleccionReinvitesMeet = global.coleccionReinvitesMeet || new Map();
        
        // Buscamos el link de Roblox guardado en este mensaje de Car Meet
        const linkReal = global.coleccionReinvitesMeet.get(interaction.message.id);

        // ❌ CASO DE ERROR: Si las re-invitaciones expiraron o el bot se reinició
        if (!linkReal) {
            const embedError = new EmbedBuilder()
                .setTitle(`${E.cruz || '❌'} Error de Sincronización`)
                .setDescription('Las re-invitaciones para esta tanda de Car Meet han expirado o el bot se reinició.\n\n*Espera a que el Staff mande un nuevo aviso.*')
                .setColor('#ff4a4a'); // Rojo para alertas de error

            return await interaction.editReply({ embeds: [embedError] });
        }

        const embedExito = crearEmbedEnlaceSesion({ link: linkReal, tipo: 'reinvite_meet' });
        await interaction.editReply({ embeds: [embedExito] });
    }
};
