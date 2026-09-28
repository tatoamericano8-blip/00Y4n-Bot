import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { agregarSaldo } from '../../utils/gestorEconomia.js';
import { getFromDb, setInDb } from '../../utils/database.js';
import { E } from '../../config/emojis.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const pensamientosCrimen = [
    'Das dos vueltas al estacionamiento de un motel de la I-75 antes de decidir si vale la pena...',
    'Le das una patada a una máquina expendedora. Caen monedas. La tentación se multiplica...',
    'Observás las cámaras del minimarket buscando un punto ciego entre los estantes...',
    'Te ponés la capucha y revisás que no haya patrulleros cerca de Beneva Road...',
    'Forzás la traba de la puerta trasera de un taller cerrado en Bradenton...',
    'Mirás el lobby del motel: el recepcionista está distraído con el teléfono...',
    'Un auto con las ventanas abiertas en Siesta Key. Nadie a la vista...',
    'El depósito de remolques quedó sin luz de seguridad. Demasiado tentador...',
    'Contás los segundos frente a la caja del diner de madrugada...',
    'Revisás el callejón detrás del food truck. Solo el generador hace ruido...'
];

const historiasDurante = [
    'Avanzás en silencio. El corazón te late más fuerte que los pasos sobre el asfalto.',
    'La alarma no suena… todavía. Cada segundo se siente eterno.',
    'Escuchás una sirena a lo lejos y te congelás un instante.',
    'La puerta cede con un clic. Adentro solo hay oscuridad y olor a grasa.',
    'Sacás lo que podés sin mirar atrás. No hay tiempo para dudar.',
    'Un perro ladra en el fondo. Acelerás el paso antes de que alguien salga.',
    'La luz del pasillo se enciende sola. Te pegás a la pared y esperás.',
    'El bolsillo se te llena más de lo que pensabas. La salida queda a metros.'
];

const historiasExito = [
    'Lograste abrir la caja antes de que sonara la alarma y escapaste sin dejar rastro.',
    'El empleado se distrajo con un cliente y te llevaste la recaudación del día.',
    'Robaste repuestos de lujo en el taller de Sarasota y los moviste en el mercado negro.',
    'Encontraste la billetera de un turista en la playa, repleta de efectivo.',
    'Saliste del minimarket con la caja chica antes de que llegara el relevo.',
    'El motel tenía la caja semiabierta. Nadie notó la falta hasta la mañana.',
    'Vendiste lo que sacaste del depósito en menos de una hora. Rastro limpio.',
    'El food truck quedó solo dos minutos. Fue suficiente.',
    'Un auto desbloqueado en el playón del centro: estereo y efectivo del guantera.',
    'La cámara falló justo esa noche. La suerte estuvo de tu lado.'
];

const historiasFallo = [
    'El recepcionista del motel llamó a la policía antes de que terminaras de pensarlo.',
    'Un patrullero dobló justo en la esquina y te agarró con las manos en la masa.',
    'La cámara te filmó la cara y te interceptaron a pocas cuadras.',
    'Sonó la alarma silenciosa y los oficiales llegaron antes de que pudieras escapar.',
    'Un vecino gritá desde el balcón. En segundos había luces azules en la cuadra.',
    'Tropezaste con un cono en la salida. Para cuando te levantaste, ya te tenían.',
    'El empleado activó el botón de pánico debajo del mostrador.',
    'Tu capucha se enganchó en la reja. Tiempo suficiente para que te reconocieran.',
    'Dejaste huellas en el aceite del taller. Te rastrearon en minutos.',
    'Un civil te grabó con el celular y se lo pasó directo a la policía.'
];

export default {
    data: new SlashCommandBuilder()
        .setName('crime')
        .setDescription('Comete un crimen por dinero. Alto riesgo de ser atrapado.'),

    async execute(interaction) {
        const usuarioId = interaction.user.id;
        const ahora = Date.now();
        const TIEMPO_ESPERA = 2 * 60 * 60 * 1000;
        const claveCooldown = `cooldown:crime:${usuarioId}`;

        const proximoCrimen = await getFromDb(claveCooldown, 0);

        if (proximoCrimen && ahora < proximoCrimen) {
            const timestampUnix = Math.floor(proximoCrimen / 1000);
            return await interaction.reply({
                content: `${E.cruz} Estás manteniendo un perfil bajo por la policía. Podrás intentar otro crimen <t:${timestampUnix}:R> (<t:${timestampUnix}:f>).`,
                flags: MessageFlags.Ephemeral
            });
        }

        const pensamiento = pensamientosCrimen[Math.floor(Math.random() * pensamientosCrimen.length)];
        const durante = historiasDurante[Math.floor(Math.random() * historiasDurante.length)];

        // 1) Público — planeando
        await interaction.reply({
            content: `${E.skirojo || ''} **Planeando el delito...**\n*${pensamiento}*`
        });

        await delay(2200);

        // 2) Solo efímero — contexto/pensamiento del intento
        await interaction.followUp({
            content: `*${durante}*`,
            flags: MessageFlags.Ephemeral
        });

        await setInDb(claveCooldown, ahora + TIEMPO_ESPERA);

        await delay(1800);

        const exito = Math.random() < 0.5;

        if (exito) {
            const ganancia = Math.floor(Math.random() * (1800 - 500 + 1)) + 500;
            const nuevoSaldo = await agregarSaldo(usuarioId, ganancia);
            const historia = historiasExito[Math.floor(Math.random() * historiasExito.length)];

            const embedExito = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle(`${E.skirojo || ''} ¡Cometiste un delito!`)
                .setDescription(
                    `${historia}\n\n` +
                    `➔ Te saliste con la tuya y obtuviste **$${ganancia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}**. Tu saldo actualizado es **$${nuevoSaldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}**.`
                )
                .setFooter({
                    text: `${interaction.guild.name} • Sistema de Economía`,
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // 3) Público — resultado
            await interaction.followUp({ embeds: [embedExito] });
        } else {
            const multa = Math.floor(Math.random() * (750 - 250 + 1)) + 250;
            const nuevoSaldo = await agregarSaldo(usuarioId, -multa);
            const historia = historiasFallo[Math.floor(Math.random() * historiasFallo.length)];

            const embedFallo = new EmbedBuilder()
                .setColor('#E60404')
                .setTitle(`${E.skirojo || ''} ¡Cometiste un delito!`)
                .setDescription(
                    `${historia}\n\n` +
                    `➔ Fuiste multado con **$${multa.toLocaleString('es-AR', { minimumFractionDigits: 2 })}**. Tu saldo actualizado es **$${nuevoSaldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}**.`
                )
                .setFooter({
                    text: `${interaction.guild.name} • Sistema de Economía`,
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            await interaction.followUp({ embeds: [embedFallo] });
        }
    }
};
