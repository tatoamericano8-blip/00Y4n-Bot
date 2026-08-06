import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('orden')
        .setDescription('Gestiona las Órdenes de Arresto (Exclusivo Policía de Sarasota).')
        .addSubcommand(sub =>
            sub.setName('emitir')
                .setDescription('Emite una Orden de Arresto a un ciudadano.')
                .addUserOption(opt =>
                    opt.setName('usuario')
                        .setDescription('El ciudadano que recibirá la Orden de Arresto.')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('motivo')
                        .setDescription('Motivo de la Orden de Arresto.')
                        .setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('remover')
                .setDescription('Remueve la Orden de Arresto de un ciudadano.')
                .addUserOption(opt =>
                    opt.setName('usuario')
                        .setDescription('El ciudadano al que se le removerá la Orden de Arresto.')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('motivo')
                        .setDescription('Motivo de la remoción.')
                        .setRequired(true))
        ),

    async execute(interaction) {
        const ROL_POLICIA_ID = '1529146302783422706';
        const ROL_WARRANT_ID = '1529152491545952316';
        const CHANNEL_LOGS = '1529175493029531738';

        // Solo policía
        if (!interaction.member.roles.cache.has(ROL_POLICIA_ID)) {
            return await interaction.reply({
                content: '❌ **Acceso denegado.** Solo los oficiales del **Departamento Policial del Condado de Sarasota** pueden gestionar Órdenes de Arresto.',
                ephemeral: true
            });
        }

        const sub = interaction.options.getSubcommand();
        const ciudadano = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo');

        const miembro = await interaction.guild.members.fetch(ciudadano.id).catch(() => null);

        if (!miembro) {
            return await interaction.reply({
                content: '❌ No se pudo encontrar a ese usuario en el servidor.',
                ephemeral: true
            });
        }

        const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);

        // ─── EMITIR ───
        if (sub === 'emitir') {
            if (miembro.roles.cache.has(ROL_WARRANT_ID)) {
                return await interaction.reply({
                    content: `❌ **${ciudadano.tag}** ya tiene una Orden de Arresto activa.`,
                    ephemeral: true
                });
            }

            try {
                await miembro.roles.add(ROL_WARRANT_ID);
            } catch (error) {
                console.error('Error al emitir Orden de Arresto:', error);
                return await interaction.reply({
                    content: '❌ No pude asignar el rol. Verificá que el bot tenga permisos para gestionar roles y que el rol esté por debajo del rol del bot.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#ed4245')
                .setTitle('<:skirojo:1534988636460683385> Orden de Arresto Emitida')
                .setDescription(
                    `• **Ciudadano -** <@${ciudadano.id}>\n` +
                    `• **Emitida por -** <@${interaction.user.id}>\n` +
                    `• **Motivo -** ${motivo}`
                )
                .setFooter({
                    text: '00Y4n Comunidad SWFL • Departamento Policial de Sarasota',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            await interaction.reply({
                content: `🚨 **Atención <@${ciudadano.id}>, se te ha emitido una Orden de Arresto:**`,
                embeds: [embed],
                allowedMentions: { users: [ciudadano.id] }
            });

            if (logsChannel) {
                await logsChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#ed4245')
                            .setTitle('<:skirojo:1534988636460683385> Orden de Arresto Emitida')
                            .setDescription(
                                `> **Ciudadano:** <@${ciudadano.id}>\n` +
                                `> **Emitida por:** <@${interaction.user.id}>\n` +
                                `> **Motivo:** ${motivo}`
                            )
                            .setTimestamp()
                    ]
                });
            }

            // DM al ciudadano
            try {
                const embedDM = new EmbedBuilder()
                    .setColor('#74d4fc')
                    .setTitle('<:skirojo:1534988636460683385> Orden de Arresto')
                    .setDescription(
                        `Se te ha emitido una **Orden de Arresto** en **${interaction.guild.name}**.\n\n` +
                        `• **Motivo:** ${motivo}\n` +
                        `• **Oficial:** <@${interaction.user.id}>`
                    )
                    .setFooter({ text: 'Departamento Policial de Sarasota' })
                    .setTimestamp();

                await ciudadano.send({ embeds: [embedDM] });
            } catch {
                console.log(`No se le pudo enviar el DM a ${ciudadano.tag}`);
            }

            return;
        }

        // ─── REMOVER ───
        if (sub === 'remover') {
            if (!miembro.roles.cache.has(ROL_WARRANT_ID)) {
                return await interaction.reply({
                    content: `❌ **${ciudadano.tag}** no tiene una Orden de Arresto activa.`,
                    ephemeral: true
                });
            }

            try {
                await miembro.roles.remove(ROL_WARRANT_ID);
            } catch (error) {
                console.error('Error al remover Orden de Arresto:', error);
                return await interaction.reply({
                    content: '❌ No pude remover el rol. Verificá que el bot tenga permisos para gestionar roles y que el rol esté por debajo del rol del bot.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#74d4fc')
                .setTitle('<:folder:1523041295868756008> Orden de Arresto Removida')
                .setDescription(
                    `• **Ciudadano -** <@${ciudadano.id}>\n` +
                    `• **Removida por -** <@${interaction.user.id}>\n` +
                    `• **Motivo -** ${motivo}`
                )
                .setFooter({
                    text: '00Y4n Comunidad SWFL • Departamento Policial de Sarasota',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            if (logsChannel) {
                await logsChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#57f287')
                            .setTitle('<:folder:1534938334650962115> Orden de Arresto Removida')
                            .setDescription(
                                `> **Ciudadano:** <@${ciudadano.id}>\n` +
                                `> **Removida por:** <@${interaction.user.id}>\n` +
                                `> **Motivo:** ${motivo}`
                            )
                            .setTimestamp()
                    ]
                });
            }
        }
    },
};
