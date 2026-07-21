import fs from 'fs';

const ARCHIVO_ECONOMIA = './economia_db.json';

// 📂 Cargar saldos desde el archivo al iniciar el bot
function cargarSaldos() {
    if (!fs.existsSync(ARCHIVO_ECONOMIA)) {
        fs.writeFileSync(ARCHIVO_ECONOMIA, JSON.stringify({}));
        return new Map();
    }
    try {
        const data = JSON.parse(fs.readFileSync(ARCHIVO_ECONOMIA, 'utf-8'));
        return new Map(Object.entries(data));
    } catch (error) {
        console.error("Error al cargar la base de datos de economía:", error);
        return new Map();
    }
}

// 💾 Guardar saldos físicamente en el disco
export function guardarSaldos() {
    try {
        const objetoSaldos = Object.fromEntries(saldosDB);
        fs.writeFileSync(ARCHIVO_ECONOMIA, JSON.stringify(objetoSaldos, null, 2));
    } catch (error) {
        console.error("Error al guardar la base de datos de economía:", error);
    }
}

// Mapas en memoria inicializados con persistencia
export const saldosDB = cargarSaldos();
export const cooldownsWork = new Map();

// Funciones de Economía Persistentes
export function obtenerSaldo(usuarioId) {
    return saldosDB.get(usuarioId) || 0;
}

export function agregarSaldo(usuarioId, cantidad) {
    const saldoActual = obtenerSaldo(usuarioId);
    const nuevoSaldo = saldoActual + cantidad;
    saldosDB.set(usuarioId, nuevoSaldo);
    guardarSaldos(); // 👈 Se guarda automáticamente en disco
    return nuevoSaldo;
}

export function restarSaldo(usuarioId, cantidad) {
    const saldoActual = obtenerSaldo(usuarioId);
    if (saldoActual < cantidad) return false; // No tiene suficiente dinero
    const nuevoSaldo = saldoActual - cantidad;
    saldosDB.set(usuarioId, nuevoSaldo);
    guardarSaldos(); // 👈 Se guarda automáticamente en disco
    return true;
}
