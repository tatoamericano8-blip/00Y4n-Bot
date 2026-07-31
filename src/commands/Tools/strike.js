import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { aplicarStrike, obtenerStrikesActivos } from '../../utils/gestorStrikes.js';

const ROLE_STAFF = '1512120103771050005';
const ROLE_HIGH_COMMAND = '1528870731629465752';
const CHANNEL_LOGS = '1505015805891579934';

const REGULACIONES = [
    { name: 'Toxicidad / Falta de respeto', value: 'toxicidad' },
    { name: 'Insultos o acoso', value: 'insultos' },
    { name: 'Spam o flood', value: 'spam' },
    { name: 'Fail RP', value: 'fail_rp' },
    { name: 'Metagaming', value: 'metagaming' },
    { name: 'Powergaming', value: 'powergaming' },
    { name: 'RDM / VDM', value: 'rdm_vdm' },
    { name: 'Evadir o ignorar al Staff', value: 'evadir_staff' },
    { name: 'Publicidad no autorizada', value: 'publicidad' },
    { name: 'Contenido inapropiado / NSFW', value: 'nsfw' },
    { name: 'Incumplir reglas generales', value: 'reglas_generales' },
    { name: 'Otra infracción', value: 'otra' }
];

const NOMBRES_REG = Object.fromEntries(REGULACIONES.map(r => [r.value, r.name]));

export default {
    data: new SlashCommandBuilder()
        .setName('strike')
        .setDescription('Aplica un strike a un miembro por violar una regulación.')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Miembro que recibe el strike.')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('regulacion')
                .setDescription('Regulación violada.')
                .setRequired(true)
                .addChoices(...REGULACIONES))
        .addStringOption(opt =>
            opt.setName('motivo')
                .setDescription('Detalle / contexto de la infracción.')
                .setRequired(true)),

    async execute(interaction) {
        const esStaff =
            interaction.member.roles.cache.has(ROLE_STAFF) ||
            interaction.member.roles.cache.has(ROLE_HIGH_COMMAND) ||
            interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);

        if (!esStaff) {
            return interaction.reply({
                content: '❌ Solo el **Staff** puede aplicar strikes.',
                flags: MessageFlags.Ephemeral
            });
        }

        const target = interaction.options.getUser('usuario');
        const regulacion = interaction.options.getString('regulacion');
        const motivo = interaction.options.getString('motivo');

        if (target.bot) {
            return interaction.reply({
                content: '❌ No podés aplicar strikes a bots.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ No podés aplicarte un strike a vos mismo.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        const strike = await aplicarStrike(interaction.guildId, target.id, {
            regulacion: NOMBRES_REG[regulacion] || regulacion,
            motivo,
            aplicadoPor: interaction.user.id
        });

        const activos = await obtenerStrikesActivos(interaction.guildId, target.id);
        const totalActivos = activos.length;

        const embed = new EmbedBuilder()
            .setColor(totalActivos >= 3 ? '#992d22' : '#ed4245')
            .setTitle('⚠️ Strike aplicado')
            .setDescription(
                `• **Usuario:** <@${target.id}>\n` +
                `• **ID de Strike:** \`${strike.id}\`\n` +
                `• **Regulación:** ${NOMBRES_REG[regulacion] || regulacion}\n` +
                `• **Motivo:** ${motivo}\n` +
                `• **Aplicado por:** <@${interaction.user.id}>\n` +
                `• **Strikes activos:** \`${totalActivos}\`` +
                (totalActivos >= 3
                    ? '\n\n🚨 **Atención:** Este usuario tiene **3 o más strikes activos**. Considerá una sanción mayor (mute/ban).'
                    : '')
            )
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setFooter({
                text: '00Y4n Comunidad SWFL • Sistema de Moderación',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Log
        const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);
        if (logsChannel) {
            await logsChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ed4245')
                        .setTitle('⚠️ Strike de Comunidad')
                        .setDescription(
                            `> **Usuario:** <@${target.id}> (\`${target.id}\`)\n` +
                            `> **ID:** \`${strike.id}\`\n` +
                            `> **Regulación:** ${NOMBRES_REG[regulacion] || regulacion}\n` +
                            `> **Motivo:** ${motivo}\n` +
                            `> **Moderador:** <@${interaction.user.id}>\n` +
                            `> **Activos:** \`${totalActivos}\``
                        )
                        .setTimestamp()
                ]
            });
        }

        // DM al sancionado
        try {
            await target.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ed4245')
                        .setTitle('⚠️ Recibiste un Strike')
                        .setDescription(
                            `Se te aplicó un **strike** en **${interaction.guild.name}**.\n\n` +
                            `• **Regulación:** ${NOMBRES_REG[regulacion] || regulacion}\n` +
                            `• **Motivo:** ${motivo}\n` +
                            `• **ID:** \`${strike.id}\`\n` +
                            `• **Strikes activos:** \`${totalActivos}\``
                        )
                        .setFooter({ text: '00Y4n Comunidad SWFL' })
                        .setTimestamp()
                ]
            });
        } catch {
            // DMs cerrados
        }
    }
};
