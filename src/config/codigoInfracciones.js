/**
 * Código de infracciones 00Y4n — uso policial IC.
 * Precios x2 respecto de la versión inicial del Excel.
 * /multar usa autocomplete sobre TODO el catálogo (no solo 25 fijos).
 */

/** @typedef {{ codigo: string, clase: string, nombre: string, monto: number }} Infraccion */

/** Catálogo completo. */
export const CATALOGO_INFRACCIONES = [
  { codigo: '§101', clase: 'A', nombre: 'Exceso leve de velocidad (1-10 MPH)', monto: 300 },
  { codigo: '§102', clase: 'A', nombre: 'Exceso moderado de velocidad (11-20 MPH)', monto: 600 },
  { codigo: '§103', clase: 'A', nombre: 'Exceso grave de velocidad (21+ MPH)', monto: 1200 },
  { codigo: '§104', clase: 'A', nombre: 'Exceso en zona especial', monto: 800 },
  { codigo: '§105', clase: 'A', nombre: 'Omisión de señal o semáforo', monto: 500 },
  { codigo: '§106', clase: 'A', nombre: 'No ceder el paso', monto: 500 },
  { codigo: '§107', clase: 'A', nombre: 'No ceder a vehículo de emergencia', monto: 1000 },
  { codigo: '§108', clase: 'A', nombre: 'Cambio de carril indebido / zigzag', monto: 600 },
  { codigo: '§109', clase: 'A', nombre: 'Circular fuera de la calzada', monto: 900 },
  { codigo: '§110', clase: 'A', nombre: 'Conducir en sentido contrario', monto: 1100 },
  { codigo: '§111', clase: 'A', nombre: 'Estacionamiento ilegal / obstrucción', monto: 400 },
  { codigo: '§112', clase: 'A', nombre: 'Giro / U-turn prohibido', monto: 300 },
  { codigo: '§113', clase: 'A', nombre: 'Circular sin luces', monto: 500 },
  { codigo: '§114', clase: 'A', nombre: 'Conducción distraída', monto: 600 },
  { codigo: '§115', clase: 'A', nombre: 'Uso indebido de bocina / ruido', monto: 200 },
  { codigo: '§116', clase: 'A', nombre: 'No apartarse de un control activo', monto: 600 },
  { codigo: '§117', clase: 'A', nombre: 'Seguir demasiado cerca (tailgating)', monto: 400 },
  { codigo: '§118', clase: 'A', nombre: 'No señalizar maniobra', monto: 300 },
  { codigo: '§119', clase: 'A', nombre: 'Bloquear intersección', monto: 600 },
  { codigo: '§120', clase: 'A', nombre: 'Pérdida de control del vehículo', monto: 800 },
  { codigo: '§121', clase: 'A', nombre: 'Equipo defectuoso visible', monto: 300 },
  { codigo: '§122', clase: 'A', nombre: 'Conducir sin licencia o suspendida', monto: 1000 },
  { codigo: '§123', clase: 'A', nombre: 'Conducir sin seguro', monto: 700 },
  { codigo: '§124', clase: 'A', nombre: 'Vehículo sin matricular o registro', monto: 600 },
  { codigo: '§125', clase: 'A', nombre: 'Conducción bajo efectos (DUI RP)', monto: 3000 },
  { codigo: '§201', clase: 'B', nombre: 'Conducción temeraria (reckless)', monto: 1200 },
  { codigo: '§202', clase: 'B', nombre: 'Carreras ilegales / drag', monto: 1600 },
  { codigo: '§203', clase: 'B', nombre: 'Chocar y huir (daños materiales)', monto: 1600 },
  { codigo: '§204', clase: 'B', nombre: 'Chocar y huir (lesiones)', monto: 4000 },
  { codigo: '§205', clase: 'B', nombre: 'Uso del vehículo para poner en riesgo', monto: 4000 },
  { codigo: '§206', clase: 'B', nombre: 'Allanamiento de propiedad', monto: 800 },
  { codigo: '§207', clase: 'B', nombre: 'Vandalismo / daños a la propiedad', monto: 1000 },
  { codigo: '§208', clase: 'B', nombre: 'Hurto menor', monto: 1000 },
  { codigo: '§209', clase: 'B', nombre: 'Robo de vehículo (GTA)', monto: 4000 },
  { codigo: '§210', clase: 'B', nombre: 'Robo con intimidación', monto: 4000 },
  { codigo: '§211', clase: 'B', nombre: 'Allanamiento de comercio', monto: 5000 },
  { codigo: '§212', clase: 'B', nombre: 'Incendio doloso (arson)', monto: 5000 },
  { codigo: '§213', clase: 'B', nombre: 'Manipulación de vehículo ajeno', monto: 1200 },
  { codigo: '§214', clase: 'B', nombre: 'Posesión de bienes robados', monto: 1600 },
  { codigo: '§215', clase: 'B', nombre: 'Luces de emergencia en vehículo civil', monto: 800 },
  { codigo: '§216', clase: 'B', nombre: 'Vehículo restringido en sesión', monto: 800 },
  { codigo: '§301', clase: 'C', nombre: 'Conducta desordenada', monto: 700 },
  { codigo: '§302', clase: 'C', nombre: 'Desobediencia a orden policial', monto: 1000 },
  { codigo: '§303', clase: 'C', nombre: 'Resistencia a la detención (sin violencia)', monto: 1400 },
  { codigo: '§304', clase: 'C', nombre: 'Huida o elusión de control', monto: 3000 },
  { codigo: '§305', clase: 'C', nombre: 'Obstrucción a la justicia', monto: 1600 },
  { codigo: '§306', clase: 'C', nombre: 'Identificación falsa', monto: 1000 },
  { codigo: '§307', clase: 'C', nombre: 'Suplantación de personal de emergencia', monto: 3000 },
  { codigo: '§308', clase: 'C', nombre: 'Uso indebido de emergencias', monto: 1200 },
  { codigo: '§309', clase: 'C', nombre: 'Denuncia policial falsa', monto: 1400 },
  { codigo: '§310', clase: 'C', nombre: 'Soborno a funcionario', monto: 3000 },
  { codigo: '§311', clase: 'C', nombre: 'Negarse a desalojar zona', monto: 800 },
  { codigo: '§312', clase: 'C', nombre: 'Alteración de evidencia', monto: 2400 },
  { codigo: '§313', clase: 'C', nombre: 'Fuga de custodia', monto: 4000 },
  { codigo: '§314', clase: 'C', nombre: 'Hostigamiento a personal de emergencia', monto: 1200 },
  { codigo: '§315', clase: 'C', nombre: 'Negarse a recibir citación', monto: 500 },
  { codigo: '§316', clase: 'C', nombre: 'Interferencia con bomberos / médicos', monto: 1400 },
  { codigo: '§317', clase: 'C', nombre: 'Zona restringida de sesión', monto: 600 },
  { codigo: '§318', clase: 'C', nombre: 'Incumplir instrucciones del Host (evento)', monto: 400 },
  { codigo: '§319', clase: 'C', nombre: 'Obstruir carril de meet / exhibición', monto: 400 },
  { codigo: '§401', clase: 'D', nombre: 'Amenazas', monto: 1200 },
  { codigo: '§402', clase: 'D', nombre: 'Agresión simple', monto: 1600 },
  { codigo: '§403', clase: 'D', nombre: 'Agresión agravada / con arma', monto: 4000 },
  { codigo: '§404', clase: 'D', nombre: 'Brandir arma de fuego', monto: 2400 },
  { codigo: '§405', clase: 'D', nombre: 'Disparo en zona urbana', monto: 5000 },
  { codigo: '§406', clase: 'D', nombre: 'Posesión de sustancia controlada (RP)', monto: 1400 },
  { codigo: '§407', clase: 'D', nombre: 'Tráfico de sustancia controlada (RP)', monto: 4000 },
  { codigo: '§408', clase: 'D', nombre: 'Secuestro / retención ilegal', monto: 6000 },
  { codigo: '§409', clase: 'D', nombre: 'Asalto a oficial', monto: 5000 },
  { codigo: '§410', clase: 'D', nombre: 'Homicidio en RP (escena autorizada)', monto: 10000 },
];

/** Value que se guarda en la multa: "§101 Nombre [$300]" */
export function formatRazonValue(inf) {
  return `${inf.codigo} ${inf.nombre} [$${inf.monto}]`;
}

/** Label corto para autocomplete (máx ~100 chars). */
export function formatRazonChoiceName(inf) {
  const label = `${inf.codigo} ${inf.nombre} — $${inf.monto.toLocaleString('es-AR')}`;
  return label.length <= 100 ? label : label.slice(0, 97) + '...';
}

/** Filtra el catálogo para autocomplete (máx 25 resultados Discord). */
export function buscarInfracciones(query) {
  const q = String(query || '').trim().toLowerCase();
  const list = CATALOGO_INFRACCIONES;
  if (!q) return list.slice(0, 25);
  return list
    .filter((inf) => {
      const hay = `${inf.codigo} ${inf.nombre} ${inf.clase}`.toLowerCase();
      return hay.includes(q) || inf.codigo.replace('§', '').startsWith(q.replace('§', ''));
    })
    .slice(0, 25);
}

export function parseMontoFromRazon(razon) {
  if (!razon || typeof razon !== 'string') return 0;
  const m = razon.match(/\[\$\s*([\d.]+)\]/);
  if (!m) return 0;
  return Math.max(0, Math.round(Number(String(m[1]).replace(/\./g, ''))));
}

export function sumarMontosRazones(razones) {
  return (razones || []).reduce((acc, r) => acc + parseMontoFromRazon(r), 0);
}

/** Valida que el value venga del catálogo (evita texto libre inventado). */
export function esRazonValida(value) {
  if (!value) return false;
  return CATALOGO_INFRACCIONES.some((inf) => formatRazonValue(inf) === value);
}

