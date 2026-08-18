import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { agregarSaldo } from '../../utils/gestorEconomia.js';
import { getFromDb, setInDb } from '../../utils/database.js';

// -------------------------------------------------------------
// ⚙️ CONFIGURACIÓN DE ROLES Y RECOMPENSAS
// Poné los IDs de los roles de tu servidor y la cantidad que da cada uno.
// Si un usuario tiene varios roles, se irán sumando.
// -------------------------------------------------------------
const ROLES_RECOMPENSAS = [
    { id: '1506800624493269057', nombre: 'Ciudadano', recompensa: 650 },
    { id: '1451950096471162992', nombre: 'Miembro_00Y4n', recompensa: 900 },
    { id: '1484294519234105638', nombre: 'Booster', recompensa: 1000 },
    { id: '1497267661158092973', nombre: 'Sponsor', recompensa: 2500 },
    { id: '1512120103771050005', nombre: 'Staff', recompensa: 2500 },
    { id: '1529146302783422706', nombre: 'Policía del condado de Sarasota', recompensa: 1500 },
    { id: '1530287573547880581', nombre: 'Ciudadano del Día', recompensa: 2000 },
    { id: '1528870731629465752', nombre: 'Alto Comando', recompensa: 3000 },
    { id: '1525517592348065904', nombre: 'Server Contribuidor', recompensa: 500 },
    // Podés agregar todos los roles que quieras siguiendo la misma estructura
];

// Recompensa base por si el usuario no tiene ningún rol de la lista arriba
const RECOMPENSA_BASE_DEFECTO = 500; 

export default {
    data: new SlashCommandBuilder()
        .setName('recolectar')
        .setDescription('Reclama tu ingreso diario según los roles que posees en el servidor.'),

    async execute(interaction) {
        const usuarioId = interaction.user.id;
        const claveCooldown = `cooldown:collect:${usuarioId}`;

        // 1. Verificar Cooldown de 24 Horas
        const ultimoReclamo = await getFromDb(claveCooldown, 0);
        const ahora = Date.now();
        const tiempoEspera = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

        if (ahora < ultimoReclamo) {
            const tiempoRestanteUnix = Math.floor(ultimoReclamo / 1000);
            return await interaction.reply({
                content: `<:cruz00y4n:1534937767652495360> Ya has reclamado tu ingreso diario. Podrás volver a recolectar el <t:${tiempoRestanteUnix}:F> (<t:${tiempoRestanteUnix}:R>).`,
                ephemeral: true
            });
        }

        // 2. Calcular Ingreso basado en los roles del usuario
        let totalIngreso = 0;
        let desgloseRoles = [];

        for (const rolConfig of ROLES_RECOMPENSAS) {
            if (interaction.member.roles.cache.has(rolConfig.id)) {
                totalIngreso += rolConfig.recompensa;
                desgloseRoles.push(`<@&${rolConfig.id}> **+$${rolConfig.recompensa.toLocaleString('es-AR')}**`);
            }
        }

        // Si no tiene ningún rol configurado, le damos el básico
        if (totalIngreso === 0) {
            totalIngreso = RECOMPENSA_BASE_DEFECTO;
            desgloseRoles.push(`Ingreso Básico **+$${RECOMPENSA_BASE_DEFECTO.toLocaleString('es-AR')}**`);
        }

        // 3. Guardar el nuevo saldo en la Base de Datos
        const nuevoSaldo = await agregarSaldo(usuarioId, totalIngreso);

        // 4. Guardar la fecha del próximo reclamo (ahora + 24 horas)
        const proximoReclamo = ahora + tiempoEspera;
        await setInDb(claveCooldown, proximoReclamo);

        const proximoReclamoUnix = Math.floor(proximoReclamo / 1000);

        // 5. Crear Embed idéntico al de la imagen
        const embedCollect = new EmbedBuilder()
            .setTitle('<a:si:1534956201035436082> Ingreso Diario Recolectado')
            .setColor('#74d4fc')
            .setDescription(
                `<:fle:1534937306191102125> Has recaudado **$${totalIngreso.toLocaleString('es-AR', { minimumFractionDigits: 2 })}** en ingresos diarios. Tu saldo actualizado es ahora **$${nuevoSaldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}**.\n\n` +
                `**Siguiente disponible:** <t:${proximoReclamoUnix}:F>\n\n` +
                `${desgloseRoles.join('\n')}`
            );

        await interaction.reply({ embeds: [embedCollect] });
    }
};
