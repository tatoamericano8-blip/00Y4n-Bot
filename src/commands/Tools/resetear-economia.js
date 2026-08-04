import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { resetearTodaLaEconomia } from '../../utils/gestorEconomia.js';

export default {
    data: new SlashCommandBuilder()
        .setName('resetear-economia')
        .setDescription('Reinicia la economía de todos los ciudadanos a $0 (Exclusivo Gerente de Staff).'),

    async execute(interaction) {
        const ROL_GERENTE_STAFF = '1452684893850177587';

        if (!interaction.member.roles.cache.has(ROL_GERENTE_STAFF)) {
            return await interaction.reply({
                content: '❌ **Acceso denegado.** Este comando es exclusivo del rol **Gerente de Staff**.',
                flags: MessageFlags.Ephemeral
            });
        }

        const embedConfirmacion = new EmbedBuilder()
            .setColor('#ff4b4b')
            .setTitle('⚠️ ADVERTENCIA: REINICIO TOTAL DE ECONOMÍA')
            .setDescription(
                '**¿Estás completamente seguro de que deseas reiniciar toda la economía del servidor?**\n\n' +
                '• Se borrarán **todos los saldos** de los ciudadanos.\n' +
                '• Todas las cuentas bancarias volverán a **$0**.\n' +
                '• **Esta acción es irreversible.**'
            )
            .setFooter({
                text: `${interaction.guild.name} • Sistema de Seguridad Económica`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            })
            .setTimestamp();

        const filaBotones = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirmar_reset_economia')
                .setLabel('Sí, reiniciar todo')
                .setEmoji('⚠️')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancelar_reset_economia')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        const respuesta = await interaction.reply({
            embeds: [embedConfirmacion],
            components: [filaBotones],
            fetchReply: true
        });

        const collector = respuesta.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 30000,
            max: 1
        });

        collector.on('collect', async (i) => {
            try {
                if (i.customId === 'confirmar_reset_economia') {
                    await i.deferUpdate();
                    await resetearTodaLaEconomia();

                    const embedExito = new EmbedBuilder()
                        .setColor('#00ff7f')
                        .setTitle('💥 Economía Reiniciada Exitosamente')
                        .setDescription(
                            '✅ **Toda la economía del servidor ha sido restablecida.**\n\n' +
                            '• Todos los saldos de los ciudadanos han vuelto a **$0**.\n' +
                            `• Operación autorizada y ejecutada por: <@${interaction.user.id}>`
                        )
                        .setFooter({
                            text: `${interaction.guild.name} • Auditoría Económica`,
                            iconURL: interaction.guild.iconURL({ dynamic: true })
                        })
                        .setTimestamp();

                    await interaction.editReply({
                        embeds: [embedExito],
                        components: []
                    });
                } else if (i.customId === 'cancelar_reset_economia') {
                    await i.update({
                        content: '❌ **Operación cancelada.** La economía no ha sufrido ningún cambio.',
                        embeds: [],
                        components: []
                    });
                }
            } catch (error) {
                console.error('Error procesando el reset de economía:', error);
                await interaction.editReply({
                    content: '❌ Ocurrió un error al intentar reiniciar la economía en la base de datos.',
                    embeds: [],
                    components: []
                }).catch(() => {});
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                await interaction.editReply({
                    content: '⏰ **Tiempo agotado.** El reinicio de la economía fue cancelado por inactividad.',
                    embeds: [],
                    components: []
                }).catch(() => {});
            }
        });
    },
};
