import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import Licencia from '../../../models/Licencia.js'; // Ajusta la ruta a tu modelo

// 👮 ID DEL ROL DE POLICÍA
const ROL_POLICIA_ID = '1529146302783422706';

export default {
    data: {
        name: 'licencia_swfl',
        description: 'Gestión policial: Cambia el estado de la licencia de conducir de un ciudadano.',
        options: [
            {
                name: 'usuario',
                description: 'Ciudadano al que se le gestionará la licencia.',
                type: ApplicationCommandOptionType.User,
                required: true
            },
            {
                name: 'estado',
                description: 'Nuevo estado de la licencia.',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: '🟢 Activa', value: 'Activa' },
                    { name: '🟡 Suspendida', value: 'Suspendida' },
                    { name: '🔴 Revocada', value: 'Revocada' }
                ]
            },
            {
                name: 'motivo',
                description: 'Razón del cambio de estado (opcional).',
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    },

    async execute(interaction) {
        // 🔒 VERIFICACIÓN EXCLUSIVA: ¿Tiene el rol de Policía especificado?
        const tieneRolPolicia = interaction.member.roles.cache.has(ROL_POLICIA_ID);
        
        if (!tieneRolPolicia) {
            const embedSinPermiso = new EmbedBuilder()
                .setTitle('❌ ACCESO DENEGADO')
                .setDescription('Este comando está reservado únicamente para el personal que posea el rol del **Departamento de Policía**.')
                .setColor('#ff3333');

            return await interaction.reply({ embeds: [embedSinPermiso], ephemeral: true });
        }

        const usuario = interaction.options.getUser('usuario');
        const nuevoEstado = interaction.options.getString('estado');
        const motivo = interaction.options.getString('motivo') || 'Sin motivo especificado.';

        // Guardar/Actualizar en MongoDB
        await Licencia.findOneAndUpdate(
            { usuario_id: usuario.id },
            { 
                estado: nuevoEstado, 
                oficial_id: interaction.user.id, 
                motivo: motivo,
                fecha: new Date()
            },
            { upsert: true, new: true }
        );

        // Estilos según el estado asignado
        let emojiEstado = '🟢';
        let colorEmbed = '#57f287';

        if (nuevoEstado === 'Suspendida') {
            emojiEstado = '🟡';
            colorEmbed = '#fee75c';
        } else if (nuevoEstado === 'Revocada') {
            emojiEstado = '🔴';
            colorEmbed = '#ed4245';
        }

        const embedRespuesta = new EmbedBuilder()
            .setTitle('<:lista:1534938422202994755> Actualización de Licencia de Conducir')
            .setDescription(
                `Se ha actualizado la documentación del ciudadano <@${usuario.id}>.\n\n` +
                `• **Nuevo Estado:** ${emojiEstado} **${nuevoEstado.toUpperCase()}**\n` +
                `• **Oficial a Cargo:** <@${interaction.user.id}>\n` +
                `• **Motivo/Observación:** ${motivo}`
            )
            .setColor(colorEmbed)
            .setFooter({ text: 'Sistema de Tránsito & Control Policial' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedRespuesta] });
    }
};
