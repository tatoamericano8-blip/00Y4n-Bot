import { EmbedBuilder, ActivityType } from 'discord.js';

export default {
    name: 'presenceUpdate',
    once: false,
    async execute(oldPresence, newPresence) {
        // Ignorar si el cambio de estado viene de un bot
        if (newPresence.user?.bot) return;

        // ⚙️ CONFIGURACIÓN
        const ROL_CONTRIBUIDOR_ID = '1525517592348065904';
        const CANAL_COMANDOS_ID = '1505615426305130657';
        const TEXTO_REQUERIDO = '/00Y4n';

        // Obtener al miembro del servidor
        const member = newPresence.member;
        if (!member) return;

        // Revisar si el usuario tiene el texto en su estado personalizado (Custom Status es el type 4)
        const actividades = newPresence.activities || [];
        const tieneEstadoRequerido = actividades.some(act => 
            act.type === 4 && act.state && act.state.includes(TEXTO_REQUERIDO)
        );

        // Verificar si ya tiene el rol
        const tieneRol = member.roles.cache.has(ROL_CONTRIBUIDOR_ID);

        // ✅ LÓGICA: Dar el rol y enviar el mensaje si se puso el estado
        if (tieneEstadoRequerido && !tieneRol) {
            try {
                // Añadir el rol
                await member.roles.add(ROL_CONTRIBUIDOR_ID);

                // Obtener el canal y enviar el embed
                const guild = newPresence.guild;
                const canal = guild.channels.cache.get(CANAL_COMANDOS_ID);

                if (canal) {
                    const embedContribuidor = new EmbedBuilder()
                        .setTitle('<a:colaborador:1523026579662307378> ¡Colaborador del Servidor! <a:colaborador:1523026579662307378>')
                        .setDescription(`<:puntito:1523027978123087922> ¡<@${member.id}>, gracias por apoyar a **${guild.name}** usando **${TEXTO_REQUERIDO}** en tu estado! Se te ha otorgado el rol <@&${ROL_CONTRIBUIDOR_ID}> para mostrar nuestro aprecio por tu dedicación y apoyo a nuestra comunidad.`)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                        .setColor('#74d4fc')
                        .setFooter({ text: `${guild.name} 💎`, iconURL: guild.iconURL({ dynamic: true }) })
                        .setTimestamp();

                    await canal.send({ embeds: [embedContribuidor] });
                }
            } catch (error) {
                console.error('Error al dar el rol de contribuidor:', error);
            }
        } 
        // ❌ LÓGICA: Quitar el rol silenciosamente si se quitan el texto del estado
        else if (!tieneEstadoRequerido && tieneRol) {
            try {
                await member.roles.remove(ROL_CONTRIBUIDOR_ID);
            } catch (error) {
                console.error('Error al quitar el rol de contribuidor:', error);
            }
        }
    }
};
