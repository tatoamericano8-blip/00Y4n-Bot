import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import Staff from '../../../models/Staff.js';

const ROLE_STAFF = '1512120103771050005';
const CHANNEL_LOGS = '1505015805891579934';

export default {
    data: new SlashCommandBuilder()
        .setName('renunciar')
        .setDescription('Permite renunciar voluntariamente al equipo administrativo.')
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo de tu renuncia.').setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(ROLE_STAFF)) {
            return await interaction.reply({
                content: '<:cruz00y4n:1519476959606734998> No tienes el rol de Staff para realizar esta acción.',
                flags: MessageFlags.Ephemeral
            });
        }

        const motivo = interaction.options.getString('motivo');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            await interaction.member.roles.remove(ROLE_STAFF).catch(() => null);

            let staffData = await Staff.findOne({ guildId: interaction.guildId, userId: interaction.user.id });
            if (staffData) {
                staffData.estado = 'RENUNCIADO';
                staffData.renuncia = {
                    fecha: new Date(),
                    motivo
                };
                await staffData.save();
            }

            const embedLog = new EmbedBuilder()
                .setTitle('<:fle:1523041332300480644> Renuncia de Staff')
                .setColor('#fee75c')
                .setDescription(
                    `> **Usuario:** <@${interaction.user.id}> (\`${interaction.user.id}\`)\n` +
                    `> **Motivo:** ${motivo}\n` +
                    `> **Fecha de Renuncia:** <t:${Math.floor(Date.now() / 1000)}:F>`
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp();

            const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);
            if (logsChannel) await logsChannel.send({ embeds: [embedLog] });

            await interaction.editReply({
                content: `<a:verificacion:1523027148326047878> Tu renuncia ha sido procesada correctamente. Agradecemos tu trabajo en el equipo.`
            });
        } catch (error) {
            console.error('Error en /resign:', error);
            await interaction.editReply({ content: '<:cruz00y4n:1523041302764191844> Ocurrió un error al procesar tu renuncia.' });
        }
    }
};
