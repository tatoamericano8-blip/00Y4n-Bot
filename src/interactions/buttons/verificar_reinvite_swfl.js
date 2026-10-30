import { EmbedBuilder } from 'discord.js';
import { E } from '../../config/emojis.js';
import { crearEmbedEnlaceSesion } from '../../utils/embedEnlaceSesion.js';

export default {
    name: 'verificar_reinvite_swfl', // Mismo customId que el botón

    async execute(interaction) {
        // Frenamos los 3 segundos de Discord al instante
        await interaction.deferReply({ ephemeral: true });

        global.coleccionReinvites = global.coleccionReinvites || new Map();
        
        // Buscamos el link de Roblox guardado en este mensaje
        const linkReal = global.coleccionReinvites.get(interaction.message.id);

        // ❌ CASO DE ERROR: Si el bot se reinició o expiró
        if (!linkReal) {
            const embedError = new EmbedBuilder()
                .setTitle(`${E.cruz || '❌'} Error de Sincronización`)
                .setDescription('Las re-invitaciones para esta tanda han expirado o el bot se reinició.\n\n*Por favor, espera a que el Staff mande un nuevo aviso en este canal.*')
                .setColor('#ff4a4a'); // Rojo para alertas de error

            return await interaction.editReply({ embeds: [embedError] });
        }

        const embedExito = crearEmbedEnlaceSesion({ link: linkReal, tipo: 'reinvite' });
        await interaction.editReply({ embeds: [embedExito] });
    }
};
