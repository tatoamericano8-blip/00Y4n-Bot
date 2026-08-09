import { puedeUsarSesiones, mensajeBloqueoSesiones } from '../../utils/gestorSesionesRestricciones.js';

export default {
    name: 'verificar_voto_swfl',

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        global.coleccionSesiones = global.coleccionSesiones || new Map();
        const datosSesion = global.coleccionSesiones.get(interaction.message.id);

        if (!datosSesion) {
            return interaction.editReply({
                content: '❌ **Error de sincronización:** El bot se reinició o la sesión expiró de la memoria. Pedile al staff que vuelva a ejecutar el comando de lanzamiento.'
            });
        }

        const { idInicio, linkSesion } = datosSesion;
        const userId = interaction.user.id;

        const checkSesion = await puedeUsarSesiones(interaction.guildId, userId);
        if (!checkSesion.ok) {
            return interaction.editReply({ content: mensajeBloqueoSesiones(checkSesion) });
        }

        try {
            const mensajeInicio = await interaction.channel.messages.fetch(idInicio);
            let usuarioReacciono = false;

            for (const reaction of mensajeInicio.reactions.cache.values()) {
                const users = await reaction.users.fetch();
                if (users.has(userId)) {
                    usuarioReacciono = true;
                    break;
                }
            }

            if (usuarioReacciono) {
                return interaction.editReply({
                    content: `🎉 **¡Voto verificado!** Acá tenés el acceso a la sesión:\n🔗 ${linkSesion}\n\n*Respetá las reglas de la comunidad y evitá compartir el link.*`
                });
            }

            return interaction.editReply({
                content: '❌ **No puedes obtener el link de la sesión.**\nNo se detectó tu reacción en el mensaje de inicio (Startup).'
            });
        } catch (error) {
            console.error(error);
            return interaction.editReply({
                content: '❌ **Error al verificar:** No se pudo encontrar el mensaje de inicio original en este canal.'
            });
        }
    }
};
