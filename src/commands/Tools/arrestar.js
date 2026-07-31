import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { generarIDArresto, guardarArresto } from '../../utils/gestorArrestos.js';

export default {
    data: new SlashCommandBuilder()
        .setName('arrestar')
        .setDescription('Registra un arresto oficial (Exclusivo Policía de Sarasota).')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El ciudadano que será arrestado.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo / delito del arresto.')
                .setRequired(true)),

    async execute(interaction) {
        const ROL_POLICIA_ID = '1529146302783422706';
        const CHANNEL_LOGS = '1529175493029531738';

        if (!interaction.member.roles.cache.has(ROL_POLICIA_ID)) {
            return await interaction.reply({
                content: '❌ **Acceso denegado.** Solo los oficiales del **Departamento Policial del Condado de Sarasota** pueden registrar arrestos.',
                ephemeral: true
            });
        }

        const ciudadano = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo');
        const arrestoID = await generarIDArresto();

        const datosArresto = {
            id: arrestoID,
            usuarioId: ciudadano.id,
            oficialId: interaction.user.id,
            motivo: motivo,
            estado: 'ACTIVO',
            fecha: new Date().toISOString()
        };

        await guardarArresto(arrestoID, datosArresto);

        // Embed público
        const embedArresto = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<:folder:1523041295868756008> Arresto Registrado')
            .setDescription(
                `• **Ciudadano -** <@${ciudadano.id}>\n` +
                `• **Oficial -** <@${interaction.user.id}>\n` +
                `• **Motivo -** ${motivo}\n` +
                `• **ID Arresto -** \`${arrestoID}\`\n\n` +
                `*El arresto ha sido registrado en el sistema policial.*`
            )
            .setFooter({
                text: '00Y4n Comunidad SWFL • Departamento Policial de Sarasota',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({
            content: `🚨 **Atención <@${ciudadano.id}>, has sido arrestado oficialmente:**`,
            embeds: [embedArresto],
            allowedMentions: { users: [ciudadano.id] }
        });

        // Log en canal policial
        const logsChannel = interaction.guild.channels.cache.get(CHANNEL_LOGS);
        if (logsChannel) {
            const embedLog = new EmbedBuilder()
                .setColor('#ed4245')
                .setTitle('<:folder:1523041295868756008> Nuevo Arresto Registrado')
                .setDescription(
                    `> **Ciudadano:** <@${ciudadano.id}>\n` +
                    `> **Oficial:** <@${interaction.user.id}>\n` +
                    `> **Motivo:** ${motivo}\n` +
                    `> **ID:** \`${arrestoID}\``
                )
                .setTimestamp();

            await logsChannel.send({ embeds: [embedLog] });
        }

        // DM al ciudadano (opcional)
        try {
            const embedDM = new EmbedBuilder()
                .setColor('#ff3333')
                .setTitle('<:folder:1523041295868756008> Notificación de Arresto')
                .setDescription(
                    `Has sido arrestado en **${interaction.guild.name}**.\n\n` +
                    `• **Motivo:** ${motivo}\n` +
                    `• **Oficial:** <@${interaction.user.id}>\n` +
                    `• **ID Arresto:** \`${arrestoID}\``
                )
                .setFooter({ text: 'Departamento Policial de Sarasota' })
                .setTimestamp();

            await ciudadano.send({ embeds: [embedDM] });
        } catch (error) {
            console.log(`No se le pudo enviar el DM a ${ciudadano.tag}`);
        }
    },
};
