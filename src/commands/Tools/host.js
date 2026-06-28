import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: {
        name: 'host_swfl',
        description: 'Anuncia formalmente quién está a cargo o ayudando en la sesión actual.',
        options: [
            {
                name: 'tipo',
                description: '¿Qué rol vas a anunciar?',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'Host', value: 'host' },
                    { name: 'Co-Host', value: 'cohost' }
                ]
            },
            {
                name: 'usuario',
                description: 'Selecciona al miembro del Staff que estará a cargo.',
                type: ApplicationCommandOptionType.User,
                required: true
            }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Candado para que solo el Staff pueda tirar el aviso
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ 
                content: '❌ **No tienes permisos:** Solo el Staff puede anunciar encargados de sesión.', 
                ephemeral: true 
            });
        }

        const tipo = interaction.options.getString('tipo');
        const usuarioStaff = interaction.options.getUser('usuario');

        let textoTraducido = '';

        // Adaptación limpia con los términos Host y Co-Host
        if (tipo === 'host') {
            textoTraducido = `<a:si:1519474823309426699> <@${usuarioStaff.id}> ahora es el **Host** de la sesión actual. ¡Dirígete a este usuario si tienes alguna duda o inconveniente dentro del servidor!`;
        } else if (tipo === 'cohost') {
            textoTraducido = `<a:si:1519474823309426699> <@${usuarioStaff.id}> ahora es **Co-Host** de la sesión actual. ¡Dirígete a este usuario si el host está ocupado o no se encuentra disponible!`;
        }

        // Diseño minimalista idéntico a la imagen: sin títulos pesados, solo la barra naranja y el texto
        const embedStaff = new EmbedBuilder()
            .setDescription(textoTraducido)
            .setColor('#ff6600'); 

        // Mensaje oculto de confirmación para vos
        await interaction.reply({ content: 'Generando el anuncio de Staff...', ephemeral: true });

        // Envía SOLO el embed al canal, sin pings extras ni texto por fuera
        await interaction.channel.send({ embeds: [embedStaff] });
    }
};
