import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('forzar-cierre')
        .setDescription('Finaliza forzosamente una sesión por decisión del Alto Mando.')
        .addUserOption(option =>
            option.setName('host')
                .setDescription('El usuario que estaba hosteando la sesión.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Razón por la cual se cancela la sesión (ej: Requiere capacitación previa).')
                .setRequired(true)),

    async execute(interaction) {
        // ID del rol Alto Comando
        const ROL_ALTO_MANDO_ID = '1528870731629465752';

        // Comprobar si el usuario que ejecuta el comando posee el rol de Alto Comando
        if (!interaction.member.roles.cache.has(ROL_ALTO_MANDO_ID)) {
            return await interaction.reply({
                content: '❌ **Acceso denegado.** Este comando es exclusivo para los integrantes del **Alto Mando**.',
                ephemeral: true
            });
        }

        const hostUsuario = interaction.options.getUser('host');
        const motivoCancelacion = interaction.options.getString('motivo');

        // Diseñar el Embed con el estilo 00Y4n (#74d4fc)
        const embedCierreForzado = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('⚠️ Sesión Finalizada Forzosamente')
            .setDescription(
                `La sesión organizada por <@${hostUsuario.id}> fue cancelada por un integrante del **Alto Mando** (<@${interaction.user.id}>).\n\n` +
                `📌 **Motivo:** ${motivoCancelacion}\n\n` +
                `ℹ️ *No se registraron penalizaciones en el historial ni en el perfil del Staff.*`
            )
            .setFooter({ 
                text: '00Y4n Comunidad SWFL • Control de Alto Mando', 
                iconURL: interaction.guild.iconURL() 
            })
            .setTimestamp();

        // Enviar solo el Embed de forma silenciosa (sin ping a nadie)
        await interaction.reply({
            embeds: [embedCierreForzado],
            allowedMentions: { parse: [] } // Bloquea cualquier tipo de mención
        });
    },
};
