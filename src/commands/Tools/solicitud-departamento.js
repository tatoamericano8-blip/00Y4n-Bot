import {
    SlashCommandBuilder,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} from 'discord.js';

const CANAL_FORMULARIOS = '1532865290529145043';

const DEPARTAMENTOS = {
    bomberos: {
        nombre: 'Servicio de Bomberos y Rescate de Bonita Springs',
        emoji: '🚒',
        color: '#e74c3c',
        requierePase: false,
        escenario:
            'Incendio residencial en Bonita Springs con humo denso y posibles víctimas en el 2° piso. ¿Cómo priorizás y actuás al llegar?'
    },
    sem: {
        nombre: 'Servicios de Emergencias Médicas',
        emoji: '🚑',
        color: '#3498db',
        requierePase: false,
        escenario:
            'Paciente inconsciente, respiración irregular y familiares en pánico. ¿Cómo priorizás la atención y controlás la escena?'
    },
    policia: {
        nombre: 'Departamento Policial del Condado de Sarasota',
        emoji: '👮',
        color: '#2c3e50',
        requierePase: false,
        escenario:
            'Persecución vehicular en la I-75: el sospechoso no se detiene y hay tráfico. ¿Cómo procedés de forma segura?'
    },
    sheriff: {
        nombre: 'Oficina del Sheriff del Condado de Sarasota',
        emoji: '⭐',
        color: '#f1c40f',
        requierePase: true,
        escenario:
            'Violencia doméstica con gritos y posible arma en la escena. ¿Cómo manejás la situación paso a paso?'
    }
};

function crearModal(departamentoKey) {
    const dep = DEPARTAMENTOS[departamentoKey];

    const modal = new ModalBuilder()
        .setCustomId(`solicitud_depto:${departamentoKey}`)
        .setTitle(`${dep.emoji} Solicitud departamento`);

    const fortalezas = new TextInputBuilder()
        .setCustomId('fortalezas')
        .setLabel('Fortalezas y debilidades')
        .setPlaceholder('¿Cuáles son tus fortalezas y debilidades? ¿Cómo influirán en el depto?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

    const elegirte = new TextInputBuilder()
        .setCustomId('elegirte')
        .setLabel('¿Por qué deberías ser elegido?')
        .setPlaceholder('¿Por qué deberías ser elegido por encima de otros postulantes?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

    const ofrecer = new TextInputBuilder()
        .setCustomId('ofrecer')
        .setLabel('¿Qué podés aportar al departamento?')
        .setPlaceholder('¿Qué podés ofrecer al departamento?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

    const presion = new TextInputBuilder()
        .setCustomId('presion')
        .setLabel('Calma bajo presión')
        .setPlaceholder('Describí una situación en la que tuviste que mantener la calma bajo presión.')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

    const escenario = new TextInputBuilder()
        .setCustomId('escenario')
        .setLabel('Escenario de emergencia')
        .setPlaceholder(dep.escenario.slice(0, 100))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

    modal.addComponents(
        new ActionRowBuilder().addComponents(fortalezas),
        new ActionRowBuilder().addComponents(elegirte),
        new ActionRowBuilder().addComponents(ofrecer),
        new ActionRowBuilder().addComponents(presion),
        new ActionRowBuilder().addComponents(escenario)
    );

    return modal;
}

export default {
    data: new SlashCommandBuilder()
        .setName('solicitud-departamento')
        .setDescription('Postulate a un departamento de servicios públicos de SWFL.')
        .addStringOption(opt =>
            opt.setName('departamento')
                .setDescription('Departamento al que querés postularte.')
                .setRequired(true)
                .addChoices(
                    { name: '🚒 Bomberos y Rescate – Bonita Springs', value: 'bomberos' },
                    { name: '🚑 Servicios de Emergencias Médicas', value: 'sem' },
                    { name: '👮 Policía del Condado de Sarasota', value: 'policia' },
                    { name: '⭐ Sheriff del Condado de Sarasota (requiere pase)', value: 'sheriff' }
                )
        ),

    async execute(interaction) {
        const departamentoKey = interaction.options.getString('departamento');
        const dep = DEPARTAMENTOS[departamentoKey];

        if (!dep) {
            return interaction.reply({
                content: '❌ Departamento inválido.',
                ephemeral: true
            });
        }

        // ─── SHERIFF: aviso obligatorio del pase de Robux ───
        if (dep.requierePase) {
            const embedAviso = new EmbedBuilder()
                .setColor('#f1c40f')
                .setTitle('⭐ Oficina del Sheriff – Requisito obligatorio')
                .setDescription(
                    `Para postularte a la **Oficina del Sheriff del Condado de Sarasota** necesitás el **pase de Robux** del juego Southwest Florida.\n\n` +
                    `⚠️ Si **no tenés** el pase, **no completes** este formulario.\n\n` +
                    `¿Confirmás que tenés el pase de Robux del Sheriff?`
                )
                .setFooter({
                    text: '00Y4n Comunidad SWFL • Solicitudes de Departamentos',
                    iconURL: interaction.guild.iconURL()
                });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`sheriff_si_${interaction.user.id}`)
                    .setLabel('Sí, tengo el pase')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`sheriff_no_${interaction.user.id}`)
                    .setLabel('No tengo el pase')
                    .setStyle(ButtonStyle.Danger)
            );

            const msg = await interaction.reply({
                embeds: [embedAviso],
                components: [row],
                ephemeral: true,
                fetchReply: true
            });

            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60_000
            });

            collector.on('collect', async (btn) => {
                if (btn.user.id !== interaction.user.id) {
                    return btn.reply({
                        content: '❌ Solo quien ejecutó el comando puede responder.',
                        ephemeral: true
                    });
                }

                if (btn.customId.startsWith('sheriff_no_')) {
                    collector.stop();
                    return btn.update({
                        content: '❌ Solicitud cancelada. Necesitás el pase de Robux del Sheriff para postularte.',
                        embeds: [],
                        components: []
                    });
                }

                if (btn.customId.startsWith('sheriff_si_')) {
                    collector.stop();
                    await btn.showModal(crearModal('sheriff'));
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    try {
                        await interaction.editReply({
                            content: '⏱️ Tiempo agotado. Volvé a usar el comando si querés postularte.',
                            embeds: [],
                            components: []
                        });
                    } catch {}
                }
            });

            return;
        }

        // ─── Resto de departamentos: modal directo ───
        await interaction.showModal(crearModal(departamentoKey));
    },
};
