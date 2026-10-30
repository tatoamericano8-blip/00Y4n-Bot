import { EmbedBuilder } from 'discord.js';
import { E, EMOJI_DEF } from '../config/emojis.js';

// --- DICCIONARIO COMPLETO DE EMOJIS CUSTOM (00Y4n) ---
const EMOJIS = {
    // Estáticos
    link: E.hyperlink,
    cruz: E.cruz,
    warn: E.warn,
    cirPunto: E.dot,
    flechaH: E.flecha,
    flechaV: E.flecha,
    star: E.primer_puesto,
    tilde: {
        id: EMOJI_DEF.tilde.id,
        tag: E.tilde
    },
    // Números estáticos
    n1: E.uno,
    n2: E.dos,
    n3: E.tres,
    n4: E.cuatro,

    // Animados (Movimiento)
    coraMov: E.acoraflotante,
    floresMov: E.aflores,
    caramMov: E.aalas,
    circMov: E.aconfeti,
    coraaMov: E.acorarotacion
};

export default {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        // Ignoramos reacciones de bots
        if (user.bot) return;

        // Estabilizamos la reacción parcial si viene de mensajes viejos
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error al recuperar datos de la reacción parcial:', error);
                return;
            }
        }

        const msgId = reaction.message.id;

        // Comprobamos si el mensaje está registrado en la base de inicios activos
        const startup = global.coleccionStartups?.get(msgId);
        if (!startup || startup.procesado) return;

        // Comprobamos de forma estricta si coincide con la ID de tu tilde naranja
        if (reaction.emoji.id === EMOJIS.tilde.id) {
            
            // Restamos 1 para descontar la reacción inicial que añade el bot obligatoriamente
            const votosActuales = reaction.count - 1;

            if (votosActuales >= startup.reaccionesRequeridas) {
                // Bloqueo de duplicados inmediato
                startup.procesado = true;

                const nombreSesion = startup.tipo === 'rp' ? 'Roleplay' : 'Car Meet';

                // Embed estructurado al estilo premium 00Y4n con tus nuevos emojis
                const IMAGEN_CONFIG_DEFAULT =
                    'https://media.discordapp.net/attachments/1505017301089652898/1565769727232442499/Copia_de_Configurando_Sesion_1.png?ex=6ae61c31&is=6ae4cab1&hm=0aa96307dec7cc8de65135af83bea723f2b3a333ec556a482af993f0fee2c351&=&format=webp&quality=lossless';
                const embedSetup = new EmbedBuilder()
                    .setTitle(`${E.a2alas} Southwest Florida Comunidad 00Y4n — __*Configuración del Servidor*__ ${E.a2alas}`)
                    .setDescription(
                        `${E.dot} <@${startup.hostId}> **ha comenzado a configurar su servidor** para la sesión de **${nombreSesion}!** Los miembros con acceso anticipado podrán unirse en breve usando el enlace de early access. ¡Asegurate de boostear el servidor para early access!\n\n` +
                        `${E.flechareplica} __Por favor sé paciente y dale al host un tiempo razonable para configurar__.`
                    )
                    .setColor('#74d4fc')
                    .setImage(IMAGEN_CONFIG_DEFAULT);

                    // Responde directamente al embed de los votos conectando los mensajes de manera limpia
                await reaction.message.reply({
                    embeds: [embedSetup]
                });
            }
        }
    }
};
