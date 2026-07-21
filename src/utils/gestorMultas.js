import fs from 'fs';

const ARCHIVO_MULTAS = './multas_db.json';
export const ROL_WARRANT_ID = '1529152491545952316';

// 📂 Cargar multas desde el archivo al iniciar el bot
function cargarMultas() {
    if (!fs.existsSync(ARCHIVO_MULTAS)) {
        fs.writeFileSync(ARCHIVO_MULTAS, JSON.stringify({}));
        return new Map();
    }
    try {
        const data = JSON.parse(fs.readFileSync(ARCHIVO_MULTAS, 'utf-8'));
        return new Map(Object.entries(data));
    } catch (error) {
        console.error("Error al cargar la base de datos de multas:", error);
        return new Map();
    }
}

// 💾 Guardar las multas físicamente en el disco
export function guardarMultas() {
    try {
        const objetoMultas = Object.fromEntries(multasDB);
        fs.writeFileSync(ARCHIVO_MULTAS, JSON.stringify(objetoMultas, null, 2));
    } catch (error) {
        console.error("Error al guardar la base de datos de multas:", error);
    }
}

// Inicializamos la Map desde el archivo cargado
export const multasDB = cargarMultas();

// 🔢 Generador inteligente de IDs (no repite IDs al reiniciar el bot)
export function generarIDMulta() {
    const ids = Array.from(multasDB.keys()).map(id => Number(id)).filter(id => !isNaN(id));
    const ultimoID = ids.length > 0 ? Math.max(...ids) : 0;
    return (ultimoID + 1).toString();
}

/**
 * Programar la asignación del rol Warrant (Orden de arresto) a los 7 días
 */
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
                console.error(`Error al aplicar la orden de arresto para la multa #${ticketId}:`, error);
            }
        }
    }, SIETE_DIAS_MS);
}
