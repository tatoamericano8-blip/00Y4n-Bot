import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

// Inicializamos la memoria global para registrar los inicios activos
global.coleccionStartups = global.coleccionStartups || new Map();

export default {
    data: {
        name: 'startup_swfl', 
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
            { name: 'reacciones', description: 'Cantidad de reacciones necesarias para abrir.', type: ApplicationCommandOptionType.Integer, required: true },
            { name: 'tematica_o_limite', description: 'Ejemplo RP: 80 MPH | Ejemplo Meet: JDM, Exóticos, etc.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'ubicacion_o_peacetime', description: 'Ejemplo RP: Peacetime On/Off | Ejemplo Meet: Spawn, Puerto, etc.', type: ApplicationCommandOptionType.String, required: true },
            { name: 'spots', description: 'Solo para Car Meets (Ejemplo: 2-3 SPOTS + BOTM). Para RP dejar vacío.', type: ApplicationCommandOptionType.String, required: false },
            { name: 'imagen', description: 'Link de la foto/banner para el anuncio (opcional).', type: ApplicationCommandOptionType.String, required: false }
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
        const dato1 = interaction.options.getString('tematica_o_limite');
        const dato2 = interaction.options.getString('ubicacion_o_peacetime');
        const spots = interaction.options.getString('spots') || 'N/A';
        const urlImagen = interaction.options.getString('imagen');

        // Configuración visual basada en image_8c543c.png traducida al español
        if (tipo === 'rp') {
            const embedRP = new EmbedBuilder()
                .setTitle('🦋 SWFL | Inicio de Sesión de Roleplay 🦋')
                .setDescription(`• <@${interaction.user.id}> **¡está organizando una sesión!** Antes de ingresar, asegúrate de tener tu vehículo registrado y haber leído las normativas vigentes.\n\n➔ Por favor, sean pacientes mientras nuestro equipo prepara todo. Hay numerosos factores en juego para garantizarles una experiencia de rol de la más alta calidad.\n\n👇 **¡Para comenzar con los preparativos y abrir el servidor, necesitamos alcanzar ${reacciones}+ reacciones!** Una vez cumplido el requisito, se liberará el FastPass.`)
                .addFields(
                    { name: '› Límite de Velocidad (FRP)', value: `${dato1}`, inline: true },
                    { name: '› Estado de Peacetime', value: `${dato2}`, inline: true }
                )
                .setColor('#ff6600');

            if (urlImagen) embedRP.setImage(urlImagen);

            await interaction.reply({ content: 'Lanzando Startup de Roleplay...', ephemeral: true });
            const msg = await interaction.channel.send({ content: '@everyone', embeds: [embedRP] });
            await msg.react('✅');

            // Guardamos en memoria para el detector automático
            global.coleccionStartups.set(msg.id, { hostId: interaction.user.id, reaccionesRequeridas: reacciones, tipo, imagen: urlImagen, procesado: false });
        }

        if (tipo === 'meet') {
            const embedMeet = new EmbedBuilder()
                .setTitle('🦋 SWFL | Inicio de Car Meet Oficial 🦋')
                .setDescription(`• <@${interaction.user.id}> **¡está organizando un Car Meet!** Prepará tu mejor nave, repasá las reglas de convivencia en caravana y estate listo para exhibir.\n\n➔ Por favor, tengan paciencia mientras acomodamos el mapa. Queremos asegurar una juntada limpia, organizada y con los mejores spots.\n\n👇 **¡Para comenzar con los preparativos y abrir el servidor, necesitamos alcanzar ${reacciones}+ reacciones!** Una vez cumplido el requisito, se liberará el FastPass.`)
                .addFields(
                    { name: '❗ Temática del Meet', value: `${dato1}`, inline: false },
                    { name: '❗ Lugar de Inicio', value: `${dato2}`, inline: true },
                    { name: '❗ Spots / Duración', value: `${spots}`, inline: true }
                )
                .setColor('#ff6600');

            if (urlImagen) embedMeet.setImage(urlImagen);

            await interaction.reply({ content: 'Lanzando Startup de Car Meet...', ephemeral: true });
            const msg = await interaction.channel.send({ content: '@everyone', embeds: [embedMeet] });
            await msg.react('✅');

            // Guardamos en memoria para el detector automático
            global.coleccionStartups.set(msg.id, { hostId: interaction.user.id, reaccionesRequeridas: reacciones, tipo, imagen: urlImagen, procesado: false });
        }
    }
};
