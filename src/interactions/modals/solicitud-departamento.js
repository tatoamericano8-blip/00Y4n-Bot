import { EmbedBuilder } from 'discord.js';

const CANAL_FORMULARIOS = '1532865290529145043';

const DEPARTAMENTOS = {
    bomberos: {
        nombre: 'Servicio de Bomberos y Rescate de Bonita Springs',
        emoji: '🚒',
        color: '#e74c3c'
    },
    sem: {
        nombre: 'Servicios de Emergencias Médicas',
        emoji: '🚑',
        color: '#3498db'
    },
    policia: {
        nombre: 'Departamento Policial del Condado de Sarasota',
        emoji: '👮',
        color: '#2c3e50'
    },
    sheriff: {
        nombre: 'Oficina del Sheriff del Condado de Sarasota',
        emoji: '⭐',
        color: '#f1c40f'
    }
};

export default {
    name: 'solicitud_depto',
    async execute(interaction, client, args = []) {
        const departamentoKey = args[0] || interaction.customId.split(':')[1];
        const dep = DEPARTAMENTOS[departamentoKey];

        if (!dep) {
            return interaction.reply({
                content: '❌ Departamento no reconocido.',
                ephemeral: true
            });
        }

        const fortalezas = interaction.fields.getTextInputValue('fortalezas');
        const elegirte = interaction.fields.getTextInputValue('elegirte');
        const ofrecer = interaction.fields.getTextInputValue('ofrecer');
        const presion = interaction.fields.getTextInputValue('presion');
        const escenario = interaction.fields.getTextInputValue('escenario');

        const embed = new EmbedBuilder()
            .setColor(dep.color)
            .setTitle(`${dep.emoji} Nueva solicitud – ${dep.nombre}`)
            .setDescription(
                `**Postulante:** <@${interaction.user.id}>\n` +
                `**Usuario:** \`${interaction.user.tag}\`\n` +
                `**ID:** \`${interaction.user.id}\`\n` +
                `**Departamento:** ${dep.nombre}`
            )
            .addFields(
                { name: '💪 Fortalezas y debilidades', value: fortalezas.slice(0, 1024) },
                { name: '🎯 ¿Por qué deberías ser elegido?', value: elegirte.slice(0, 1024) },
                { name: '🤝 ¿Qué podés aportar?', value: ofrecer.slice(0, 1024) },
                { name: '😌 Calma bajo presión', value: presion.slice(0, 1024) },
                { name: '🚨 Escenario de emergencia', value: escenario.slice(0, 1024) }
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({
                text: '00Y4n Comunidad SWFL • Solicitudes de Departamentos',
                iconURL: interaction.guild?.iconURL()
            })
            .setTimestamp();

        const canal = interaction.guild.channels.cache.get(CANAL_FORMULARIOS);

        if (!canal) {
            return interaction.reply({
                content: '❌ No se encontró el canal de formularios. Avisá a un administrador.',
                ephemeral: true
            });
        }

        await canal.send({ embeds: [embed] });

        await interaction.reply({
            content:
                `✅ Tu solicitud para **${dep.nombre}** fue enviada correctamente.\n` +
                `El equipo la revisará pronto. ¡Éxitos!`,
            ephemeral: true
        });
    }
};
