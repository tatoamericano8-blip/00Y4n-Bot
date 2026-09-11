import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import Session from '../../../models/Session.js';
import { actualizarRolesLogSesion } from '../../utils/logSesionArchivo.js';
import { E } from '../../config/emojis.js';

const ROL_ALTO_COMANDO = '1528870731629465752';

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
        if (!interaction.member.roles.cache.has(ROL_ALTO_COMANDO)) {
            return interaction.reply({
                content:
                    E.cruz + ' Solo **Alto Comando** puede usar este comando.',
                ephemeral: true
            });
        }

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
                        E.warn + ' No hay una sesion activa para supervisar. Primero usa `/inicio_swfl`.',
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
                    E.cruz + ' Error al registrar el supervisor en la sesion. Intenta de nuevo.',
                ephemeral: true
            });
        }

        const embedSupervision = new EmbedBuilder()
            .setTitle(E.a2alas + ' Southwest Florida Comunidad 00Y4n — __*Supervisor de Servidor*__ ' + E.a2alas)
            .setDescription(
                E.dot + ` <@${supervisor.id}> **ha sido designado como Supervisor de la sesión en curso**. Este usuario supervisará la sesión y al host para garantizar la máxima calidad de roleplay.`
            )
            .setColor('#74d4fc')
            .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' });

        // Confirmacion solo para quien uso el comando (no se ve el /comando en publico)
        await interaction.reply({
            content: E.tilde + ' Anuncio de supervision generado.',
            ephemeral: true
        });

        // Responder al mensaje de /inicio_swfl si existe (igual que host_swfl)
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
