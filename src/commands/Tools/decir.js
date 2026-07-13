import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';

export default {
    data: {
        name: 'decir',
        description: 'Haz que el bot envíe un mensaje normal en el canal actual.',
        options: [
            {
                name: 'mensaje',
                description: 'El texto que quieres que el bot diga.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'imagen',
                description: '¿Quieres adjuntar una imagen al mensaje? (Opcional)',
                type: ApplicationCommandOptionType.Attachment,
                required: false
            }
        ]
    },

    async execute(interaction) {
        // 🔒 Verificamos que solo el Staff pueda usar esto
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ 
                content: '❌ **No tienes permisos:** Solo el Staff puede usar al bot para hablar.', 
                ephemeral: true 
            });
        }

        // Obtenemos lo que escribiste en las opciones del comando
        const texto = interaction.options.getString('mensaje');
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        // Preparamos el mensaje que enviará el bot
        const opcionesMensaje = {
            content: texto
        };

        // Si subiste una imagen, la agregamos al mensaje normal
        if (fotoAdjunta) {
            opcionesMensaje.files = [fotoAdjunta.url];
        }

        // 1. Enviamos el mensaje al canal públicamente
        await interaction.channel.send(opcionesMensaje);

        // 2. Te respondemos a ti en privado para que nadie vea el "/decir" en el chat
        await interaction.reply({ 
            content: '✅ Mensaje enviado exitosamente como el bot.', 
            ephemeral: true 
        });
    }
};
