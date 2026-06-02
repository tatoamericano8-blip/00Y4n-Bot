export async function execute(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('verificar_voto_')) {
        await interaction.deferReply({ ephemeral: true });

        const idStartupAsociado = interaction.customId.replace('verificar_voto_', '');
        
        // Conectamos con la memoria global para extraer el enlace de Roblox
        global.coleccionSesiones = global.coleccionSesiones || new Map();
        const linkReal = global.coleccionSesiones.get(idStartupAsociado);

        // Control de seguridad por si el bot se llega a reiniciar en medio de la sesión
        if (!linkReal) {
            return await interaction.editReply({
                content: `❌ **Error de sincronización:** El bot se reinició o la sesión expiró de la memoria. Por favor, pídele al staff que vuelva a ejecutar el comando \`/lanzar_swfl\` para reactivar este botón.`
            });
        }
        
        const userId = interaction.user.id;

        try {
            const mensajeInicio = await interaction.channel.messages.fetch(idStartupAsociado);
            const reaccionTilde = mensajeInicio.reactions.cache.get('✅');
            
            let usuarioReacciono = false;

            if (reaccionTilde) {
                const usuariosQueReaccionaron = await reaccionTilde.users.fetch();
                usuarioReacciono = usuariosQueReaccionaron.has(userId);
            }

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
                content: `❌ **Error al verificar:** No se pudo encontrar el mensaje de inicio original. Asegúrate de estar ejecutando el comando en el mismo canal donde se creó el Startup.`
            });
        }
    }
}
