import { getFromDb, setInDb } from './database.js';

const KEY_ARRESTOS = 'arrestos:globales';

/**
 * Obtener todos los arrestos registrados
 */
export async function obtenerTodosLosArrestos() {
    return await getFromDb(KEY_ARRESTOS, {});
}

/**
 * Obtener un arresto por su ID
 */
export async function obtenerArresto(arrestoId) {
    const arrestos = await obtenerTodosLosArrestos();
    return arrestos[arrestoId] || null;
}

/**
 * Guardar o actualizar un arresto
 */
export async function guardarArresto(arrestoId, datosArresto) {
    const arrestos = await obtenerTodosLosArrestos();
    arrestos[arrestoId] = datosArresto;
    await setInDb(KEY_ARRESTOS, arrestos);
}

/**
 * Generar un ID único para el arresto
 */
export async function generarIDArresto() {
    const arrestos = await obtenerTodosLosArrestos();
    const ids = Object.keys(arrestos)
        .map(id => Number(id))
        .filter(id => !isNaN(id));
    const ultimoID = ids.length > 0 ? Math.max(...
