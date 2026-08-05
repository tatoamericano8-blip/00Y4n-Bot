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
        const guildId = interaction.guild.id;

        let sesion = null;
        try {
            sesion = await Session.findOne({
                guildId,
                estado: { $in: ['esperando_reacciones', 'activa'] }
            }).sort({ fechaInicio: -1 });

            if (!sesion) {
                return interaction.reply({
                    content: '<a:adv:1523027438030946446> No hay una sesión activa para supervisar. Primero usá `/inicio_swfl`.',
                    ephemeral: true
                });
            }

            sesion.supervisorId = supervisor.id;
            await sesion.save();
        } catch (err) {
            console.error('Error guardando supervisor en sesión:', err);
            return interaction.reply({
                content: '❌ Error al registrar el supervisor en la sesión. Intentá de nuevo.',
                ephemeral: true
            });
        }

        const embedSupervision = new EmbedBuilder()
            .setDescription(
                `<a:flecha:1523027371735777503> <@${supervisor.id}> está **supervisando** la sesión.` +
                (sesion.hostId && sesion.hostId !== supervisor.id
                    ? `\n> Host: <@${sesion.hostId}>`
                    : '')
            )
            .setColor('#74d4fc')
            .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

        await interaction.reply({
            embeds: [embedSupervision]
        });
    }
};
