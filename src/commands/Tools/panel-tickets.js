import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    PermissionFlagsBits,
    MessageFlags
} from 'discord.js';
import { E, EMOJI_DEF } from '../../config/emojis.js';

const BANNER =
    'https://cdn.discordapp.com/attachments/1505017301089652898/1548119319227924583/Asistencia_1.png';
const COLOR = 0x8ae6fa;

export default {
    data: new SlashCommandBuilder()
        .setName('panel-tickets')
        .setDescription('Publica el panel de soporte / tickets de 00Y4n (menú desplegable).')
        .addChannelOption(opt =>
            opt
                .setName('categoria')
                .setDescription('Categoría donde se crearán los tickets (opcional).')
                .setRequired(false))
        .setDefaultMemberPermissions(null),

    async execute(interaction) {
        const ROL_EQUIPO_PROPIETARIOS = '1528877296977711256';
        if (!interaction.member.roles.cache.has(ROL_EQUIPO_PROPIETARIOS)) {
            return interaction.reply({
                content: E.cruz + ' Solo el **Equipo de Propietarios** puede publicar el panel.',
                flags: MessageFlags.Ephemeral
            });
        }

        const categoria = interaction.options.getChannel('categoria');
        const catId = categoria?.id || 'auto';

        // Embed 1: solo la imagen de asistencia (arriba)
        const embedBanner = new EmbedBuilder()
            .setColor(COLOR)
            .setImage(BANNER);

        // Embed 2: textos / tipos de ticket (igual que antes, sin imagen)
        const embed = new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(E.manual + ' Soporte del servidor 00Y4n ' + E.manual)
            .setDescription(
                [
                    E.dot + ' Bienvenido al directorio de soporte de **Southwest Florida 00Y4n**.',
                    'Desde acá podés pedir ayuda, reportar usuarios o staff, postularte al equipo de media o solicitar **Staff FastPass**.',
                    '',
                    'Elegí el tipo de ticket correcto en el menú de abajo.',
                    '**No abras un ticket de troleo ni uno equivocado:** se aplicará la sanción correspondiente.',
                    'Una vez abierto, explicá el problema con claridad y esperá a que un miembro del staff te atienda.',
                    '',
                    '**' + E.flecha + ' Soporte general**',
                    E.dot + ' Dudas del servidor, reglas, sesiones, economía, comandos o funcionamiento general.',
                    'También perks o consultas de partnership. **No** uses este ticket para reportar personas.',
                    '',
                    '**' + E.flecha + ' Reportar miembro**',
                    E.dot + ' Reportá a un ciudadano que rompa reglas en Discord o en sesión.',
                    'Reuní pruebas (capturas, clips, hora). Sin pruebas es más difícil actuar.',
                    '',
                    '**' + E.flecha + ' Reportar staff o host**',
                    E.dot + ' Reportá staff/host que abuse de permisos, incumpla funciones o rompa el reglamento interno.',
                    'Adjuntá pruebas. Se revisa de forma seria e interna.',
                    '',
                    '**' + E.flecha + ' Aplicación de fotógrafo**',
                    E.dot + ' Si tenés experiencia en fotografía y querés sumarte al equipo de media, usá esta opción.',
                    'Contá tu experiencia y, si podés, adjuntá ejemplos.',
                    '',
                    '**' + E.flecha + ' Aplicación de videógrafo**',
                    E.dot + ' Si tenés experiencia en videografía y querés sumarte al equipo de media, usá esta opción.',
                    'Contá tu experiencia y adjuntá ejemplos si podés.',
                    '',
                    '**' + E.flecha + ' Staff FastPass**',
                    E.dot + ' Postulación prioritaria al staff.',
                    '**Requisito:** experiencia en un servidor de roleplay/comunidad de **más de 1.000 miembros**.',
                    'Adjuntá prueba (captura del server, rol, etc.). Sin prueba válida el ticket puede cerrarse.',
                    '',
                    E.warn + ' **Recordatorios**',
                    E.dot + ' Tickets solo por kicks de sesión se cierran (salvo strike + apelación de ese strike).',
                    E.dot + ' Tickets sin la información pedida se cierran.',
                    E.dot + ' **Un ticket a la vez.** Abrir varios sin motivo puede terminar en sanción.'
                ].join('\n')
            )
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
                    emoji: EMOJI_DEF.form.id
                },
                {
                    label: 'Reportar miembro',
                    description: 'Reportar a un ciudadano',
                    value: 'reportar_miembro',
                    emoji: EMOJI_DEF.id.id
                },
                {
                    label: 'Reportar staff o host',
                    description: 'Reportar staff / host',
                    value: 'reportar_staff',
                    emoji: EMOJI_DEF.warn.id
                },
                {
                    label: 'Aplicación fotógrafo',
                    description: 'Postulación a fotografía',
                    value: 'app_fotografo',
                    emoji: EMOJI_DEF.perfil.id
                },
                {
                    label: 'Aplicación videógrafo',
                    description: 'Postulación a videografía',
                    value: 'app_videografo',
                    emoji: EMOJI_DEF.auto.id
                },
                {
                    label: 'Staff FastPass',
                    description: 'Postulación prioritaria (server 1k+)',
                    value: 'staff_fastpass',
                    emoji: EMOJI_DEF.staff_icon.id
                }
            );

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({
            content: E.tilde + ' Panel de tickets publicado.',
            flags: MessageFlags.Ephemeral
        });

        await interaction.channel.send({
            embeds: [embedBanner, embed],
            components: [row]
        });
    }
};
