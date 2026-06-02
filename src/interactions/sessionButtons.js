export default {
    name: 'verificar_voto_swfl', // Tiene que llamarse exactamente igual al customId del botón

    async execute(interaction) {
        // Frenamos el contador de 3 segundos de Discord de inmediato
        await interaction.deferReply({ ephemeral: true });

        global.coleccionSesiones = global.coleccionSesiones || new Map();
        
        // Buscamos los datos de la sesión usando el ID del mensaje donde se clickeó el botón
        const datosSesion = global.coleccionSesiones.get(interaction.message.id);

        if (!datosSesion) {
            return await interaction.editReply({
                content: `❌ **Error de sincronización:** El bot se reinició o la sesión expiró de la memoria. Pídele al staff que vuelva a ejecutar el comando \`/lanzar_swfl\`.`
            });
        }

        const { idInicio, linkSesion } = datosSesion;
        const userId = interaction.user.id;

        try {
            // Buscamos el anuncio de Startup original para revisar las reacciones
            const mensajeInicio = await interaction.channel.messages.fetch(idInicio);
            const reaccionTilde = mensajeInicio.reactions.cache.get('✅');
            
            let usuarioReacciono = false;

            if (reaccionTilde) {
                const usuariosQueReaccionaron = await reaccionTilde.users.fetch();
                usuarioReacciono = usuariosQueReaccionaron.has(userId);
            }

            if (usuarioReacciono) {
                await interaction.editReply({
                    content: `🎉 **¡Voto verificado!** Acá tenés el acceso a la sesión:\n🔗 ${linkSesion}\n\n*Respetá las reglas de la comunidad y evitá compartir el link.*`
                });
            } else {
                await interaction.editReply({
                    content: `❌ **No puedes obtener el link de la sesión.**\nNo se detectó tu reacción con el tilde (\`✅\`) en el mensaje de inicio correspondiente (Startup).`
                });
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: `❌ **Error al verificar:** No se pudo encontrar el mensaje de inicio original en este canal. Asegúrate de que el Startup no haya sido borrado.`
            });
        }
    }
};
