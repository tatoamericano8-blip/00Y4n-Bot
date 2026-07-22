import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { obtenerSaldo, agregarSaldo, cooldownsWork } from '../../utils/gestorEconomia.js';

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
        const TIEMPO_ESPERA = 4 * 60 * 60 * 1000; // 4 horas de cooldown
        const proximoTrabajo = cooldownsWork.get(usuarioId);

        // Verificar si el usuario está en tiempo de espera (Cooldown)
        if (proximoTrabajo && ahora < proximoTrabajo) {
            const timestampUnix = Math.floor(proximoTrabajo / 1000);
            return await interaction.reply({
                content: `<:lock:1523041298796384418> Ya trabajaste recientemente y estás descansando. Podrás volver a trabajar <t:${timestampUnix}:R> (<t:${timestampUnix}:f>).`,
                ephemeral: true
            });
        }

        // Generar ganancia aleatoria entre $400 y $1,200
        const ganancia = Math.floor(Math.random() * (1200 - 400 + 1)) + 400;
        
        // 🛠️ FIX: Agregado await a la función asíncrona de saldo
        const nuevoSaldo = await agregarSaldo(usuarioId, ganancia);

        // Guardar nuevo timestamp de cooldown
        const siguienteTurnoUnix = Math.floor((ahora + TIEMPO_ESPERA) / 1000);
        cooldownsWork.set(usuarioId, ahora + TIEMPO_ESPERA);

        // Seleccionar historia aleatoria
        const historia = historiasTrabajo[Math.floor(Math.random() * historiasTrabajo.length)];

        // Embed con formato 00Y4n (#74d4fc)
        const embedWork = new EmbedBuilder()
            .setColor('#74d4fc')
            .setTitle('<a:dinero:1529160799392632832> ¡Fuiste a trabajar!')
            .setDescription(
                `${historia}\n\n` +
                `Ganaste **$${ganancia.toLocaleString()}**.\n\n` +
                `• **Balance:** $${nuevoSaldo.toLocaleString()}\n` +
                `• **Próximo turno:** <t:${siguienteTurnoUnix}:f>`
            )
            .setFooter({ text: '00Y4n Comunidad SWFL • Sistema de Economía', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [embedWork]
        });
    },
};
