import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { agregarSaldo } from '../../utils/gestorEconomia.js';
import { getFromDb, setInDb } from '../../utils/database.js';
import { E } from '../../config/emojis.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Entrada al turno (contexto)
const historiasEntrada = [
    'Marcás la entrada en un depósito de remolques de Sarasota. El letrero de “abierto” parpadea como una advertencia.',
    'Llegás al diner de la ruta 41. El olor a grasa y café quemado te recibe antes que el gerente.',
    'Firmás el parte en el taller de Bradenton. El piso todavía tiene aceite de la madrugada.',
    'Arrancás el turno en la gasolinera de la esquina. El aire acondicionado no anda y el sol no perdona.',
    'Te subís a la camioneta de repuestos. El GPS marca media hora de tráfico en Siesta Key.',
    'Entras al serviauto del centro. Diez autos de lujo esperan y el jefe solo dice “hacete cargo”.',
    'Tomás el delantal en el food truck de la costa. El generador hace más ruido que los clientes.',
    'Abrís la puerta del motel de la I-75. El lobby huele a cloro y a promesas rotas.',
    'Te asignan la caja del minimarket nocturno. Las luces fluorescentes parpadean cada dos minutos.',
    'Empezás el turno de limpieza en el concesionario. Un auto deportivo dejó un rastro de aceite hasta la salida.'
];

// Durante el turno (contexto)
const historiasDurante = [
    'Un cliente discute si el hot dog del local “cuenta como comida de verdad”. Terminás mediando la pelea.',
    'El gerente se va “cinco minutos” y no vuelve hasta que cerrás la caja.',
    'El aire se corta a mitad de turno. Seguís atendiendo con una toalla en la nuca.',
    'Un turista deja el auto en el elevador y se olvida de las llaves. Perdés media hora buscándolo.',
    'La máquina de café se traba. Tres empleados y un destornillador después, vuelve a funcionar.',
    'Un camionero te pide direcciones a Port Charlotte y se queda charlando veinte minutos.',
    'Llueve de golpe sobre el playón. Terminás empapado moviendo conos y carteles.',
    'El sistema de cobro se cae. Anotás todo a mano hasta que vuelve la red.',
    'Un compañero llama de último momento. Te toca cubrir su parte del turno.',
    'El olor a freidora se te pega a la ropa. Ya sabés que va a durar hasta mañana.'
];

// Cierre del turno (resultado en embed)
const historiasCierre = [
    'Terminás el turno oliendo a aceite de freír, estrés y horas extra sin pagar.',
    'Cerrás la caja con el cuaderno lleno de anotaciones y las manos manchadas de grasa.',
    'El gerente te agradece con un “buen laburo” y se va antes que vos.',
    'Salís del local con la espalda rota y el bolsillo un poco menos vacío.',
    'Dejás el delantal colgado. Otro turno en Sarasota, otro día sobrevivido.',
    'Apagás las luces del taller. El eco de las herramientas todavía te zumba en la cabeza.',
    'Firmás la salida. El estacionamiento está casi vacío y el calor sigue intacto.',
    'Guardás el chaleco reflectante. El tráfico de la 41 te espera de vuelta a casa.',
    'Contás la propina del día: menos de lo que esperabas, más de lo que tenías.',
    'Cerrás el turno en el motel. El letrero de vacantes sigue parpadeando detrás tuyo.'
];

export default {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Trabaja un turno para ganar dinero en Sarasota y pagar tus cuentas.'),

    async execute(interaction) {
        const usuarioId = interaction.user.id;
        const ahora = Date.now();
        const TIEMPO_ESPERA = 4 * 60 * 60 * 1000;
        const claveCooldown = `cooldown:work:${usuarioId}`;

        const proximoTrabajo = await getFromDb(claveCooldown, 0);

        if (proximoTrabajo && ahora < proximoTrabajo) {
            const timestampUnix = Math.floor(proximoTrabajo / 1000);
            return await interaction.reply({
                content: `${E.lock} Ya trabajaste recientemente y estás descansando. Podrás volver a trabajar <t:${timestampUnix}:R> (<t:${timestampUnix}:f>).`,
                flags: MessageFlags.Ephemeral
            });
        }

        const entrada = historiasEntrada[Math.floor(Math.random() * historiasEntrada.length)];
        const durante = historiasDurante[Math.floor(Math.random() * historiasDurante.length)];
        const cierre = historiasCierre[Math.floor(Math.random() * historiasCierre.length)];

        await interaction.reply({
            content: `${E.llaves || ''} **Marcando entrada...**\n*${entrada}*`,
            flags: MessageFlags.Ephemeral
        });

        await delay(2200);

        await interaction.followUp({
            content: `*${durante}*`,
            flags: MessageFlags.Ephemeral
        });

        const ganancia = Math.floor(Math.random() * (1200 - 400 + 1)) + 400;
        const nuevoSaldo = await agregarSaldo(usuarioId, ganancia);

        const tiempoProximoServicio = ahora + TIEMPO_ESPERA;
        await setInDb(claveCooldown, tiempoProximoServicio);
        const siguienteTurnoUnix = Math.floor(tiempoProximoServicio / 1000);

        await delay(1800);

        const embedWork = new EmbedBuilder()
            .setColor('#8ae6fa')
            .setTitle(`${E.llaves || ''} ¡Fuiste a trabajar!`)
            .setDescription(
                `${cierre}\n\n` +
                `${E.dinero || ''} Ganaste **$${ganancia.toLocaleString('es-AR')}**.\n\n` +
                `${E.dot || '•'} **Balance:** $${nuevoSaldo.toLocaleString('es-AR')}\n` +
                `${E.dot || '•'} **Próximo turno:** <t:${siguienteTurnoUnix}:f>`
            )
            .setFooter({ text: '00Y4n Comunidad SWFL • Sistema de Economía', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.followUp({ embeds: [embedWork] });
    }
};
