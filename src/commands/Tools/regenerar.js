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
                    .setLabel('🔒 Link Regenerado')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const filaBloqueada = new ActionRowBuilder().addComponents(botonBloqueado);

                await ultimoAnuncioConBotones.edit({ components: [filaBloqueada] });
            }
        } catch (error) {
            console.error('Error al intentar bloquear el botón viejo:', error);
        }

        // --- ENVIAR NUEVO ANUNCIO DE REGENERACIÓN ---
        const textoDescripcion = `<a:mov:1523027371735777503> <@${usuarioStaff.id}> ha **regenerado el link de re-invitaciones (x${contador})**! Por favor, sean pacientes, ya que las próximas re-invitaciones se realizarán dentro de los próximos 30 minutos. Molestar al host para pedir el acceso resultará en un aislamiento (timeout).`;

        const embedRegen = new EmbedBuilder()
            .setTitle('<a:si:1523026421512142899> SWFL Roleplay | Link Regenerado <a:si:1523026421512142899>')
            .setDescription(textoDescripcion)
            .setColor('#74d4fc');

        if (fotoAdjunta) embedRegen.setImage(fotoAdjunta.url);

        await interaction.channel.send({ embeds: [embedRegen] });
    }
};
