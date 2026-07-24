import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Licencia from '../../../models/Licencia.js'; // Ajusta la ruta a tu modelo

// ⚙️ COLOCA AQUÍ EL ID DEL ROL DE POLICÍA DE TU SERVIDOR
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
        // 🔒 Verificación de Rol de Policía
        const tieneRolPolicia = interaction.member.roles.cache.has(ROL_POLICIA_ID);
        
        if (!tieneRolPolicia && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const embedSinPermiso = new EmbedBuilder()
                .setTitle('❌ ACCESO DENEGADO')
                .setDescription('Solo el personal autorizado del **Departamento de Policía** puede gestionar las licencias de conducir.')
                .setColor('#ff3333');

            return await interaction.reply({ embeds: [embedSinPermiso], ephemeral: true });
        }

        const usuario = interaction.options.getUser('usuario');
        const nuevoEstado = interaction.options.getString('estado');
        const motivo = interaction.options.getString('motivo') || 'Sin motivo especificado.';

        // Actualizamos o creamos el registro de la licencia en MongoDB
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

        // Formato del mensaje de confirmación
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
            .setTitle('📑 Actualización de Licencia de Conducir')
            .setDescription(
                `Se ha actualizado la documentación del ciudadano <@${usuario.id}>.\n\n` +
                `• **Estado Actual:** ${emojiEstado} **${nuevoEstado.toUpperCase()}**\n` +
                `• **Oficial a Cargo:** <@${interaction.user.id}>\n` +
                `• **Motivo/Observación:** ${motivo}`
            )
            .setColor(colorEmbed)
            .setFooter({ text: 'Sistema de Tránsito & Control Policial' })
            .setTimestamp();

        await interaction.reply({ embeds: [embedRespuesta] });
    }
};
