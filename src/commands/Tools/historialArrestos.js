import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { obtenerArrestosPorUsuario, contarArrestosActivos } from '../../utils/gestorArrestos.js';

export default {
    data: new SlashCommandBuilder()
        .setName('historial-arrestos')
        .setDescription('Consulta el historial de arrestos de un ciudadano (Exclusivo Policía).')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Ciudadano del que quieres ver el historial.')
                .setRequired(true)),

    async execute(interaction) {
        const ROL_POLICIA_ID = '1529146302783422706';

        if (!interaction.member.roles.cache.has(ROL_POLICIA_ID)) {
            return await interaction.reply({
                content: '❌ **Acceso denegado.** Solo los oficiales del **Departamento Policial del Condado de Sarasota** pueden consultar historiales.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const ciudadano = interaction.options.getUser('usuario');
        const arrestos = await obtenerArrestosPorUsuario(ciudadano.id);
        const activos = await contarArrestosActivos(ciudadano.id);

        if (arrestos.length === 0) {
            return await interaction.editReply({
                content: `✅ **${ciudadano.tag}** no tiene arrestos registrados en el sistema.`
            });
        }

        const mostrar = arrestos.slice(0, 10);

        const lista = mostrar.map(a => {
            const fecha = new Date(a.fecha).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const estadoEmoji = a.estado === 'ACTIVO' ? '🔴' : '🟢';
            const estadoTexto = a.estado === 'ACTIVO' ? 'ACTIVO' : 'ANULADO';

            return (
                `${estadoEmoji} **ID \`${a.id}\`** — ${estadoTexto}\n` +
                `> **Motivo:** ${a.motivo}\n` +
                `> **Oficial:** <@${a.oficialId}>\n` +
                `> **Fecha:** ${fecha}` +
                (a.estado === 'ANULADO' ? `\n> **Anulado por:** <@${a.anuladoPor}> | Motivo: ${a.motivoAnulacion}` : '')
            );
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor(activos > 0 ? '#ed4245' : '#57f287')
            .setTitle('<:folder:1523041295868756008> Historial de Arrestos')
            .setDescription(
                `**Ciudadano:** <@${ciudadano.id}> (\`${ciudadano.id}\`)\n` +
                `**Arrestos activos:** \`${activos}\`\n` +
                `**Total registrados:** \`${arrestos.length}\`\n\n` +
                `────────────────────────\n\n` +
                lista +
                (arrestos.length > 10 ? `\n\n*Se muestran los 10 más recientes de ${arrestos.length} totales.*` : '')
            )
            .setFooter({
                text: '00Y4n Comunidad SWFL • Departamento Policial de Sarasota',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
