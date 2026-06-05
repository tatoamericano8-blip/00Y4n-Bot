import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: {
        name: 'blacklist_swfl',
        description: 'Registra a los usuarios que tienen prohibido volver a unirse a la sesión actual.',
        options: [
            {
                name: 'usuario1',
                description: 'Selecciona al primer usuario que no podrá volver a ingresar.',
                type: ApplicationCommandOptionType.User,
                required: true
            },
            {
                name: 'usuario2',
                description: 'Selecciona al segundo usuario (opcional).',
                type: ApplicationCommandOptionType.User,
                required: false
            },
            {
                name: 'usuario3',
                description: 'Selecciona al tercer usuario (opcional).',
                type: ApplicationCommandOptionType.User,
                required: false
            },
            {
                name: 'usuario4',
                description: 'Selecciona al cuarto usuario (opcional).',
                type: ApplicationCommandOptionType.User,
                required: false
            },
            {
                name: 'motivo',
                description: 'Escribe la razón de la expulsión / lista negra (opcional).',
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    },

    async execute(interaction) {
        // 🔒 SEGURIDAD: Solo los moderadores/Staff pueden usar la lista negra
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({ 
                content: '❌ **No tienes permisos:** Solo el Staff autorizado puede gestionar la blacklist.', 
                ephemeral: true 
            });
        }

        // Capturamos los posibles 4 usuarios de forma dinámica
        const u1 = interaction.options.getUser('usuario1');
        const u2 = interaction.options.getUser('usuario2');
        const u3 = interaction.options.getUser('usuario3');
        const u4 = interaction.options.getUser('usuario4');
        const motivo = interaction.options.getString('motivo');

        // Filtramos para quedarnos solo con los campos que rellenaste
        const listaUsuarios = [u1, u2, u3, u4].filter(u => u !== null);

        // 🔔 Menciones ANTES del mensaje para que les notifique (como en la foto)
        const pingsAntesDelEmbed = listaUsuarios.map(u => `<@${u.id}>`).join(' ');

        // Armamos el listado interno clonando la traducción de image_d2469c.png
        let lineasBlacklist = '';
        listaUsuarios.forEach(u => {
            lineasBlacklist += `• <@${u.id}> no podés volver a unirte a la sesión.\n`;
        });

        // Si decidiste agregar un porqué, se los sumamos abajo
        if (motivo) {
            lineasBlacklist += `\n> ⚠️ **Razón de la Sanción:** ${motivo}`;
        }

        // Clonamos el formato limpio de la foto con tu naranja insignia
        const embedBlacklist = new EmbedBuilder()
            .setTitle('📒 Blacklist de la Sesión 📒')
            .setDescription(lineasBlacklist.trim())
            .setColor('#ff6600')
            .setTimestamp();

        // Confirmación privada para vos
        await interaction.reply({ content: 'Publicando reporte de blacklist en el canal...', ephemeral: true });

        // Mandamos los tags arriba del todo y el recuadro naranja pegado abajo
        await interaction.channel.send({ 
            content: pingsAntesDelEmbed, 
            embeds: [embedBlacklist] 
        });
    }
};
