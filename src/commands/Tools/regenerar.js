import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: {
        name: 'regenerar_swfl',
        description: 'Anuncia que el link de re-invitación ha sido modificado o regenerado.',
        options: [
            {
                name: 'contador',
                description: '¿Cuántas veces se regeneró el link en esta sesión? (Ej: 1, 2, 3...)',
                type: ApplicationCommandOptionType.Integer,
                required: true
            },
            {
                name: 'usuario',
                description: 'Selecciona al Host que regeneró el link (si lo dejas vacío, te pondrá a ti).',
                type: ApplicationCommandOptionType.User,
                required: false
            },
            {
                name: 'imagen',
                description: 'Sube la foto o banner de Link Regenerado (opcional).',
                type: ApplicationCommandOptionType.Attachment,
                required: false
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ 
                content: '❌ **No tienes permisos:** Solo el Staff puede anunciar la regeneración de links.', 
                ephemeral: true 
            });
        }

        const contador = interaction.options.getInteger('contador');
        const usuarioStaff = interaction.options.getUser('usuario') || interaction.user;
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        await interaction.reply({ content: '🔄 Modificando el botón anterior y enviando nuevo aviso...', ephemeral: true });

        // 🔒 SISTEMA ANTI-LEAKS: Buscamos el anuncio viejo y destruimos su botón
        try {
            const mensajesRecientes = await interaction.channel.messages.fetch({ limit: 100 });
            
            const ultimoAnuncioConBotones = mensajesRecientes.find(m => 
                m.author.id === interaction.client.user.id && m.components && m.components.length > 0
            );

            if (ultimoAnuncioConBotones) {
                const botonBloqueado = new ButtonBuilder()
                    .setCustomId(`link_rp_bloqueado_${Date.now()}`)
                    .setLabel('Link Regenerado')
                    .setEmoji('1534938648665915577')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const filaBloqueada = new ActionRowBuilder().addComponents(botonBloqueado);

                await ultimoAnuncioConBotones.edit({ components: [filaBloqueada] });
            }
        } catch (error) {
            console.error('Error al intentar bloquear el botón viejo:', error);
        }

        // --- ENVIAR NUEVO ANUNCIO DE REGENERACIÓN ---
        const textoDescripcion = `<:dot:1534938142665084938> <@${usuarioStaff.id}> ha **regenerado el link de re-invitaciones (x${contador})**! Por favor, sean pacientes, ya que las próximas re-invitaciones se realizarán dentro de los próximos 10-15 minutos. Molestar al host para pedir el acceso resultará en un aislamiento (timeout).`;
        
        // Imagen por defecto si no se proporciona una
        const urlImagenPredeterminada = 'https://cdn.discordapp.com/attachments/1529288674091466805/1535400100820549712/Link_regenerado_1.png?ex=6a77a046&is=6a764ec6&hm=73482d2bc8ecda593cabe847da747109277083c98e90319de60da0a65bf95093';

        const embedRegen = new EmbedBuilder()
            .setTitle('<a:si:1534954231138746488> SWFL Roleplay | Link Regenerado <a:si:1534954231138746488>')
            .setDescription(textoDescripcion)
            .setColor('#74d4fc')
            .setImage(fotoAdjunta ? fotoAdjunta.url : urlImagenPredeterminada);

        await interaction.channel.send({ embeds: [embedRegen] });
    }
};
