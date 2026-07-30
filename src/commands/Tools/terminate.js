import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import Staff from '../../../models/Staff.js';

const ROLE_HIGH_COMMAND = '1528870731629465752';
const ROLE_STAFF = '1512120103771050005';
const CHANNEL_LOGS = '1505015805891579934';

export default {
    data: new SlashCommandBuilder()
        .setName('terminate')
        .setDescription('Destituye / despide a un integrante del equipo de Staff.')
        .addUserOption(opt => opt.setName('usuario').setDescription('El miembro del Staff a destituir.').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo de la destitución.').setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> **Permisos insuficientes:** Solo Alto Comando puede ejecutar destituciones.',
                flags: MessageFlags.Ephemeral
            });
        }

        const targetUser = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        await interaction.deferReply();

        let staffData = await Staff.findOne({ guildId: interaction.guildId, userId: targetUser.id });

        if (targetMember && targetMember.roles.cache.has(ROLE_STAFF)) {
            await targetMember.roles.remove(ROLE_STAFF).catch(() => null);
        }

        if (staffData) {
            staffData.estado = 'DESPEDIDO';
            staffData.despido = {
                fecha: new Date(),
                motivo,
                realizadoPor: interaction.user.id
            };
            await staffData.save();
        }

        const embedLog = new EmbedBuilder()
            .setTitle('<:cruz00y4n:1523041302764191844> Destitución de Staff')
            .setColor('#ed4245')
            .setDescription(
                `> **Usuario Destituido:** <@${targetUser.id}> (\`${targetUser.id}\`)\n` +
                `> **Motivo:** ${motivo}\n` +
                `> **Ejecutado por:** <@${interaction.user.id}>\n` +
                `> **Fecha:** <t:${Math.floor(Date.now() / 1000)}:F>`
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();

        const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);
        if (logsChannel) await logsChannel.send({ embeds: [embedLog] });

        await interaction.editReply({
            content: `<a:verificacion:1523027148326047878> <@${targetUser.id}> ha sido destituido del equipo de Staff.`
        });
    }
};
