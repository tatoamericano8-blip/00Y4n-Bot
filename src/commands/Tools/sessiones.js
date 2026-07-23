import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

// Inicializamos la memoria global para registrar los inicios activos
global.coleccionStartups = global.coleccionStartups || new Map();

export default {
    data: {
        name: 'inicio_swfl',
        description: 'Lanza un inicio de sesión de Roleplay o Car Meet para SWFL.',
        options: [
            {
                name: 'tipo',
                description: '¿Qué tipo de sesión vas a iniciar?',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'Roleplay', value: 'rp' },
                    { name: 'Car Meet', value: 'meet' }
                ]
            },
            { 
                name: 'reacciones', 
                description: 'Cantidad de reacciones necesarias para abrir.', 
                type: ApplicationCommandOptionType.Integer, 
                required: true 
            },
            { 
                name: 'imagen', 
                description: 'Link de la foto/banner para el anuncio (opcional).', 
                type: ApplicationCommandOptionType.String, 
                required: false 
            }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Bloqueo de Staff
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ **No tienes permisos:** Solo el Staff autorizado puede iniciar sesiones.',
                ephemeral: true
            });
        }

        const tipo = interaction.options.getString('tipo');
        const reacciones = interaction.options.getInteger('reacciones');
        const urlImagen = interaction.options.getString('imagen');

        // --- MAPEO DE EMOJIS CUSTOM (IDs Reales de tu servidor 00Y4n) ---
        const eCoraMov = '<a:Cora_Mov_00Y4n:1519473208334749716>'; // Animado para títulos
        const ePunto   = '<:00y4ncirpunto:1523041306836996156>';    // Círculo/Punto celeste
        const eFlechaH = '<:FlechaHoriz00Y4n:1519474590370500608>'; // Flecha horizontal naranja
        const eFlechaV = '<:Flecha_00Y4n:1519473149845045400>';     // Flecha curva naranja
        const idTildeNaranja = '<a:coraexplotando:1523026579662307378>'; // ID real de tu tilde naranja para las reacciones

        // Modificación estética basada de forma estricta en el estilo 00Y4n
        if (tipo === 'rp') {
            const embedRP = new EmbedBuilder()
                .setTitle(`<a:mari:1523027011524624457> **Southwest Florida** - *__Roleplay Sesión Inicio__* <a:mari:1523027011524624457>`)
                .setDescription(
                    `> ${ePunto} <@${interaction.user.id}> ¡está organizando una **sesión de roleplay**! Si tienes la intención de **unirte**, reacciona abajo con el emoji elegido por el host. ¡Si reaccionas sin unirte, podrías enfrentar __**consecuencias**__ por parte del equipo de staff!\n\n` +
                    `**Antes de Unirte**\n\n` +
                    `> <:felc:1523041359441952970> Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
                    `> <:felc:1523041359441952970> Lee la [información](https://discord.com/channels/1451939725308067842/1516590524725989437) & la [lista de vehículos baneados](https://discord.com/channels/1451939725308067842/1501739933495201925/1525190667545088225)\n` +
                    `> <:felc:1523041359441952970> Registra tus vehículos en <#1505615426305130657>!\n\n` +
                    `> <:felc:1523028004983406787> El host debe obtener __**${reacciones}+**__ reacciones antes de comenzar.`
                )
                .setColor('#74d4fc');

            if (urlImagen) embedRP.setImage(urlImagen);

            await interaction.reply({ content: 'Lanzando Startup de Roleplay...', ephemeral: true });
            const msg = await interaction.channel.send({ content: '@everyone', embeds: [embedRP] });
            
            await msg.react(idTildeNaranja);

            global.coleccionStartups.set(msg.id, { hostId: interaction.user.id, reaccionesRequeridas: reacciones, tipo, imagen: urlImagen, procesado: false });
        }

        if (tipo === 'meet') {
            const embedMeet = new EmbedBuilder()
                .setTitle(`<a:mari:1523027011524624457> Southwest Florida - __*Car Meet Sesión Inicio*__ <a:mari:1523027011524624457>`)
                .setDescription(
                    `> ${ePunto} <@${interaction.user.id}> ¡está organizando un **car meet oficial**! Si tienes la intención de **unirte**, reacciona abajo con el emoji elegido por el host. ¡Si reaccionas sin unirte, podrías enfrentar __**consecuencias**__ por parte del equipo de staff!\n\n` +
                    `**Antes de Unirte**\n\n` +
                    `> <:felc:1523041359441952970> Asegúrate de estar verificado [aquí](https://discord.com/channels/1451939725308067842/1512614400413139045).\n` +
                    `> <:felc:1523041359441952970> Lee la [información](https://discord.com/channels/1451939725308067842/1516590524725989437) & la [lista de vehículos baneados](https://discord.com/channels/1451939725308067842/1501739933495201925/1525190667545088225)\n` +
                    `> <:felc:1523041359441952970> Recuerda evitar colisiones con vehiculos y mantener el realismo!\n\n` +
                    `> <:felc:1523028004983406787> El host debe obtener __**${reacciones}+**__ reacciones antes de comenzar.`
                )
                .setColor('#74d4fc');

            if (urlImagen) embedMeet.setImage(urlImagen);

            await interaction.reply({ content: 'Lanzando Startup de Car Meet...', ephemeral: true });
            const msg = await interaction.channel.send({ content: '@everyone', embeds: [embedMeet] });
            
            await msg.react(idTildeNaranja);

            global.coleccionStartups.set(msg.id, { hostId: interaction.user.id, reaccionesRequeridas: reacciones, tipo, imagen: urlImagen, procesado: false });
        }
    }
};
