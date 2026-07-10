import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: {
        name: 'regenerar_meet_swfl',
        description: 'Anuncia que el link del Car Meet ha sido modificado o regenerado.',
        options: [
            {
                name: 'contador',
                description: '¿Cuántas veces se regeneró el link en este meet? (Ej: 1, 2, 3...)',
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
                description: 'Sube la foto o banner de Link Regenerado para el Meet (opcional).',
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

        // Aviso temporal mientras el bot trabaja en segundo plano
        await interaction.reply({ content: '🔄 Modificando el botón anterior y enviando nuevo aviso...', ephemeral: true });

        // 🔒 SISTEMA ANTI-LEAKS: Buscamos el anuncio viejo y destruimos su botón
        try {
            // Aumentamos a 100 mensajes para asegurarnos de encontrarlo sin importar el spam
            const mensajesRecientes = await interaction.channel.messages.fetch({ limit: 100 });
            
            // Buscamos el último mensaje del bot que tenga cualquier tipo de componente (botón)
            const ultimoAnuncioConBotones = mensajesRecientes.find(m => 
                m.author.id === interaction.client.user.id && m.components && m.components.length > 0
            );

            if (ultimoAnuncioConBotones) {
                // Creamos el nuevo botón gris deshabilitado con su ID único
                const botonBloqueado = new ButtonBuilder()
                    .setCustomId(`link_meet_bloqueado_${Date.now()}`)
                    .setLabel('🔒 Link Regenerated')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const filaBloqueada = new ActionRowBuilder().addComponents(botonBloqueado);

                // Forzamos la actualización de los componentes en Discord
                await ultimoAnuncioConBotones.edit({ components: [filaBloqueada] });
            }
        } catch (error) {
            console.error('Error al intentar bloquear el botón viejo:', error);
        }

        // --- ENVIAR NUEVO ANUNCIO DE REGENERACIÓN ---
        const textoDescripcion = `<a:mov:1520905604720496843> <@${usuarioStaff.id}> ha **regenerado el link del Car Meet (x${contador})**! Por favor, sean pacientes mientras se acomodan los cupos en el servidor. Molestar al host para pedir el acceso resultará en un aislamiento (timeout).`;

        const embedRegenMeet = new EmbedBuilder()
            .setTitle('<a:espe:1520905696697389227> SWFL Car Meet | Link Regenerado <a:espe:1520905696697389227>')
            .setDescription(textoDescripcion)
            .setColor('#ff6600');

        if (fotoAdjunta) embedRegenMeet.setImage(fotoAdjunta.url);

        await interaction.channel.send({ embeds: [embedRegenMeet] });
    }
};
