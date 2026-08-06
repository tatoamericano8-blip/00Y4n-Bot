import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { generarIDMulta, guardarMulta, programarWarrant } from '../../utils/gestorMultas.js';

/** Opciones de infracción (máx. 25 en Discord). Name ≤ 100 caracteres. */
const OPCIONES_MULTA = [
    { name: '🏎️ Exceso Velocidad Clase A (1-15 MPH) — $500', value: 'Exceso de Velocidad Clase A (1-15 MPH sobre límite) [$500]' },
    { name: '🏎️ Exceso Velocidad Clase B (16-29 MPH) — $1.200', value: 'Exceso de Velocidad Clase B (16-29 MPH sobre límite) [$1.200]' },
    { name: '🏎️ Exceso Velocidad Clase C (30+ MPH) — $2.500', value: 'Exceso de Velocidad Clase C (30+ MPH sobre límite) [$2.500]' },
    { name: '🚦 Semáforo en rojo (§ 346.37) — $800', value: '§ 346.37 - Cruzar Semáforo en Rojo [$800]' },
    { name: '🛑 Ignorar señal de PARE — $600', value: 'Ignorar Señal de Stop [$600]' },
    { name: '⚠️ Conducción imprudente / temeraria — $2.000', value: 'Conducción Imprudente [$2.000]' },
    { name: '📄 Vehículo no registrado / sin patente — $1.000', value: '§ 341.04 - Vehículo No Registrado [$1.000]' },
    { name: '🪪 Conducir sin licencia — $1.500', value: 'Conducir Sin Licencia [$1.500]' },
    { name: '🚨 Huir de la escena (Hit & Run) — $3.500', value: 'Huir de la Escena (Hit & Run) [$3.500]' },
    { name: '🚫 Conducir vehículo restringido — $1.800', value: 'Conducir Vehículo Restringido [$1.800]' },
    { name: '📱 Uso de teléfono al volante — $700', value: 'Uso de Teléfono al Volante [$700]' },
    { name: '🅿️ Estacionamiento en zona prohibida — $400', value: 'Estacionamiento en Zona Prohibida [$400]' },
    { name: '↔️ Conducir en contramano — $2.200', value: 'Conducir en Contramano [$2.200]' },
    { name: '🏁 Competencia ilegal / street racing — $4.000', value: 'Competencia Ilegal (Street Racing) [$4.000]' }
];

function formatearRazones(razones) {
    if (razones.length === 1) return razones[0];
    return razones.map((r, i) => `${i + 1}. ${r}`).join('\n');
}

export default {
    data: new SlashCommandBuilder()
        .setName('multar')
        .setDescription('Emite una multa oficial de tránsito (Exclusivo Policía de Sarasota).')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario que cometió la infracción.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Infracción principal (precio recomendado en el nombre).')
                .setRequired(true)
                .addChoices(...OPCIONES_MULTA))
        .addStringOption(option =>
            option.setName('razon_2')
                .setDescription('Segunda infracción (opcional).')
                .setRequired(false)
                .addChoices(...OPCIONES_MULTA))
        .addStringOption(option =>
            option.setName('razon_3')
                .setDescription('Tercera infracción (opcional).')
                .setRequired(false)
                .addChoices(...OPCIONES_MULTA))
        .addIntegerOption(option =>
            option.setName('monto')
                .setDescription('Monto TOTAL en $ (sumá los recomendados si hay varias infracciones).')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        const ROL_POLICIA_ID = '1529146302783422706';

        if (!interaction.member.roles.cache.has(ROL_POLICIA_ID)) {
            return interaction.reply({
                content: '❌ Solo personal del **Departamento Policial de Sarasota** puede emitir multas.',
                ephemeral: true
            });
        }

        const infractor = interaction.options.getUser('usuario');
        const monto = interaction.options.getInteger('monto');

        const razones = [
            interaction.options.getString('razon'),
            interaction.options.getString('razon_2'),
            interaction.options.getString('razon_3')
        ].filter(Boolean);

        const razonesUnicas = [...new Set(razones)];
        const razonTexto = formatearRazones(razonesUnicas);

        const ticketID = await generarIDMulta();

        const datosMulta = {
            id: ticketID,
            usuarioId: infractor.id,
            emisorId: interaction.user.id,
            razon: razonTexto,
            razones: razonesUnicas,
            monto,
            guildId: interaction.guildId,
            estado: 'PENDIENTE',
            fecha: new Date().toISOString()
        };

        await guardarMulta(ticketID, datosMulta);
        programarWarrant(interaction.client, interaction.guildId, infractor.id, ticketID);

        try {
            const embedDM = new EmbedBuilder()
                .setColor('#ff3333')
                .setTitle('<:folder:1523041295868756008> Notificación Oficial de Multa')
                .setDescription(
                    `Has recibido una multa de tránsito en **${interaction.guild.name}**.\n\n` +
                    `• **Infracción(es):**\n${razonTexto}\n\n` +
                    `• **Monto a Pagar:** $${monto.toLocaleString('es-AR')}\n` +
                    `• **ID Ticket:** \`${ticketID}\`\n` +
                    `• **Oficial Emisor:** <@${interaction.user.id}>\n\n` +
                    `⚠️ *Dispones de **7 días** para abonarla con \`/pagar-multa\` antes de que se emita una Orden de Arresto.*`
                )
                .setTimestamp();

            await infractor.send({ embeds: [embedDM] });
        } catch (error) {
            console.log(`No se le pudo enviar el DM a ${infractor.tag} (DMs bloqueados o cerrados).`);
        }

        const embedMulta = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<:folder:1523041295868756008> Ticket de Multa Emitido')
            .setDescription(
                `• **Usuario —** <@${infractor.id}>\n` +
                `• **Oficial —** <@${interaction.user.id}>\n` +
                `• **Infracción(es) —**\n${razonTexto}\n` +
                `• **Monto —** $${monto.toLocaleString('es-AR')}\n` +
                `• **ID —** \`${ticketID}\`\n\n` +
                `*Usá \`/pagar-multa\` para abonar este ticket dentro de una semana, o recibirás una orden de arresto.*`
            )
            .setTimestamp();

        await interaction.reply({
            content: `🚨 **Atención <@${infractor.id}>, has sido multado oficialmente:**`,
            embeds: [embedMulta],
            allowedMentions: { users: [infractor.id] }
        });
    }
};
