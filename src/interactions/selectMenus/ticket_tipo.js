import { EmbedBuilder, MessageFlags } from 'discord.js';
import { createTicket } from '../../services/ticket.js';
import { logger } from '../../utils/logger.js';

const COLOR = 0xfb8b66;
const ROLE_STAFF = '1512120103771050005';

const TIPOS = {
    soporte_general: {
        label: 'Soporte general',
        reason: 'Soporte general — dudas, reglas, sesiones, economía, perks',
        instrucciones:
            '**Qué incluir:**\n' +
            '• Tu duda o problema con el mayor detalle posible\n' +
            '• Capturas si aplica\n' +
            '• Horario en que ocurrió (si es un bug o incidente)\n\n' +
            'Un staff te responderá lo antes posible.'
    },
    reportar_miembro: {
        label: 'Reportar miembro',
        reason: 'Reportar miembro (ciudadano)',
        instrucciones:
            '**Qué incluir (obligatorio):**\n' +
            '• Usuario reportado (mención o ID)\n' +
            '• Qué reglas rompió\n' +
            '• Pruebas: capturas / clips / hora aproximada\n' +
            '• Canal o sesión donde pasó\n\n' +
            'Sin pruebas es más difícil actuar.'
    },
    reportar_staff: {
        label: 'Reportar staff o host',
        reason: 'Reportar staff o host',
        instrucciones:
            '**Qué incluir (obligatorio):**\n' +
            '• Staff/host reportado (mención o ID)\n' +
            '• Qué hizo mal (abuso, incumplimiento, etc.)\n' +
            '• Pruebas: capturas / clips\n' +
            '• Fecha y contexto\n\n' +
            'La revisión es interna y seria. No uses esto para pelear en público.'
    },
    app_fotografo: {
        label: 'Aplicación fotógrafo',
        reason: 'Aplicación — Fotógrafo',
        instrucciones:
            '**Qué incluir:**\n' +
            '• Tu experiencia en fotografía\n' +
            '• Ejemplos de tu trabajo (links o adjuntos)\n' +
            '• Disponibilidad aproximada\n\n' +
            'Las postulaciones se revisan según necesidad del servidor.'
    },
    app_videografo: {
        label: 'Aplicación videógrafo',
        reason: 'Aplicación — Videógrafo',
        instrucciones:
            '**Qué incluir:**\n' +
            '• Tu experiencia en videografía / edición\n' +
            '• Ejemplos de tu trabajo (links o adjuntos)\n' +
            '• Disponibilidad aproximada\n\n' +
            'Las postulaciones se revisan según necesidad del servidor.'
    },
    staff_fastpass: {
        label: 'Staff FastPass',
        reason: 'Staff FastPass — postulación prioritaria',
        instrucciones:
            '**Requisito:** experiencia en un servidor de **más de 1.000 miembros**.\n\n' +
            '**Qué incluir (obligatorio):**\n' +
            '• Nombre del servidor y approx. de miembros\n' +
            '• Prueba (captura de roles / miembros / staff)\n' +
            '• Experiencia breve (moderación, host, etc.)\n' +
            '• Por qué querés staff en 00Y4n\n\n' +
            'Sin prueba válida este ticket puede cerrarse.'
    }
};

export default {
    name: 'ticket_tipo',

    async execute(interaction, client, args = []) {
        const tipoKey = interaction.values?.[0];
        const tipo = TIPOS[tipoKey];

        if (!tipo) {
            return interaction.reply({
                content: '<:cruz00y4n:1534937767652495360> Tipo de ticket inválido.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            await interaction.guild.channels.fetch();
            await interaction.guild.roles.fetch();
        } catch {}

        const categoryId = args?.[0] && args[0] !== 'auto' ? args[0] : null;

        try {
            const result = await createTicket(
                interaction.guild,
                interaction.member,
                categoryId,
                tipo.reason,
                'none'
            );

            if (!result.success) {
                return interaction.editReply({
                    content: `<:cruz00y4n:1534937767652495360> ${result.error || 'No se pudo crear el ticket.'}`
                });
            }

            const channel = result.channel;

            const embedTipo = new EmbedBuilder()
                .setColor(COLOR)
                .setTitle(`Ticket — ${tipo.label}`)
                .setDescription(
                    `Hola <@${interaction.user.id}>, gracias por abrir un ticket.\n\n` +
                        tipo.instrucciones +
                        `\n\n-# El staff fue notificado. Respondé acá; no abras otro ticket por lo mismo.`
                )
                .setFooter({ text: 'Southwest Florida Comunidad 00Y4n ™' })
                .setTimestamp();

            let mention = '';
            if (interaction.guild.roles.cache.has(ROLE_STAFF)) {
                mention = ` <@&${ROLE_STAFF}>`;
            }

            await channel.send({
                content: mention || undefined,
                embeds: [embedTipo]
            });

            return interaction.editReply({
                content: `<:tilde:1534937809733812286> Ticket creado: ${channel}`
            });
        } catch (err) {
            logger.error('[ticket_tipo] Error:', err);
            return interaction.editReply({
                content: `<:cruz00y4n:1534937767652495360> Error al crear el ticket: ${err?.message || 'desconocido'}`
            });
        }
    }
};
