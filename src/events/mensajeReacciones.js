import { EmbedBuilder } from 'discord.js';

// --- DICCIONARIO COMPLETO DE EMOJIS CUSTOM (00Y4n) ---
const EMOJIS = {
    // Estáticos
    link: '<:link00y4n:1519476984932073482>',
    cruz: '<:cruz00y4n:1519476959606734998>',
    warn: '<:warn00y4n:1519476933988061295>',
    cirPunto: '<:00y4ncirpunto:1519474782117171392>',
    flechaH: '<:FlechaHoriz00Y4n:1519474590370500608>',
    flechaV: '<:Flecha_00Y4n:1519473149845045400>',
    star: '<:star00y4n:1519474745320669194>',
    tilde: {
        id: '1534937809733812286',
        tag: '<:tilde:1534937809733812286>'
    },
    // Números estáticos
    n1: '<:100y4n:1519475036283473980>',
    n2: '<:200y4n:1519475057846521888>',
    n3: '<:300y4n:1519475081724825690>',
    n4: '<:400y4n:1519475112087130282>',

    // Animados (Movimiento)
    coraMov: '<a:Cora_Mov_00Y4n:1519473208334749716>',
    floresMov: '<a:Floresmov00Y4n:1519474632917385296>',
    caramMov: '<a:caram00y4nmov:1519474823309426699>',
    circMov: '<a:circmovim00y4n:1519476873959178380>',
    coraaMov: '<a:coraamov00y4n:1519475012283666554>'
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

                const embedSetup = new EmbedBuilder()
                    .setTitle(`<a:mariquieta:1534954231138746488> Southwest Florida Comunidad 00Y4n — __*Configuración del Servidor*__ <a:mariquieta:1534954231138746488>`)
                    .setDescription(
                        `<:dot:1534938142665084938> <@${startup.hostId}> **ha comenzado a configurar su servidor** para la sesión de **${nombreSesion}!** Los miembros con acceso anticipado podrán unirse en breve usando el enlace de early access. ¡Asegurate de boostear el servidor para early access!\n\n` +
                        `<:replican:1542264548801777685> __Por favor sé paciente y dale al host un tiempo razonable para configurar__.`
                    )
                    .setColor('#74d4fc');

                // Si se pasó un banner opcional al iniciar, lo inyectamos acá
                if (startup.imagen) {
                    embedSetup.setImage(startup.imagen);
                }

                // Responde directamente al embed de los votos conectando los mensajes de manera limpia
                await reaction.message.reply({
                    embeds: [embedSetup]
                });
            }
        }
    }
};
