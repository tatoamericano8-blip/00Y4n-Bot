import { getFromDb, setInDb } from './database.js';

export const ROL_WARRANT_ID = '1529152491545952316';
const KEY_MULTAS = 'multas:globales';

export const multasDB = new Map();

export async function obtenerTodasLasMultas() {
    return await getFromDb(KEY_MULTAS, {});
}

export async function obtenerMulta(ticketId) {
    const multas = await obtenerTodasLasMultas();
    return multas[ticketId] || null;
}

export async function guardarMulta(ticketId, datosMulta) {
    const multas = await obtenerTodasLasMultas();
    multas[ticketId] = datosMulta;
    await setInDb(KEY_MULTAS, multas);
}

export async function guardarMultas() {
    return true;
}

export async function generarIDMulta() {
    const multas = await obtenerTodasLasMultas();
    const ids = Object.keys(multas).map(id => Number(id)).filter(id => !isNaN(id));
    const ultimoID = ids.length > 0 ? Math.max(...ids) : 0;
    return (ultimoID + 1).toString();
}

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

/** Multas de un usuario (mas recientes primero) */
export async function obtenerMultasPorUsuario(usuarioId) {
    const multas = await obtenerTodasLasMultas();
    const arr = Array.isArray(multas) ? multas : Object.values(multas || {});
    return arr
        .filter((m) => String(m.usuarioId || m.usuario_id) === String(usuarioId))
        .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
}
