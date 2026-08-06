import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import Staff from '../../../models/Staff.js';
import { estaEnBlacklistStaff } from './terminate.js';

const ROLE_HIGH_COMMAND = '1528870731629465752';
const ROLE_STAFF = '1512120103771050005';
const CHANNEL_LOGS = '1505015805891579934';

export default {
    data: new SlashCommandBuilder()
        .setName('handpick')
        .setDescription('Recluta directamente a un usuario para ingresar al equipo de Staff.')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('El usuario a contratar.')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('rango')
                .setDescription('Rango asignado (por defecto: Staff Trainee).')
                .setRequired(false)),

    async execute(interaction) {
        if (
            !interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) &&
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
        ) {
            return interaction.reply({
                content: '<:cruz00y4n:1534937767652495360> **Permisos insuficientes:** Solo Alto Comando puede contratar personal.',
                flags: MessageFlags.Ephemeral
            });
        }

        const targetUser = interaction.options.getUser('usuario');
        const rangoAsignado = interaction.options.getString('rango') || 'Staff Trainee';
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.reply({
                content: '<:cruz00y4n:1534937767652495360> El usuario no se encuentra en el servidor.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Bloquear si está en blacklist de Staff
        const enBlacklist = await estaEnBlacklistStaff(interaction.guildId, targetUser.id);
        if (enBlacklist) {
            return interaction.reply({
                content:
                    `🚨 **No se puede contratar a <@${targetUser.id}>.**\n` +
                    `Está en la **blacklist de Staff** (fue destituido con blacklist activa).\n` +
                    `Solo High Command puede revisar el caso manualmente.`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        try {
            await targetMember.roles.add(ROLE_STAFF);

            let staffData = await Staff.findOne({
                guildId: interaction.guildId,
                userId: targetUser.id
            });

            if (staffData) {
                staffData.estado = 'ACTIVO';
                staffData.rango = rangoAsignado;
                staffData.ingreso = new Date();
                staffData.cuotas.sesionesMeta = 3;
                // Limpiar datos de despido anterior si recontratan (sin blacklist)
                staffData.despido = undefined;
                await staffData.save();
            } else {
                staffData = await Staff.create({
                    userId: targetUser.id,
                    guildId: interaction.guildId,
                    rango: rangoAsignado,
                    estado: 'ACTIVO',
                    cuotas: { sesionesMeta: 3, horasMeta: 3 }
                });
            }

            const embedLog = new EmbedBuilder()
                .setTitle('<:verificacion:1534938422202994755> Nuevo Reclutamiento – Staff')
                .setColor('#57f287')
                .setDescription(
                    `> **Usuario contratado:** <@${targetUser.id}> (\`${targetUser.id}\`)\n` +
                    `> **Rango asignado:** \`${rangoAsignado}\`\n` +
                    `> **Reclutado por:** <@${interaction.user.id}>\n` +
                    `> **Fecha de ingreso:** <t:${Math.floor(Date.now() / 1000)}:F>`
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);
            if (logsChannel) await logsChannel.send({ embeds: [embedLog] });

            await interaction.editReply({
                content: `<:verificacion:1534937809733812286> ¡<@${targetUser.id}> ha sido contratado exitosamente como **${rangoAsignado}**!`
            });
        } catch (error) {
            console.error('Error en /handpick:', error);
            await interaction.editReply({
                content: '<:cruz00y4n:1534937767652495360> Ocurrió un error al procesar la contratación.'
            });
        }
    }
};
