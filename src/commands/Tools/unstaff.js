import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Session from '../../../models/Session.js';

export default {
    data: new SlashCommandBuilder()
        .setName('finalizar_host')
        .setDescription('Anuncia que has finalizado tu rol de Staff en la sesión activa.')
        .addStringOption(option =>
            option.setName('rol')
                .setDescription('Selecciona el puesto que vas a dejar de ejercer.')
                .setRequired(true)
                .addChoices(
                    { name: 'Host', value: 'host' },
                    { name: 'Co-Host', value: 'cohost' },
                    { name: 'Supervisor', value: 'supervisor' }
                ))
        .addStringOption(option =>
            option.setName('notas')
                .setDescription('Observaciones o notas sobre la sesión (Opcional).')
                .setRequired(false)),

    async execute(interaction) {
        const rolSeleccionado = interaction.options.getString('rol');
        const notas = interaction.options.getString('notas') || 'Sin observaciones.';

        const datosRoles = {
            host: {
                titulo: '<a:si:1534954014335172729> Host Finalizado',
                etiqueta: 'Host',
                estado: 'Ha finalizado la gestión de la sesión.'
            },
            cohost: {
                titulo: '<a:si:1534954014335172729> Co-Host Finalizado',
                etiqueta: 'Co-Host',
                estado: 'Ha concluido su labor de apoyo en la sesión.'
            },
            supervisor: {
                titulo: '<a:si:1534954014335172729> Supervisión Finalizada',
                etiqueta: 'Supervisor',
                estado: 'Ha dejado de monitorear la sesión.'
            }
        };

        const config = datosRoles[rolSeleccionado];

        try {
            const sesion = await Session.findOne({
                guildId: interaction.guildId,
                estado: { $in: ['esperando_reacciones', 'activa'] }
            }).sort({ fechaInicio: -1 });
            if (sesion) {
                if (rolSeleccionado === 'cohost' && sesion.coHostId === interaction.user.id) {
                    sesion.coHostId = null;
                    await sesion.save();
                } else if (rolSeleccionado === 'supervisor' && sesion.supervisorId === interaction.user.id) {
                    sesion.supervisorId = null;
                    await sesion.save();
                }
            }
        } catch (e) {
            console.error('[finalizar_host] Error actualizando sesión:', e?.message || e);
        }

        const embedUnstaff = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle(config.titulo)
            .setDescription(
                `**${config.etiqueta}:** <@${interaction.user.id}> (\`${interaction.user.username}\`)\n` +
                `**Estado:** ${config.estado}\n\n` +
                `<:notas:1534938422202994755> **Notas / Observaciones:**\n${notas}`
            )
            .setFooter({ text: '00Y4n Comunidad SWFL • Control de Sesiones', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [embedUnstaff]
        });
    },
};
