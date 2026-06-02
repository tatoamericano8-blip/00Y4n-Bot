export async function execute(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('link_session_')) {
        // Postergamos la respuesta para que a Discord no se le venza el tiempo (3 segundos) mientras busca las reacciones
        await interaction.deferReply({ ephemeral: true });

        const datosLimpios = interaction.customId.replace('link_session_', '');
        const [idStartupAsociado, linkReal] = datosLimpios.split('*');
        
        const userId = interaction.user.id;

        try {
            // Buscamos el mensaje de inicio original directamente en el canal actual
            const mensajeInicio = await interaction.channel.messages.fetch(idStartupAsociado);
            
            // Buscamos la reacción del tilde (✅) en ese mensaje
            const reaccionTilde = mensajeInicio.reactions.cache.get('✅');
            
            let usuarioReacciono = false;

            if (reaccionTilde) {
                // Traemos la lista de usuarios que pusieron ✅
                const usuariosQueReaccionaron = await reaccionTilde.users.fetch();
                usuarioReacciono = usuariosQueReaccionaron.has(userId);
            }

            // CONTROL DEFINITIVO EN VIVO
            if (usuarioReacciono) {
                await interaction.editReply({
                    content: `🎉 **¡Voto verificado!** Acá tenés el acceso a la sesión de **00Y4n**:\n🔗 ${linkReal}\n\n*Respetá las reglas de la comunidad y evitá compartir el link.*`
                });
            } else {
                await interaction.editReply({
                    content: `❌ **No puedes obtener el link de la sesión.**\nNo se detectó tu reacción con el tilde (\`✅\`) en el mensaje de inicio correspondiente a esta tanda de juego.`
                });
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: `❌ **Error al verificar:** No se pudo encontrar el mensaje de inicio en este canal. Asegúrate de estar ejecutando el comando \`/sesiones_00y4n lanzar\` en el mismo canal donde se creó el Startup.`
            });
        }
    }
}
