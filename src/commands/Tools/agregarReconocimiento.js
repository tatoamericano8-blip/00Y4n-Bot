import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import Staff from '../../../models/Staff.js';

const ROLE_HIGH_COMMAND = '1528870731629465752';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-reconocimiento')
        .setDescription('Asigna premios o reconocimientos a ejecutivos y asociados.')
        .addUserOption(opt => opt.setName('member').setDescription('Staff galardonado.').setRequired(true))
        .addStringOption(opt => opt.setName('last_award').setDescription('Título del premio o medalla.').setRequired(true))
        .addStringOption(opt => opt.setName('descripcion').setDescription('Motivo o detalle del reconocimiento.').setRequired(false)),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> Solo Alto Comando puede otorgar reconocimientos.',
                flags: MessageFlags.Ephemeral
            });
        }

        const targetUser = interaction.options.getUser('member');
        const titulo = interaction.options.getString('last_award');
        const descripcion = interaction.options.getString('descripcion') || 'Reconocimiento otorgado por su desempeño destacado.';

        let staffData = await Staff.findOne({ guildId: interaction.guildId, userId: targetUser.id });
        if (!staffData) {
            return await interaction.reply({
                content: '<:cruz00y4n:1523041302764191844> El usuario no se encuentra en el registro de Staff.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        staffData.premios.push({
            titulo,
            descripcion,
            otorgadoPor: interaction.user.id,
            fecha: new Date()
        });
        await staffData.save();

        const embedAward = new EmbedBuilder()
            .setTitle('<:trofeo:1532128342327693352> ¡Nuevo Reconocimiento Otorgado!')
            .setColor('#74d4fc')
            .setDescription(
                `> **Galardonado:** <@${targetUser.id}>\n` +
                `> **Premio / Distinción:** \`${titulo}\`\n` +
                `> **Detalle:** ${descripcion}\n` +
                `> **Otorgado por:** <@${interaction.user.id}>`
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();

        await interaction.editReply({ embeds: [embedAward] });
    }
};
