// Map en memoria para almacenar las multas activas
export const multasDB = new Map();

// ID del rol de Orden de Arresto / Warrant
export const ROL_WARRANT_ID = '1529152491545952316';

// El contador arranca en 0 para que la primera multa emitida sea la #1
let contadorID = 0;

export function generarIDMulta() {
    contadorID += 1;
    return contadorID.toString();
}

/**
 * Programa la asignación del rol de Orden de Arresto a los 7 días
 */
export function programarWarrant(client, guildId, usuarioId, ticketId) {
    const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

    setTimeout(async () => {
        const ticket = multasDB.get(ticketId);

        // Si la multa sigue registrada y NO ha sido pagada
        if (ticket && ticket.estado === 'PENDIENTE') {
            try {
                const guild = await client.guilds.fetch(guildId);
                const miembro = await guild.members.fetch(usuarioId);

                if (miembro) {
                    await miembro.roles.add(ROL_WARRANT_ID);
                    console.log(`[WARRANT] Rol de Orden de Arresto asignado a ${miembro.user.tag} por la multa #${ticketId}`);
                }
            } catch (error) {
                console.error(`Error al aplicar la orden de arresto para la multa #${ticketId}:`, error);
            }
        }
    }, SIETE_DIAS_MS);
}
