import { getFromDb, setInDb } from './database.js'; // Ajusta la ruta a database.js si está en otra carpeta

export const ROL_WARRANT_ID = '1529152491545952316';
const KEY_MULTAS = 'multas:globales';

/**
 * Obtener todas las multas registradas
 */
export async function obtenerTodasLasMultas() {
    return await getFromDb(KEY_MULTAS, {});
}

/**
 * Obtener una multa por su ID / TicketID
 */
export async function obtenerMulta(ticketId) {
    const multas = await obtenerTodasLasMultas();
    return multas[ticketId] || null;
}

/**
 * Guardar o actualizar una multa específica
 */
export async function guardarMulta(ticketId, datosMulta) {
    const multas = await obtenerTodasLasMultas();
    multas[ticketId] = datosMulta;
    await setInDb(KEY_MULTAS, multas);
}

/**
 * Generar un ID único para la multa
 */
export async function generarIDMulta() {
    const multas = await obtenerTodasLasMultas();
    const ids = Object.keys(multas).map(id => Number(id)).filter(id => !isNaN(id));
    const ultimoID = ids.length > 0 ? Math.max(...ids) : 0;
    return (ultimoID + 1).toString();
}

/**
 * Programar la asignación del rol Warrant (Orden de arresto) a los 7 días
 */
export function programarWarrant(client, guildId, usuarioId, ticketId) {
    const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

    setTimeout(async () => {
        const ticket = await obtenerMulta(ticketId);

        if (ticket && ticket.estado === 'PENDIENTE') {
            try {
                const guild = await client.guilds.fetch(guildId);
                const miembro = await guild.members.fetch(usuarioId);

                if (miembro) {
                    await miembro.roles.add(ROL_WARRANT_ID);
                    console.log(`[WARRANT] Rol asignado a ${miembro.user.tag} por la multa #${ticketId}`);
                }
            } catch (error) {
                console.error(`Error al aplicar la orden de arresto para la multa #${ticketId}:`, error);
            }
        }
    }, SIETE_DIAS_MS);
}
