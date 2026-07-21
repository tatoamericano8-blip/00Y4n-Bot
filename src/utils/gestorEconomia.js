// Base de datos en memoria para Saldos, Cooldowns y Multas
export const saldosDB = new Map(); // Key: userId -> Value: cantidad ($)
export const cooldownsWork = new Map(); // Key: userId -> Value: timestamp proximo turno
export const multasDB = new Map();

export const ROL_WARRANT_ID = '1529152491545952316';

let contadorID = 0;

export function generarIDMulta() {
    contadorID += 1;
    return contadorID.toString();
}

// Funciones de Economía
export function obtenerSaldo(usuarioId) {
    return saldosDB.get(usuarioId) || 0;
}

export function agregarSaldo(usuarioId, cantidad) {
    const saldoActual = obtenerSaldo(usuarioId);
    const nuevoSaldo = saldoActual + cantidad;
    saldosDB.set(usuarioId, nuevoSaldo);
    return nuevoSaldo;
}

export function restarSaldo(usuarioId, cantidad) {
    const saldoActual = obtenerSaldo(usuarioId);
    if (saldoActual < cantidad) return false; // No tiene suficiente dinero
    saldosDB.set(usuarioId, saldoActual - cantidad);
    return true;
}

// Temporizador de Orden de Arresto (7 días)
export function programarWarrant(client, guildId, usuarioId, ticketId) {
    const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

    setTimeout(async () => {
        const ticket = multasDB.get(ticketId);

        if (ticket && ticket.estado === 'PENDIENTE') {
            try {
                const guild = await client.guilds.fetch(guildId);
                const miembro = await guild.members.fetch(usuarioId);

                if (miembro) {
                    await miembro.roles.add(ROL_WARRANT_ID);
                    console.log(`[WARRANT] Rol asignado a ${miembro.user.tag} por la multa #${ticketId}`);
                }
            } catch (error) {
                console.error(`Error al aplicar la orden de arresto (#${ticketId}):`, error);
            }
        }
    }, SIETE_DIAS_MS);
}
