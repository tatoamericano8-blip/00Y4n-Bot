import { EmbedBuilder } from 'discord.js';

export default {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        // Ignoramos por completo los pings de los propios bots
        if (user.bot) return;

        // Si el mensaje es viejo y no está en la memoria caché actual de Discord, lo recuperamos
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('No se pudo recuperar la reacción parcial:', error);
                return;
            }
        }

        global.coleccionStartups = global.coleccionStartups || new Map();
        
        // Verificamos si este mensaje de reacción pertenece a un startup activo
        const datosSesion = global.coleccionStartups.get(reaction.message.id);

        // Si no existe en la lista o ya generó su mensaje automático, cerramos el proceso
        if (!datosSesion || datosSesion.procesado) return;

        // Comprobamos que estén reaccionando con el tilde verde configurado
        if (reaction.emoji.name === '✅') {
            const votosActuales = reaction.count;

            // ¡LLEGAMOS A LA META DE VOTOS SELECCIONADOS!
            if (votosActuales >= datosSesion.reaccionesRequeridas) {
                datosSesion.procesado = true; // Candado inmediato para evitar duplicados

                const tituloEmbed = datosSesion.tipo === 'rp' ? '🟠 SWFL | Configuración del Servidor 🟠' : '🟠 SWFL Car Meet | Configuración del Servidor 🟠';

                // Traducción impecable al español con estilo 00Y4n
                const embedSetup = new EmbedBuilder()
                    .setTitle(tituloEmbed)
                    .setDescription(`• <@${datosSesion.hostId}> **¡ha comenzado a configurar su servidor!**\n\nLos miembros con rango de **FastPass** pronto podrán empezar a ingresar utilizando el enlace de acceso anticipado que se enviará de un momento a otro. ¡Asegúrate de contar con tu rango correspondiente para entrar a la pista antes que el resto!\n\n> 📞 *Por favor, sean pacientes y denle al Host un tiempo prudencial y razonable para preparar toda la sesión correctamente.*`)
                    .setColor('#ff6600'); // Tu naranja insignia

                // Si en el startup original usaron un banner, el bot lo hereda acá de forma automática
                if (datosSesion.imagen) embedSetup.setImage(datosSesion.imagen);

                // 🚀 CAMBIO ACÁ: Se envía SOLO el embed al canal, sin pings a @everyone ni a roles
                await reaction.message.channel.send({
                    embeds: [embedSetup]
                });
            }
        }
    }
};
