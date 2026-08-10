import Vehiculo from '../../models/Vehiculo.js';
import Licencia from '../../models/Licencia.js';
import { obtenerMultasPorUsuario } from './gestorMultas.js';
import { obtenerArrestosPorUsuario } from './gestorArrestos.js';
import { obtenerSaldo } from './gestorEconomia.js';

export async function obtenerFichaMDT(usuarioId) {
  const uid = String(usuarioId);

  const [multas, arrestos, vehiculos, licenciaDoc, saldo] = await Promise.all([
    obtenerMultasPorUsuario(uid),
    obtenerArrestosPorUsuario(uid),
    Vehiculo.find({ usuario_id: uid }).sort({ createdAt: -1 }).lean().catch(() => []),
    Licencia.findOne({ usuario_id: uid }).lean().catch(() => null),
    obtenerSaldo(uid).catch(() => 0)
  ]);

  const multasPendientes = multas.filter((m) => m.estado === 'PENDIENTE');
  const multasPagadas = multas.filter((m) => m.estado === 'PAGADA');
  const deuda = multasPendientes.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
  const arrestosActivos = arrestos.filter((a) => a.estado === 'ACTIVO');
  const arrestosAnulados = arrestos.filter((a) => a.estado === 'ANULADO');

  let licencia = { estado: 'Activa', motivo: null, oficial_id: null, fecha: null };
  if (licenciaDoc) {
    licencia = {
      estado: licenciaDoc.estado || 'Activa',
      motivo: licenciaDoc.motivo || null,
      oficial_id: licenciaDoc.oficial_id || null,
      fecha: licenciaDoc.fecha || null
    };
  }

  let nivelAlerta = 'LIMPIO';
  if (licencia.estado === 'Revocada' || arrestosActivos.length > 0 || deuda >= 5000) {
    nivelAlerta = 'BUSCADO';
  } else if (licencia.estado === 'Suspendida' || multasPendientes.length > 0 || deuda > 0) {
    nivelAlerta = 'ATENCION';
  }

  return {
    usuarioId: uid,
    licencia,
    multas,
    multasPendientes,
    multasPagadas,
    deuda,
    arrestos,
    arrestosActivos,
    arrestosAnulados,
    totalArrestosActivos: arrestosActivos.length,
    vehiculos: vehiculos || [],
    saldo: Number(saldo) || 0,
    nivelAlerta
  };
}

export async function buscarPorPatente(patenteRaw) {
  const patente = String(patenteRaw || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!patente) return null;
  const escaped = patente.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const vehiculo = await Vehiculo.findOne({
    patente: { $regex: new RegExp(`^${escaped}$`, 'i') }
  }).lean();
  return vehiculo || null;
}

export function emojiLicencia(estado) {
  if (estado === 'Suspendida') return '🟡';
  if (estado === 'Revocada') return '🔴';
  return '🟢';
}

export function colorAlerta(nivel) {
  if (nivel === 'BUSCADO') return 0xe74c3c;
  if (nivel === 'ATENCION') return 0xf1c40f;
  return 0x2ecc71;
}

export function formatearFecha(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    });
  } catch {
    return String(iso);
  }
}
