import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getFromDb, setInDb } from '../../utils/database.js';

export default {
    data: {
        name: 'anunciar_boost',
        description: 'Lanza un anuncio agradeciendo a un usuario por mejorar (boostear) el servidor.',
        options: [
            {
                name: 'usuario',
                description: 'El usuario que mejoró el servidor.',
                type: ApplicationCommandOptionType.User,
                required: true
            },
            {
                name: 'cantidad',
                description: 'Cantidad de mejoras de ESTA acción (1, 2…). Se suma al total histórico.',
                type: ApplicationCommandOptionType.Integer,
                required: false,
                min_value: 1,
                max_value: 20
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return await interaction.reply({
                content: '❌ **No tienes permisos:** Solo Staff con Gestionar servidor.',
                ephemeral: true
            });
        }

        const usuarioMencionado = interaction.options.getUser('usuario');
        const cantidadBoosts = interaction.options.getInteger('cantidad') || 1;

        const key = `boosts:${interaction.guildId}:${usuarioMencionado.id}`;
        const prev = Number(await getFromDb(key, 0)) || 0;
        const totalBoosts = prev + cantidadBoosts;
        await setInDb(key, totalBoosts);

        const embedBoost = new EmbedBuilder()
            .setTitle(`<a:soad:1523026183028084768> 00Y4n SWFL | Notificación de Mejora <a:soad:1523026183028084768>`)
            .setDescription(
                `¡Gracias, <@${usuarioMencionado.id}>! <a:cora:1523026545340449002>\n\n` +
                `<a:si:1523027371735777503> ¡Has mejorado el servidor **${totalBoosts} ${totalBoosts === 1 ? 'vez' : 'veces'}**! Lo apreciamos muchísimo. ` +
                `Tu mejora ha sido registrada dentro de 00Y4n SWFL, ¡y se han aplicado automáticamente tus beneficios de Booster según el total de mejoras!\n\n` +
                `<:afa:1523028004983406787> *¿Tienes algún problema o te falta algún beneficio? ¡No dudes en abrir un ticket de asistencia si necesitas soporte adicional!*`
            )
            .setColor('#74d4fc')
            .setThumbnail(usuarioMencionado.displayAvatarURL({ dynamic: true, size: 512 }))
            .setFooter({ text: '00Y4n SWFL™', iconURL: interaction.guild.iconURL() });

        await interaction.reply({ content: `✅ Anuncio enviado. Total histórico: **${totalBoosts}**.`, ephemeral: true });

        await interaction.channel.send({
            content: `> __**¡Miren quién acaba de mejorar el servidor! <@${usuarioMencionado.id}> 🎉**__`,
            embeds: [embedBoost]
        });
    }
};
