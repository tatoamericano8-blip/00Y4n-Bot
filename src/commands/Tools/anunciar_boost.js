import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

// --- DICCIONARIO COMPLETO DE EMOJIS (00Y4n) ---
const EMOJIS = {
    flechaH: '<:FlechaHoriz00Y4n:1519474590370500608>',
    flechaV: '<:Flecha_00Y4n:1519473149845045400>',
    coraaMov: '<a:coraamov00y4n:1519475012283666554>',
    star: '<:star00y4n:1519474745320669194>'
};

export default {
    data: {
        name: 'anunciar_boost',
        description: 'Lanza un anuncio agradeciendo a un usuario por mejorar (boostear) el servidor.',
        options: [
            {
                name: 'usuario',
                description: 'El usuario que mejoró el servidor.',
                type: ApplicationCommandOptionType.User,
                required: true
            },
            {
                name: 'cantidad',
                description: 'Cantidad de mejoras que aportó (Ej: 1 o 2). Por defecto es 1.',
                type: ApplicationCommandOptionType.Integer,
                required: false
            }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Solo el Staff (quienes pueden gestionar el servidor) puede usar esto
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return await interaction.reply({ 
                content: '❌ **No tienes permisos:** Solo los administradores o Staff pueden usar este comando.', 
                ephemeral: true 
            });
        }

        const usuarioMencionado = interaction.options.getUser('usuario');
        const cantidadBoosts = interaction.options.getInteger('cantidad') || 1; // Si no pone nada, asume que es 1

        // Armamos el Embed traducido y con la estética 00Y4n
        const embedBoost = new EmbedBuilder()
            .setTitle(`<a:soad:1523026183028084768> 00Y4n SWFL | Notificación de Mejora <a:soad:1523026183028084768>`)
            .setDescription(`¡Gracias, <@${usuarioMencionado.id}>! <a:cora:1523026545340449002>\n\n<a:si:1523027371735777503> ¡Has mejorado el servidor **${cantidadBoosts} ${cantidadBoosts === 1 ? 'vez' : 'veces'}**! Lo apreciamos muchísimo. Tu mejora ha sido registrada dentro de 00Y4n SWFL, ¡y se han aplicado automáticamente tus beneficios de Booster según el total de mejoras!\n\n$<:afa:1523028004983406787> *¿Tienes algún problema o te falta algún beneficio? ¡No dudes en abrir un ticket de asistencia si necesitas soporte adicional!*`)
            .setColor('#74d4fc')
            // Ponemos la foto de perfil del usuario que boosteó como cuadrito (thumbnail)
            .setThumbnail(usuarioMencionado.displayAvatarURL({ dynamic: true, size: 512 }))
            .setFooter({ text: '00Y4n SWFL™', iconURL: interaction.guild.iconURL() });

        // Respondemos al Staff diciendo que el mensaje se envió
        await interaction.reply({ content: '✅ Anuncio de Boost enviado correctamente.', ephemeral: true });

        // Enviamos el mensaje al canal donde el Staff ejecutó el comando, mencionando al usuario
        await interaction.channel.send({ 
            content: `> __**¡Miren quién acaba de mejorar el servidor! <@${usuarioMencionado.id}> 🎉**__`, 
            embeds: [embedBoost] 
        });
    }
};
