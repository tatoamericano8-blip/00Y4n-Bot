import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

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

        // Traducción exacta y pulida de image_df172e.png al español
        const textoDescripcion = `<a:mov:1520905604720496843> <@${usuarioStaff.id}> ha **regenerado el link de re-invitaciones (x${contador})**! Por favor, sean pacientes, ya que las próximas re-invitaciones se realizarán dentro de los próximos 30 minutes. Molestar al host para pedir el acceso resultará en un aislamiento (timeout).`;

        const embedRegen = new EmbedBuilder()
            .setTitle('<a:si:1520905696697389227> SWFL Roleplay | Link Regenerado <a:si:1520905696697389227>')
            .setDescription(textoDescripcion)
            .setColor('#ff6600'); // Tu naranja insignia

        if (fotoAdjunta) embedRegen.setImage(fotoAdjunta.url);

        // Mensaje de confirmación oculto solo para vos
        await interaction.reply({ content: 'Enviando el aviso de link regenerado...', ephemeral: true });

        // Envía SOLO el embed limpio al canal, sin pings a @everyone ni roles molestos
        await interaction.channel.send({ embeds: [embedRegen] });
    }
};
