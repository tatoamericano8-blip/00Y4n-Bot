import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

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
        // 🔒 SEGURIDAD: Solo los miembros del Staff con este permiso pueden tirar el aviso
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ 
                content: '❌ **No tienes permisos:** Solo el Staff puede anunciar la regeneración de links.', 
                ephemeral: true 
            });
        }

        const contador = interaction.options.getInteger('contador');
        // Si no se selecciona un usuario, el bot usa por defecto al que ejecutó el comando
        const usuarioStaff = interaction.options.getUser('usuario') || interaction.user;
        const fotoAdjunta = interaction.options.getAttachment('imagen');

        // Adaptación impecable enfocada 100% en Car Meets
        const textoDescripcion = `• <@${usuarioStaff.id}> ha **regenerado el link del Car Meet (x${contador})**! Por favor, sean pacientes mientras se acomodan los cupos en el servidor. Molestar al host para pedir el acceso resultará en un aislamiento (timeout).`;

        const embedRegenMeet = new EmbedBuilder()
            .setTitle('⚙️ SWFL Car Meet | Link Regenerado ⚙️')
            .setDescription(textoDescripcion)
            .setColor('#ff6600'); // Tu naranja flama

        if (fotoAdjunta) embedRegenMeet.setImage(fotoAdjunta.url);

        // Mensaje de confirmación oculto solo para vos
        await interaction.reply({ content: 'Enviando el aviso de link de meet regenerado...', ephemeral: true });

        // Envía SOLO el embed limpio al canal, sin pings molestos
        await interaction.channel.send({ embeds: [embedRegenMeet] });
    }
};
