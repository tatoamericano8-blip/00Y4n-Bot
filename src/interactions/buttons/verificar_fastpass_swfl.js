export default {
    name: 'verificar_fastpass_swfl', // Vinculado al customId del botón

    async execute(interaction) {
        // Frenamos los 3 segundos de Discord de inmediato
        await interaction.deferReply({ ephemeral: true });

        global.coleccionFastPass = global.coleccionFastPass || new Map();
        
        // Buscamos el link de Roblox asociado a este mensaje de anuncio
        const linkReal = global.coleccionFastPass.get(interaction.message.id);

        if (!linkReal) {
            return await interaction.editReply({
                content: `❌ **Error de sincronización:** El bot se reinició o esta sesión expiró. Pídele al Staff que vuelva a lanzar el comando.`
            });
        }

        // 🆔 COPIÁ ACÁ EXACTAMENTE LAS MISMAS 2 IDs DE ROLES QUE PUSISTE EN EL ANTERIOR
        const ROLES_VIP_IDS = [
            '1512120103771050005', // ID del Rol: Equipo de Staff
            '1503769793474597027'  // ID del Rol: FastPass
        ];

        // Verificamos si el usuario que apretó el botón tiene alguno de esos 2 roles
        const tieneRolVip = interaction.member.roles.cache.some(role => ROLES_VIP_IDS.includes(role.id));

        if (tieneRolVip) {
            // Si cumple, le entregamos el link de Roblox de forma 100% privada
            await interaction.editReply({
                content: `🎉 **¡FastPass Verificado!** Acá tenés tu enlace de entrada anticipada:\n🔗 ${linkReal}\n\n*Recordá que filtrar este link es motivo de ban permanente.*`
            });
        } else {
            // Si no tiene ninguno de los 2 roles, lo rechazamos
            await interaction.editReply({
                content: `❌ **No tienes acceso:** Este botón es exclusivo para miembros con el rango FastPass y el Staff Team.`
            });
        }
    }
};
