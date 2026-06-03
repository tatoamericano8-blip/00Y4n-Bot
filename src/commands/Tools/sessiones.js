import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

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
        // 🔒 SEGURIDAD: Si no tiene permiso de Gestionar Mensajes, el bot frena el comando
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

        if (tipo === 'rp') {
            const embedRP = new EmbedBuilder()
                .setTitle('__SWFL RP Startup__')
                .setDescription(`> **Anfitrión:** <@${interaction.user.id}>\n\n*Asegúrate de haber leído las normativas en el canal correspondiente y tener tu vehículo registrado antes de ingresar a la sesión.*\n\n**¡Necesitamos ${reacciones} reacciones para iniciar!**`)
                .addFields(
                    { name: '› Límite de Velocidad (FRP)', value: `${dato1}`, inline: true },
                    { name: '› Estado de Peacetime', value: `${dato2}`, inline: true }
                )
                .setColor('#ff6600');

            if (urlImagen) embedRP.setImage(urlImagen);

            await interaction.reply({ content: 'Lanzando Startup de Roleplay...', ephemeral: true });
            const msg = await interaction.channel.send({ content: '@everyone', embeds: [embedRP] });
            await msg.react('✅');
        }

        if (tipo === 'meet') {
            const embedMeet = new EmbedBuilder()
                .setTitle('__SWFL Meet Startup__')
                .setDescription(`> **Anfitrión:** <@${interaction.user.id}>\n\n*¡Atención amantes de los fierros! Se viene una juntada oficial.*\n\n**¡Necesitamos ${reacciones} reacciones para iniciar!**`)
                .addFields(
                    { name: '❗ Temática del Meet', value: `${dato1}`, inline: false },
                    { name: '❗ Lugar de Inicio', value: `${dato2}`, inline: true },
                    { name: '❗ Duración / Spots', value: `${spots}`, inline: true }
                )
                .setColor('#ff6600');

            if (urlImagen) embedMeet.setImage(urlImagen);

            await interaction.reply({ content: 'Lanzando Startup de Car Meet...', ephemeral: true });
            const msg = await interaction.channel.send({ content: '@everyone', embeds: [embedMeet] });
            await msg.react('✅');
        }
    }
};
