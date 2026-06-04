export default {
    name: 'verificar_reinvite_swfl', // Mismo customId que el botón

    async execute(interaction) {
        // Frenamos los 3 segundos de Discord al instante
        await interaction.deferReply({ ephemeral: true });

        global.coleccionReinvites = global.coleccionReinvites || new Map();
        
        // Buscamos el link de Roblox guardado en este mensaje
        const linkReal = global.coleccionReinvites.get(interaction.message.id);

        if (!linkReal) {
            return await interaction.editReply({
                content: `❌ **Error de sincronización:** Las re-invitaciones para esta tanda han expirado o el bot se reinició. Por favor, espera a que el Staff mande un nuevo aviso.`
            });
        }

        // Le entregamos el link de forma completamente privada en su pantalla
        await interaction.editReply({
            content: `🎉 **¡Re-Invitación aceptada!** Acá tenés el acceso para unirte a la sesión actual:\n🔗 ${linkReal}\n\n*Recordá respetar las reglas del mapa y evitar pasarle el enlace a no miembros.*`
        });
    }
};
