export default {
    name: 'verificar_reinvite_meet_swfl', // Mismo customId que el botón del Meet

    async execute(interaction) {
        // Frenamos los 3 segundos de Discord de una
        await interaction.deferReply({ ephemeral: true });

        global.coleccionReinvitesMeet = global.coleccionReinvitesMeet || new Map();
        
        // Buscamos el link de Roblox guardado en este mensaje de Car Meet
        const linkReal = global.coleccionReinvitesMeet.get(interaction.message.id);

        if (!linkReal) {
            return await interaction.editReply({
                content: `❌ **Error de sincronización:** Las re-invitaciones para esta tanda de Car Meet han expirado o el bot se reinició. Espera a que el Staff mande un nuevo aviso.`
            });
        }

        // Le entregamos el link de Roblox de forma privada en su pantalla
        await interaction.editReply({
            content: `🎉 **¡Re-Invitación al Meet Aceptada!** Acá tenés el acceso para unirte a las naves:\n🔗 ${linkReal}\n\n*Recordá respetar la temática y lucir tu auto sin armar lío.*`
        });
    }
};
