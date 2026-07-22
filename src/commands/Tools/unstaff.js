import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unstaff')
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

        // Configuración según el rol elegido
        const datosRoles = {
            host: {
                titulo: '<a:si:1523027438030946446> Host Finalizado',
                etiqueta: 'Host',
                estado: 'Ha finalizado la gestión de la sesión.'
            },
            cohost: {
                titulo: '<a:si:1523027438030946446> Co-Host Finalizado',
                etiqueta: 'Co-Host',
                estado: 'Ha concluido su labor de apoyo en la sesión.'
            },
            supervisor: {
                titulo: '<a:si:1523027438030946446> Supervisión Finalizada',
                etiqueta: 'Supervisor',
                estado: 'Ha dejado de monitorear la sesión.'
            }
        };

        const config = datosRoles[rolSeleccionado];

        // Embed con formato 00Y4n (#74d4fc)
        const embedUnstaff = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle(config.titulo)
            .setDescription(
                `**${config.etiqueta}:** <@${interaction.user.id}> (\`${interaction.user.username}\`)\n` +
                `**Estado:** ${config.estado}\n\n` +
                `<:notas:1523041319046479964> **Notas / Observaciones:**\n${notas}`
            )
            .setFooter({ text: '00Y4n Comunidad SWFL • Control de Sesiones', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [embedUnstaff]
        });
    },
};
