import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('reinvitaciones')
        .setDescription('Envía el aviso de enlace de sesión regenerado y control de reinvitaciones.')
        .addIntegerOption(option =>
            option.setName('reacciones')
                .setDescription('Cantidad de reacciones requeridas para habilitar las reinvitaciones.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('El emoji con el que reaccionará el bot (por defecto: ✔️).')
                .setRequired(false)),

    async execute(interaction) {
        const reaccionesRequeridas = interaction.options.getInteger('reacciones');
        const emojiInput = interaction.options.getString('emoji') || '✔️';

        // Obtener la hora actual de Argentina (HH:MM)
        const ahora = new Date();
        const horaFormateada = ahora.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'America/Argentina/Buenos_Aires'
        });

        // Generar el timestamp dinámico de Discord
        const timestampDiscord = Math.floor(ahora.getTime() / 1000);

        // Diseñar el Embed con el estilo 00Y4n
        const embedReinvitacion = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<a:esp:1523026487240954019> Reinvitaciones de la Sesión <a:esp:1523026487240954019>')
            .setDescription(
                `¡Reaccioná a este mensaje para recibir una reinvitación!\n` +
                `Las mismas se enviarán una vez que el servidor cuente con menos jugadores activos.\n\n` +
                `<:dot:1523041306836996156> **Reacciones requeridas:** \`${reaccionesRequeridas}\``
            )
            .addFields({ 
                name: '<:fle:1523041359441952970> Última Regeneración', 
                value: `El enlace fue actualizado a las **${horaFormateada}** (<t:${timestampDiscord}:t>)`, 
                inline: false 
            })
            .setFooter({ text: '00Y4n Comunidad SWFL', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        // Enviar primero el ping @here fuera del embed
        const mensajeEnviado = await interaction.reply({
            content: '<a:adv:1523027438030946446> **@here** ¡Atención a las reinvitaciones!',
            embeds: [embedReinvitacion],
            allowedMentions: { parse: ['everyone'] }, // <-- AGREGÁ ESTA LÍNEA
            fetchReply: true
        });

        // Intentar colocar la reacción automática
        try {
            await mensajeEnviado.react(emojiInput);
        } catch (error) {
            console.error('No se pudo reaccionar con el emoji asignado:', error);
            if (emojiInput !== '✔️') {
                await mensajeEnviado.react('✔️');
            }
        }
    },
};
