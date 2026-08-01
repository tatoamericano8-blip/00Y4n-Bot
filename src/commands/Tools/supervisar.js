import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import Session from '../../../models/Session.js';

export default {
    data: {
        name: 'supervisar_swfl',
        description: 'Anuncia públicamente quién está supervisando la sesión de Carmeet/Roleplay.',
        options: [
            {
                name: 'supervisor',
                description: 'El staff que supervisará. Si lo dejas en blanco, serás tú por defecto.',
                type: ApplicationCommandOptionType.User,
                required: false
            }
        ]
    },

    async execute(interaction) {
        const supervisor = interaction.options.getUser('supervisor') || interaction.user;

        // Guardar supervisor en la sesión activa del servidor para auto-cuota al cerrar
        try {
            await Session.findOneAndUpdate(
                {
                    guildId: interaction.guildId,
                    estado: { $in: ['esperando_reacciones', 'activa'] }
                },
                { supervisorId: supervisor.id },
                { sort: { fechaInicio: -1 } }
            );
        } catch (err) {
            console.error('Error guardando supervisor en sesión:', err);
        }

        const embedSupervision = new EmbedBuilder()
            .setDescription(`<a:flecha:1523027371735777503> <@${supervisor.id}> está **supervisando** la sesión.`)
            .setColor('#74d4fc');

        await interaction.reply({
            embeds: [embedSupervision]
        });
    }
};
