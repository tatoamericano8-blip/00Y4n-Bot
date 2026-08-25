import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import Session from '../../../models/Session.js';
import { actualizarRolesLogSesion } from '../../utils/logSesionArchivo.js';

export default {
    data: {
        name: 'supervisar_swfl',
        description: 'Anuncia publicamente quien esta supervisando la sesion de Carmeet/Roleplay.',
        options: [
            {
                name: 'supervisor',
                description: 'El staff que supervisara. Si lo dejas en blanco, seras tu por defecto.',
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
                    content:
                        'No hay una sesion activa para supervisar. Primero usa `/inicio`.',
                    ephemeral: true
                });
            }

            sesion.supervisorId = supervisor.id;
            await sesion.save();
            actualizarRolesLogSesion(interaction.guildId, { supervisorId: supervisor.id });
        } catch (err) {
            console.error('Error guardando supervisor en sesion:', err);
            return interaction.reply({
                content:
                    'Error al registrar el supervisor en la sesion. Intenta de nuevo.',
                ephemeral: true
            });
        }

        const embedSupervision = new EmbedBuilder()
            .setDescription(
                `<@${supervisor.id}> esta **supervisando** la sesion.` +
                    (sesion.hostId && sesion.hostId !== supervisor.id
                        ? `\n> Host: <@${sesion.hostId}>`
                        : '')
            )
            .setColor('#74d4fc')
            .setFooter({ text: 'Southwest Florida Comunidad 00Y4n' });

        await interaction.reply({
            content: 'Anuncio de supervision generado.',
            ephemeral: true
        });

        let enviadoComoReply = false;
        if (sesion?.idInicio) {
            try {
                const msgInicio = await interaction.channel.messages
                    .fetch(sesion.idInicio)
                    .catch(() => null);
                if (msgInicio) {
                    await msgInicio.reply({ embeds: [embedSupervision] });
                    enviadoComoReply = true;
                }
            } catch (e) {
                console.error('No se pudo responder al mensaje de inicio:', e.message);
            }
        }

        if (!enviadoComoReply) {
            await interaction.channel.send({ embeds: [embedSupervision] });
        }
    }
};
