export async function execute(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('link_session_')) {
        // Extraemos los datos que guardamos en el botón
        const datosLimpios = interaction.customId.replace('link_session_', '');
        const [idStartupAsociado, linkReal] = datosLimpios.split('*');
        
        const userId = interaction.user.id;
        const conjuntoVotos = global.mapaVotos ? global.mapaVotos.get(idStartupAsociado) : null;

        // VERIFICACIÓN ESTRICTA DE VOTO
        if (conjuntoVotos && conjuntoVotos.has(userId)) {
            await interaction.reply({
                content: `🎉 **¡Voto verificado!** Acá tenés el acceso a la sesión de **00Y4n**:\n🔗 ${linkReal}\n\n*Respetá las reglas de la comunidad y evitá compartir el link.*`,
                ephemeral: true
            });
        } else {
            // Mensaje de rechazo si no pusieron su reacción
            await interaction.reply({
                content: `❌ **No puedes obtener el link de la sesión.**\nNo se detectó tu reacción con el tilde (\`✅\`) en el mensaje de inicio correspondiente a esta tanda de juego.`,
                ephemeral: true
            });
        }
    }
}
