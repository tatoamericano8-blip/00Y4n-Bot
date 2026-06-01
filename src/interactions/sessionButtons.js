const LINK_ROBLOX = "https://www.roblox.com/games/XXXXXX/Southwest-Florida"; // Pega acá tu link real

export async function execute(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('link_session_')) {
        const idStartupAsociado = interaction.customId.replace('link_session_', '');
        const userId = interaction.user.id;

        const conjuntoVotos = global.mapaVotos ? global.mapaVotos.get(idStartupAsociado) : null;

        // VERIFICACIÓN ESTRICTA DE VOTO
        if (conjuntoVotos && conjuntoVotos.has(userId)) {
            await interaction.reply({
                content: `🎉 **¡Voto verificado!** Acá tenés el acceso a la sesión de **00Y4n**:\n🔗 ${LINK_ROBLOX}\n\n*Respetá las reglas y evitá compartir el link.*`,
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: `❌ **No podés obtener el link.**\nNo reaccionaste con el \`✅\` en el mensaje de inicio de esta sesión.`,
                ephemeral: true
            });
        }
    }
}
