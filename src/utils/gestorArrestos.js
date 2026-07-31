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
    const ultimoID = ids.length > 0 ? Math.max(...ids) : 0;
    return (ultimoID + 1).toString();
}

/**
 * Marcar un arresto como anulado
 */
export async function anularArresto(arrestoId, anuladoPor, motivoAnulacion) {
    const arresto = await obtenerArresto(arrestoId);
    if (!arresto) return null;

    arresto.estado = 'ANULADO';
    arresto.anuladoPor = anuladoPor;
    arresto.motivoAnulacion = motivoAnulacion;
    arresto.fechaAnulacion = new Date().toISOString();

    await guardarArresto(arrestoId, arresto);
    return arresto;
}

/**
 * Obtener todos los arrestos de un usuario específico
 */
export async function obtenerArrestosPorUsuario(usuarioId) {
    const arrestos = await obtenerTodosLosArrestos();
    return Object.values(arrestos)
        .filter(a => a.usuarioId === usuarioId)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

/**
 * Contar arrestos activos de un usuario
 */
export async function contarArrestosActivos(usuarioId) {
    const arrestos = await obtenerArrestosPorUsuario(usuarioId);
    return arrestos.filter(a => a.estado === 'ACTIVO').length;
}
