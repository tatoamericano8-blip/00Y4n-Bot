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
                    .setLabel('Link Regenerado')
                    .setEmoji('1534938648665915577')
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
        const textoDescripcion = `<:dot:1534938142665084938> <@${usuarioStaff.id}> ha **regenerado el link del Car Meet (x${contador})**! Por favor, sean pacientes ya que las próximas reinvitaciones serán dentro de 10-15 minutos. Molestar al host para pedir el acceso resultará en un aislamiento (timeout).`;
        
        // Imagen por defecto si no se proporciona una
        const urlImagenPredeterminada = 'https://cdn.discordapp.com/attachments/1452644461745148049/1535401345916473394/Link_regenerado_1.png?ex=6a77a16f&is=6a764fef&hm=d42d4aff4f2e5e2f8e5b8ef9c7162a6b8b6338937975cbe06cada5e1d411ff05';

        const embedRegenMeet = new EmbedBuilder()
            .setTitle('<a:espe:1534954231138746488> SWFL Car Meet | *Link Regenerado* <a:espe:1534954231138746488>')
            .setDescription(textoDescripcion)
            .setColor('#74d4fc')
            .setImage(fotoAdjunta ? fotoAdjunta.url : urlImagenPredeterminada);

        await interaction.channel.send({ embeds: [embedRegenMeet] });
    }
};
