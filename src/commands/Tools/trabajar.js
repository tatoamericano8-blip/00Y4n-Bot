import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { agregarSaldo } from '../../utils/gestorEconomia.js';
import { getFromDb, setInDb } from '../../utils/database.js';

// Historias al estilo SWFL / Sarasota RP
const historiasTrabajo = [
    "Comenzaste a trabajar en un depósito de remolques de Sarasota y el primer cono que tocaste se desarmó en tu mano.",
    "Terminaste un turno en un Diner local que te envejeció siete años en siete horas.",
    "Tu gerente te dijo 'hazte cargo' y se fue a tomar un descanso que duró todo tu turno.",
    "Limpiaste el taller mecánico de Sarasota después de que un auto deportivo tirara aceite por todo el piso.",
    "Trabajaste como repartidor de repuestos de autos por todo Sarasota aguantando el tráfico.",
    "Atendiste la caja de la gasolinera local y sobreviviste a un turno nocturno interminable.",
    "Lavaste 10 vehículos de lujo en el serviauto del centro de Sarasota bajo un sol abrasador."
];

export default {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Trabaja un turno para ganar dinero en Sarasota y pagar tus cuentas.'),

    async execute(interaction) {
        const usuarioId = interaction.user.id;
        const ahora = Date.now();
        const TIEMPO_ESPERA = 4 * 60 * 60 * 1000; // ⏱️ Cooldown ajustado a 4 Horas
        const claveCooldown = `cooldown:work:${usuarioId}`;

        // 1. Obtener el próximo trabajo guardado en la Base de Datos (persistente)
        const proximoTrabajo = await getFromDb(claveCooldown, 0);

        // 2. Verificar si el usuario todavía debe esperar
        if (proximoTrabajo && ahora < proximoTrabajo) {
            const timestampUnix = Math.floor(proximoTrabajo / 1000);
            return await interaction.reply({
                content: `<:lock:1523041298796384418> Ya trabajaste recientemente y estás descansando. Podrás volver a trabajar <t:${timestampUnix}:R> (<t:${timestampUnix}:f>).`,
                ephemeral: true
            });
        }

        // 3. Generar ganancia aleatoria entre $400 y $1,200
        const ganancia = Math.floor(Math.random() * (1200 - 400 + 1)) + 400;
        
        // 4. Agregar el dinero a la cuenta del usuario
        const nuevoSaldo = await agregarSaldo(usuarioId, ganancia);

        // 5. Guardar el nuevo tiempo de cooldown en MongoDB (4 horas hacia adelante)
        const tiempoProximoServicio = ahora + TIEMPO_ESPERA;
        await setInDb(claveCooldown, tiempoProximoServicio);

        const siguienteTurnoUnix = Math.floor(tiempoProximoServicio / 1000);

        // 6. Seleccionar historia aleatoria
        const historia = historiasTrabajo[Math.floor(Math.random() * historiasTrabajo.length)];

        // 7. Responder con Embed estilo 00Y4n (#74d4fc)
        const embedWork = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<a:dinero:1529160799392632832> ¡Fuiste a trabajar!')
            .setDescription(
                `${historia}\n\n` +
                `Ganaste **$${ganancia.toLocaleString('es-AR')}**.\n\n` +
                `• **Balance:** $${nuevoSaldo.toLocaleString('es-AR')}\n` +
                `• **Próximo turno:** <t:${siguienteTurnoUnix}:f>`
            )
            .setFooter({ text: '00Y4n Comunidad SWFL • Sistema de Economía', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [embedWork]
        });
    },
};
