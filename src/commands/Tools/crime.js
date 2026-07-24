import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { agregarSaldo } from '../../utils/gestorEconomia.js';
import { getFromDb, setInDb } from '../../utils/database.js';

// Pensamientos de suspenso mientras se planea el crimen
const pensamientosCrimen = [
    "Das dos vueltas al estacionamiento de un motel antes de decidir si es una buena idea...",
    "Le das una patada a una máquina expendedora. Caen monedas. La tentación se multiplica...",
    "Observás las cámaras de seguridad del minimarket buscando un punto ciego...",
    "Te ponés la capucha y revisás que no haya patrulleros cerca...",
    "Forzás la traba de la puerta trasera de un taller mecánico cerrado..."
];

// Historias cuando el crimen tiene ÉXITO
const historiasExito = [
    "Lograste abrir la caja fuerte antes de que sonara la alarma y escapaste sin dejar rastro.",
    "El empleado del local se distrajo y te llevaste la recaudación del día.",
    "Robaste repuestos de lujo en el taller de Sarasota y los vendiste en el mercado negro.",
    "Encontraste la billetera de un turista en la playa de Sarasota repleta de efectivo."
];

// Historias cuando el crimen FALLA (Te atrapan y te multan)
const historiasFallo = [
    "El recepcionista del motel llamó a la policía antes de que terminaras de pensarlo.",
    "Un patrullero dobló justo en la esquina y te agarró con las manos en la masa.",
    "La cámara de seguridad te filmó la cara y la policía te interceptó a pocas cuadras.",
    "Sonó la alarma silenciosa del comercio y los oficiales llegaron antes de que pudieras escapar."
];

export default {
    data: new SlashCommandBuilder()
        .setName('crime')
        .setDescription('Comete un crimen por dinero. Alto riesgo de ser atrapado.'),

    async execute(interaction) {
        const usuarioId = interaction.user.id;
        const ahora = Date.now();
        const TIEMPO_ESPERA = 2 * 60 * 60 * 1000; // ⏱️ 2 horas de cooldown
        const claveCooldown = `cooldown:crime:${usuarioId}`;

        // 1. Verificar Cooldown guardado en MongoDB
        const proximoCrimen = await getFromDb(claveCooldown, 0);

        if (proximoCrimen && ahora < proximoCrimen) {
            const timestampUnix = Math.floor(proximoCrimen / 1000);
            return await interaction.reply({
                content: `<:cruz00y4n:1523041302764191844> Estás manteniendo un perfil bajo por la policía. Podrás intentar otro crimen <t:${timestampUnix}:R> (<t:${timestampUnix}:f>).`,
                ephemeral: true
            });
        }

        // 2. Respuesta inicial simulando "Scoping a move..." (Pensando la jugada)
        const pensamientoAleatorio = pensamientosCrimen[Math.floor(Math.random() * pensamientosCrimen.length)];
        
        await interaction.reply({
            content: `💀 **Planeando el delito...**\n*${pensamientoAleatorio}*`
        });

        // 3. Pausa dramática de 3 segundos
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Registrar el nuevo cooldown en MongoDB
        await setInDb(claveCooldown, ahora + TIEMPO_ESPERA);

        // 4. Determinar Probabilidad (30% Éxito / 70% Atrapado)
        const exito = Math.random() < 0.30;

        if (exito) {
            // Ganancia entre $500 y $1,800
            const ganancia = Math.floor(Math.random() * (1800 - 500 + 1)) + 500;
            const nuevoSaldo = await agregarSaldo(usuarioId, ganancia);
            const historia = historiasExito[Math.floor(Math.random() * historiasExito.length)];

            const embedExito = new EmbedBuilder()
                .setColor('#2ecc71') // Verde
                .setTitle('💀 ¡Cometiste un delito!')
                .setDescription(
                    `${historia}\n\n` +
                    `➔ Te saliste con la tuya y obtuviste **$${ganancia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}**. Tu saldo actualizado es **$${nuevoSaldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}**.`
                )
                .setFooter({ 
                    text: `${interaction.guild.name} • Sistema de Economía`, 
                    iconURL: interaction.guild.iconURL({ dynamic: true }) 
                })
                .setTimestamp();

            await interaction.editReply({ content: null, embeds: [embedExito] });

        } else {
            // Multa entre $250 y $750
            const multa = Math.floor(Math.random() * (750 - 250 + 1)) + 250;
            const nuevoSaldo = await agregarSaldo(usuarioId, -multa);
            const historia = historiasFallo[Math.floor(Math.random() * historiasFallo.length)];

            const embedFallo = new EmbedBuilder()
                .setColor('#e74c3c') // Rojo
                .setTitle('💀 ¡Cometiste un delito!')
                .setDescription(
                    `${historia}\n\n` +
                    `➔ Fuiste multado con **$${multa.toLocaleString('es-AR', { minimumFractionDigits: 2 })}**. Tu saldo actualizado es **$${nuevoSaldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}**.`
                )
                .setFooter({ 
                    text: `${interaction.guild.name} • Sistema de Economía`, 
                    iconURL: interaction.guild.iconURL({ dynamic: true }) 
                })
                .setTimestamp();

            await interaction.editReply({ content: null, embeds: [embedFallo] });
        }
    }
};
