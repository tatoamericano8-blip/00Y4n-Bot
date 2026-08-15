import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    PermissionFlagsBits,
    MessageFlags
} from 'discord.js';

const BANNER =
    'https://cdn.discordapp.com/attachments/1505017301089652898/1536043677573447770/Asistencia_1.png';
const COLOR = 0xfb8b66;

export default {
    data: new SlashCommandBuilder()
        .setName('panel-tickets')
        .setDescription('Publica el panel de soporte / tickets de 00Y4n (menú desplegable).')
        .addChannelOption(opt =>
            opt
                .setName('categoria')
                .setDescription('Categoría donde se crearán los tickets (opcional).')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                content: '<:cruz00y4n:1534937767652495360> Solo staff con **Gestionar Servidor** puede publicar el panel.',
                flags: MessageFlags.Ephemeral
            });
        }

        const categoria = interaction.options.getChannel('categoria');
        const catId = categoria?.id || 'auto';

        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setTitle('<:manual:1534999731019972671> Soporte del servidor 00Y4n <:manual:1534999731019972671>')
            .setDescription(
                [
                    '<:dot:1534938142665084938> Bienvenido al directorio de soporte de **Southwest Florida 00Y4n**.',
                    'Desde acá podés pedir ayuda, reportar usuarios o staff, postularte al equipo de media o solicitar **Staff FastPass**.',
                    '',
                    'Elegí el tipo de ticket correcto en el menú de abajo.',
                    '**No abras un ticket de troleo ni uno equivocado:** se aplicará la sanción correspondiente.',
                    'Una vez abierto, explicá el problema con claridad y esperá a que un miembro del staff te atienda.',
                    '',
                    '**<:flecha:1534937306191102125> Soporte general**',
                    '<:dot:1534938142665084938> Dudas del servidor, reglas, sesiones, economía, comandos o funcionamiento general.',
                    'También perks o consultas de partnership. **No** uses este ticket para reportar personas.',
                    '',
                    '**<:flecha:1534937306191102125> Reportar miembro**',
                    '<:dot:1534938142665084938> Reportá a un ciudadano que rompa reglas en Discord o en sesión.',
                    'Reuní pruebas (capturas, clips, hora). Sin pruebas es más difícil actuar.',
                    '',
                    '**<:flecha:1534937306191102125> Reportar staff o host**',
                    '<:dot:1534938142665084938> Reportá staff/host que abuse de permisos, incumpla funciones o rompa el reglamento interno.',
                    'Adjuntá pruebas. Se revisa de forma seria e interna.',
                    '',
                    '**<:flecha:1534937306191102125> Aplicación de fotógrafo**',
                    '<:dot:1534938142665084938> Si tenés experiencia en fotografía y querés sumarte al equipo de media, usá esta opción.',
                    'Contá tu experiencia y, si podés, adjuntá ejemplos.',
                    '',
                    '**<:flecha:1534937306191102125> Aplicación de videógrafo**',
                    '<:dot:1534938142665084938> Si tenés experiencia en videografía y querés sumarte al equipo de media, usá esta opción.',
                    'Contá tu experiencia y adjuntá ejemplos si podés.',
                    '',
                    '**<:flecha:1534937306191102125> Staff FastPass**',
                    '<:dot:1534938142665084938> Postulación prioritaria al staff.',
                    '**Requisito:** experiencia en un servidor de roleplay/comunidad de **más de 1.000 miembros**.',
                    'Adjuntá prueba (captura del server, rol, etc.). Sin prueba válida el ticket puede cerrarse.',
                    '',
                    '<:warn:1534937002695327837> **Recordatorios**',
                    '<:dot:1534938142665084938> Tickets solo por kicks de sesión se cierran (salvo strike + apelación de ese strike).',
                    '<:dot:1534938142665084938> Tickets sin la información pedida se cierran.',
                    '<:dot:1534938142665084938> **Un ticket a la vez.** Abrir varios sin motivo puede terminar en sanción.'
                ].join('\n')
            )
            .setImage(BANNER)
            .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' })
            .setTimestamp();

        const menu = new StringSelectMenuBuilder()
            .setCustomId(`ticket_tipo:${catId}`)
            .setPlaceholder('Elegí un tipo de ticket...')
            .addOptions(
                {
                    label: 'Soporte general',
                    description: 'Dudas, reglas, sesiones, perks',
                    value: 'soporte_general',
                    emoji: '1535395536012578978'
                },
                {
                    label: 'Reportar miembro',
                    description: 'Reportar a un ciudadano',
                    value: 'reportar_miembro',
                    emoji: '1534937551092187136'
                },
                {
                    label: 'Reportar staff o host',
                    description: 'Reportar staff / host',
                    value: 'reportar_staff',
                    emoji: '1535395859196411934'
                },
                {
                    label: 'Aplicación fotógrafo',
                    description: 'Postulación a fotografía',
                    value: 'app_fotografo',
                    emoji: '1534938916057120839'
                },
                {
                    label: 'Aplicación videógrafo',
                    description: 'Postulación a videografía',
                    value: 'app_videografo',
                    emoji: '1534938916057120839'
                },
                {
                    label: 'Staff FastPass',
                    description: 'Postulación prioritaria (server 1k+)',
                    value: 'staff_fastpass',
                    emoji: '1534956881787752478'
                }
            );

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({
            content: '<:tilde:1534937809733812286> Panel de tickets publicado.',
            flags: MessageFlags.Ephemeral
        });

        await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
};
