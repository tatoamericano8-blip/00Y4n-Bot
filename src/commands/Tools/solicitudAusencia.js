import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits, 
    MessageFlags 
} from 'discord.js';
import Staff from '../../../models/Staff.js';

const ROLE_STAFF = '1512120103771050005';
const ROLE_HIGH_COMMAND = '1528870731629465752';
const ROLE_LOA = '1532459272690991318';
const CHANNEL_LOA = '1505015938544701490';

export default {
    data: new SlashCommandBuilder()
        .setName('solicitud-ausencia')
        .setDescription('Solicita una licencia de ausencia (LOA) para revisión de High Command.')
        .addStringOption(opt => opt.setName('inicio').setDescription('Fecha/Día de inicio (ej. 01/08).').setRequired(true))
        .addStringOption(opt => opt.setName('fin').setDescription('Fecha/Día de regreso (ej. 10/08).').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo detallado de la ausencia.').setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(ROLE_STAFF)) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> Solo el personal con rol de Staff puede solicitar licencias.',
                flags: MessageFlags.Ephemeral
            });
        }

        const fechaInicio = interaction.options.getString('inicio');
        const fechaFin = interaction.options.getString('fin');
        const motivo = interaction.options.getString('motivo');

        const loaChannel = interaction.guild.channels.cache.get(CHANNEL_LOA);
        if (!loaChannel) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> No se encontró el canal de solicitudes de LOA.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Embed interactivo para el canal de ausencias
        const embedSolicitud = new EmbedBuilder()
            .setTitle('<:fle:1523027651441197330> Solicitud de Ausencia (LOA)')
            .setColor('#f1c40f')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription(
                `> **Solicitante:** <@${interaction.user.id}> (\`${interaction.user.id}\`)\n` +
                `> **Inicio:** \`${fechaInicio}\` | **Fin:** \`${fechaFin}\`\n` +
                `> **Motivo:** ${motivo}\n\n` +
                `*Un miembro de Alto Comando debe revisar esta solicitud.*`
            )
            .setTimestamp();

        const botones = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`loa_approve_${interaction.user.id}_${fechaInicio}_${fechaFin}`)
                .setLabel('Aprobar LOA')
                .setStyle(ButtonStyle.Success)
                .setEmoji('1524936452574806076'),
            new ButtonBuilder()
                .setCustomId(`loa_reject_${interaction.user.id}`)
                .setLabel('Rechazar')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('1523041302764191844')
        );

        const msgLOA = await loaChannel.send({ embeds: [embedSolicitud], components: [botones] });

        await interaction.editReply({
            content: `<a:verificacion:1523027148326047878> Tu solicitud de LOA fue enviada correctamente a <#${CHANNEL_LOA}> para su revisión.`
        });
    }
};
