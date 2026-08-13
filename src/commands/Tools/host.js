import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Session from '../../../models/Session.js';

export default {
    data: {
        name: 'host_swfl',
        description: 'Anuncia formalmente quién es Host o Co-Host de la sesión actual.',
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
                description: 'Miembro del Staff que estará a cargo.',
                type: ApplicationCommandOptionType.User,
                required: true
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '<:cruz00y4n:1534937767652495360> Solo el **Staff** puede anunciar encargados de sesión.',
                ephemeral: true
            });
        }

        const tipo = interaction.options.getString('tipo');
        const usuarioStaff = interaction.options.getUser('usuario');

        let sesion = null;
        try {
            sesion = await Session.findOne({
                guildId: interaction.guildId,
                estado: { $in: ['esperando_reacciones', 'activa'] }
            }).sort({ fechaInicio: -1 });

            if (sesion) {
                if (tipo === 'host') {
                    sesion.hostId = usuarioStaff.id;
                    sesion.hostActivo = true;
                } else {
                    sesion.coHostId = usuarioStaff.id;
                }
                await sesion.save();
            }
        } catch (err) {
            console.error('Error guardando host/cohost en sesión:', err);
        }

        const esCohost = tipo === 'cohost';
        const titulo = esCohost
            ? '<a:corasfinos:1534953815969890436> 00Y4n Southwest Florida Comunidad — Co-Host de Sesión <a:corasfinos:1534953815969890436>'
            : '<a:corasfinos:1534953815969890436> 00Y4n Southwest Florida Comunidad — Host de Sesión <a:corasfinos:1534953815969890436>';

        const descripcion = esCohost
            ? `<:dot:1534938142665084938> <@${usuarioStaff.id}> es **Co-Host** de la sesión actual. Si necesitás soporte y el host está ocupado, dirigite al co-host.`
            : `<:dot:1534938142665084938> <@${usuarioStaff.id}> es el **Host** de la sesión actual. Dirigite a este usuario si tenés dudas o inconvenientes dentro del servidor.`;

        const embedStaff = new EmbedBuilder()
            .setColor('#74d4fc')
            .setDescription(`| ${titulo}\n\n${descripcion}`)
            .setFooter({
                text: '00Y4n Comunidad SWFL',
                iconURL: interaction.guild.iconURL()
            });

        await interaction.reply({
            content: '<:verificacion:1534937809733812286> Anuncio de staff generado.',
            ephemeral: true
        });

        let enviadoComoReply = false;
        if (sesion?.idInicio) {
            try {
                const msgInicio = await interaction.channel.messages
                    .fetch(sesion.idInicio)
                    .catch(() => null);
                if (msgInicio) {
                    await msgInicio.reply({ embeds: [embedStaff] });
                    enviadoComoReply = true;
                }
            } catch (e) {
                console.error('No se pudo responder al mensaje de inicio:', e.message);
            }
        }

        if (!enviadoComoReply) {
            await interaction.channel.send({ embeds: [embedStaff] });
        }
    }
};
