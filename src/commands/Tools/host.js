import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Session from '../../../models/Session.js';

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
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ **No tienes permisos:** Solo el Staff puede anunciar encargados de sesión.',
                ephemeral: true
            });
        }

        const tipo = interaction.options.getString('tipo');
        const usuarioStaff = interaction.options.getUser('usuario');

        // Guardar host / co-host en la sesión activa
        try {
            const update =
                tipo === 'host'
                    ? { hostId: usuarioStaff.id }
                    : { coHostId: usuarioStaff.id };

            await Session.findOneAndUpdate(
                {
                    guildId: interaction.guildId,
                    estado: { $in: ['esperando_reacciones', 'activa'] }
                },
                update,
                { sort: { fechaInicio: -1 } }
            );
        } catch (err) {
            console.error('Error guardando host/cohost en sesión:', err);
        }

        let textoTraducido = '';
        if (tipo === 'host') {
            textoTraducido = `<:si:1523041359441952970> <@${usuarioStaff.id}> ahora es el **Host** de la sesión actual. ¡Dirígete a este usuario si tienes alguna duda o inconveniente dentro del servidor!`;
        } else {
            textoTraducido = `<:si:1523041359441952970> <@${usuarioStaff.id}> ahora es **Co-Host** de la sesión actual. ¡Dirígete a este usuario si el host está ocupado o no se encuentra disponible!`;
        }

        const embedStaff = new EmbedBuilder()
            .setDescription(textoTraducido)
            .setColor('#74d4fc');

        await interaction.reply({ content: 'Generando el anuncio de Staff...', ephemeral: true });
        await interaction.channel.send({ embeds: [embedStaff] });
    }
};
