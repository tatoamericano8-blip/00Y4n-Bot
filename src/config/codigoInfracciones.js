/**
 * Código de infracciones 00Y4n — uso policial IC (in character).
 * Fuente: 00Y4n_Codigo_Infracciones_v1.xlsx
 * Discord permite máx. 25 choices por opción → MULTAR_CHOICES es el subset operativo.
 * CATÁLOGO tiene el listado completo para referencia / futuros menús.
 */

/** @typedef {{ codigo: string, clase: string, nombre: string, monto: number, clasificacion: string }} Infraccion */

/** Catálogo completo (referencia; no todo entra en el slash por límite de Discord). */
export const CATALOGO_INFRACCIONES = [
  { codigo: '§101', clase: 'A', nombre: 'Exceso leve de velocidad (1-10 MPH)', monto: 150, clasificacion: 'INFRACCION' },
  { codigo: '§102', clase: 'A', nombre: 'Exceso moderado de velocidad (11-20 MPH)', monto: 300, clasificacion: 'INFRACCION' },
  { codigo: '§103', clase: 'A', nombre: 'Exceso grave de velocidad (21+ MPH)', monto: 600, clasificacion: 'DELITO_MENOR' },
  { codigo: '§104', clase: 'A', nombre: 'Exceso en zona especial', monto: 400, clasificacion: 'INFRACCION' },
  { codigo: '§105', clase: 'A', nombre: 'Omisión de señal o semáforo', monto: 250, clasificacion: 'INFRACCION' },
  { codigo: '§106', clase: 'A', nombre: 'No ceder el paso', monto: 250, clasificacion: 'INFRACCION' },
  { codigo: '§107', clase: 'A', nombre: 'No ceder a vehículo de emergencia', monto: 500, clasificacion: 'DELITO_MENOR' },
  { codigo: '§108', clase: 'A', nombre: 'Cambio de carril indebido / zigzag', monto: 300, clasificacion: 'INFRACCION' },
  { codigo: '§109', clase: 'A', nombre: 'Circular fuera de la calzada', monto: 450, clasificacion: 'DELITO_MENOR' },
  { codigo: '§110', clase: 'A', nombre: 'Conducir en sentido contrario', monto: 550, clasificacion: 'DELITO_MENOR' },
  { codigo: '§111', clase: 'A', nombre: 'Estacionamiento ilegal / obstrucción', monto: 200, clasificacion: 'INFRACCION' },
  { codigo: '§112', clase: 'A', nombre: 'Giro / U-turn prohibido', monto: 150, clasificacion: 'INFRACCION' },
  { codigo: '§113', clase: 'A', nombre: 'Circular sin luces', monto: 250, clasificacion: 'INFRACCION' },
  { codigo: '§114', clase: 'A', nombre: 'Conducción distraída', monto: 300, clasificacion: 'INFRACCION' },
  { codigo: '§115', clase: 'A', nombre: 'Uso indebido de bocina / ruido', monto: 100, clasificacion: 'INFRACCION' },
  { codigo: '§116', clase: 'A', nombre: 'No apartarse de un control activo', monto: 300, clasificacion: 'INFRACCION' },
  { codigo: '§117', clase: 'A', nombre: 'Seguir demasiado cerca (tailgating)', monto: 200, clasificacion: 'INFRACCION' },
  { codigo: '§118', clase: 'A', nombre: 'No señalizar maniobra', monto: 150, clasificacion: 'INFRACCION' },
  { codigo: '§119', clase: 'A', nombre: 'Bloquear intersección', monto: 300, clasificacion: 'INFRACCION' },
  { codigo: '§120', clase: 'A', nombre: 'Pérdida de control del vehículo', monto: 400, clasificacion: 'DELITO_MENOR' },
  { codigo: '§121', clase: 'A', nombre: 'Equipo defectuoso visible', monto: 150, clasificacion: 'INFRACCION' },
  { codigo: '§122', clase: 'A', nombre: 'Conducir sin licencia o suspendida', monto: 500, clasificacion: 'DELITO_MENOR' },
  { codigo: '§123', clase: 'A', nombre: 'Conducir sin seguro', monto: 350, clasificacion: 'INFRACCION' },
  { codigo: '§124', clase: 'A', nombre: 'Vehículo sin matricular o registro', monto: 300, clasificacion: 'INFRACCION' },
  { codigo: '§125', clase: 'A', nombre: 'Conducción bajo efectos (DUI RP)', monto: 1500, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§201', clase: 'B', nombre: 'Conducción temeraria (reckless)', monto: 600, clasificacion: 'DELITO_MENOR' },
  { codigo: '§202', clase: 'B', nombre: 'Carreras ilegales / drag', monto: 800, clasificacion: 'DELITO_MENOR' },
  { codigo: '§203', clase: 'B', nombre: 'Chocar y huir (daños materiales)', monto: 800, clasificacion: 'DELITO_MENOR' },
  { codigo: '§204', clase: 'B', nombre: 'Chocar y huir (lesiones)', monto: 2000, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§205', clase: 'B', nombre: 'Uso del vehículo para poner en riesgo', monto: 2000, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§206', clase: 'B', nombre: 'Allanamiento de propiedad', monto: 400, clasificacion: 'DELITO_MENOR' },
  { codigo: '§207', clase: 'B', nombre: 'Vandalismo / daños a la propiedad', monto: 500, clasificacion: 'DELITO_MENOR' },
  { codigo: '§208', clase: 'B', nombre: 'Hurto menor', monto: 500, clasificacion: 'DELITO_MENOR' },
  { codigo: '§209', clase: 'B', nombre: 'Robo de vehículo (GTA)', monto: 2000, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§210', clase: 'B', nombre: 'Robo con intimidación', monto: 2000, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§211', clase: 'B', nombre: 'Allanamiento de comercio', monto: 2500, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§212', clase: 'B', nombre: 'Incendio doloso (arson)', monto: 2500, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§213', clase: 'B', nombre: 'Manipulación de vehículo ajeno', monto: 600, clasificacion: 'DELITO_MENOR' },
  { codigo: '§214', clase: 'B', nombre: 'Posesión de bienes robados', monto: 800, clasificacion: 'DELITO_MENOR' },
  { codigo: '§215', clase: 'B', nombre: 'Luces de emergencia en vehículo civil', monto: 400, clasificacion: 'INFRACCION' },
  { codigo: '§216', clase: 'B', nombre: 'Vehículo restringido en sesión', monto: 400, clasificacion: 'INFRACCION' },
  { codigo: '§301', clase: 'C', nombre: 'Conducta desordenada', monto: 350, clasificacion: 'DELITO_MENOR' },
  { codigo: '§302', clase: 'C', nombre: 'Desobediencia a orden policial', monto: 500, clasificacion: 'DELITO_MENOR' },
  { codigo: '§303', clase: 'C', nombre: 'Resistencia a la detención (sin violencia)', monto: 700, clasificacion: 'DELITO_MENOR' },
  { codigo: '§304', clase: 'C', nombre: 'Huida o elusión de control', monto: 1500, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§305', clase: 'C', nombre: 'Obstrucción a la justicia', monto: 800, clasificacion: 'DELITO_MENOR' },
  { codigo: '§306', clase: 'C', nombre: 'Identificación falsa', monto: 500, clasificacion: 'DELITO_MENOR' },
  { codigo: '§307', clase: 'C', nombre: 'Suplantación de personal de emergencia', monto: 1500, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§308', clase: 'C', nombre: 'Uso indebido de emergencias', monto: 600, clasificacion: 'DELITO_MENOR' },
  { codigo: '§309', clase: 'C', nombre: 'Denuncia policial falsa', monto: 700, clasificacion: 'DELITO_MENOR' },
  { codigo: '§310', clase: 'C', nombre: 'Soborno a funcionario', monto: 1500, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§311', clase: 'C', nombre: 'Negarse a desalojar zona', monto: 400, clasificacion: 'DELITO_MENOR' },
  { codigo: '§312', clase: 'C', nombre: 'Alteración de evidencia', monto: 1200, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§313', clase: 'C', nombre: 'Fuga de custodia', monto: 2000, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§314', clase: 'C', nombre: 'Hostigamiento a personal de emergencia', monto: 600, clasificacion: 'DELITO_MENOR' },
  { codigo: '§315', clase: 'C', nombre: 'Negarse a recibir citación', monto: 250, clasificacion: 'DELITO_MENOR' },
  { codigo: '§316', clase: 'C', nombre: 'Interferencia con bomberos / médicos', monto: 700, clasificacion: 'DELITO_MENOR' },
  { codigo: '§317', clase: 'C', nombre: 'Zona restringida de sesión', monto: 300, clasificacion: 'INFRACCION' },
  { codigo: '§318', clase: 'C', nombre: 'Incumplir instrucciones del Host (evento)', monto: 200, clasificacion: 'INFRACCION' },
  { codigo: '§319', clase: 'C', nombre: 'Obstruir carril de meet / exhibición', monto: 200, clasificacion: 'INFRACCION' },
  { codigo: '§401', clase: 'D', nombre: 'Amenazas', monto: 600, clasificacion: 'DELITO_MENOR' },
  { codigo: '§402', clase: 'D', nombre: 'Agresión simple', monto: 800, clasificacion: 'DELITO_MENOR' },
  { codigo: '§403', clase: 'D', nombre: 'Agresión agravada / con arma', monto: 2000, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§404', clase: 'D', nombre: 'Brandir arma de fuego', monto: 1200, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§405', clase: 'D', nombre: 'Disparo en zona urbana', monto: 2500, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§406', clase: 'D', nombre: 'Posesión de sustancia controlada (RP)', monto: 700, clasificacion: 'DELITO_MENOR' },
  { codigo: '§407', clase: 'D', nombre: 'Tráfico de sustancia controlada (RP)', monto: 2000, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§408', clase: 'D', nombre: 'Secuestro / retención ilegal', monto: 3000, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§409', clase: 'D', nombre: 'Asalto a oficial', monto: 2500, clasificacion: 'DELITO_GRAVE' },
  { codigo: '§410', clase: 'D', nombre: 'Homicidio en RP (escena autorizada)', monto: 5000, clasificacion: 'DELITO_GRAVE' },
];

/** Choices para /multar (máx. 25). value incluye [$monto] para parseo. */
export const MULTAR_CHOICES = [
  { name: '§101 Exceso leve 1-10 MPH — $150', value: '§101 Exceso leve de velocidad (1-10 MPH) [$150]' },
  { name: '§102 Exceso moderado 11-20 MPH — $300', value: '§102 Exceso moderado de velocidad (11-20 MPH) [$300]' },
  { name: '§103 Exceso grave 21+ MPH — $600', value: '§103 Exceso grave de velocidad (21+ MPH) [$600]' },
  { name: '§104 Exceso en zona especial — $400', value: '§104 Exceso en zona especial [$400]' },
  { name: '§105 Semáforo / señal omitida — $250', value: '§105 Omisión de señal o semáforo [$250]' },
  { name: '§107 No ceder a emergencia — $500', value: '§107 No ceder a vehículo de emergencia [$500]' },
  { name: '§110 Sentido contrario — $550', value: '§110 Conducir en sentido contrario [$550]' },
  { name: '§111 Estacionamiento ilegal — $200', value: '§111 Estacionamiento ilegal / obstrucción [$200]' },
  { name: '§114 Conducción distraída — $300', value: '§114 Conducción distraída [$300]' },
  { name: '§116 No apartarse de control — $300', value: '§116 No apartarse de un control activo [$300]' },
  { name: '§122 Sin licencia / suspendida — $500', value: '§122 Conducir sin licencia o suspendida [$500]' },
  { name: '§123 Sin seguro — $350', value: '§123 Conducir sin seguro [$350]' },
  { name: '§124 Sin matrícula / registro — $300', value: '§124 Vehículo sin matricular o registro [$300]' },
  { name: '§125 DUI / conducción ebria RP — $1.500', value: '§125 Conducción bajo efectos (DUI RP) [$1500]' },
  { name: '§201 Conducción temeraria — $600', value: '§201 Conducción temeraria (reckless) [$600]' },
  { name: '§202 Carreras ilegales — $800', value: '§202 Carreras ilegales / drag [$800]' },
  { name: '§203 Chocar y huir (daños) — $800', value: '§203 Chocar y huir (daños materiales) [$800]' },
  { name: '§204 Chocar y huir (lesiones) — $2.000', value: '§204 Chocar y huir (lesiones) [$2000]' },
  { name: '§209 Robo de vehículo (GTA) — $2.000', value: '§209 Robo de vehículo (GTA) [$2000]' },
  { name: '§215 Luces emergencia en civil — $400', value: '§215 Luces de emergencia en vehículo civil [$400]' },
  { name: '§216 Vehículo restringido sesión — $400', value: '§216 Vehículo restringido en sesión [$400]' },
  { name: '§302 Desobediencia a orden — $500', value: '§302 Desobediencia a orden policial [$500]' },
  { name: '§303 Resistencia a detención — $700', value: '§303 Resistencia a la detención (sin violencia) [$700]' },
  { name: '§304 Huida / elusión de control — $1.500', value: '§304 Huida o elusión de control [$1500]' },
  { name: '§306 Identificación falsa — $500', value: '§306 Identificación falsa [$500]' },
];

/** Extrae monto numérico del value de una choice: "... [$1500]" */
export function parseMontoFromRazon(razon) {
  if (!razon || typeof razon !== 'string') return 0;
  const m = razon.match(/\[\$\s*([\d.]+)\]/);
  if (!m) return 0;
  return Math.max(0, Math.round(Number(String(m[1]).replace(/\./g, ''))));
}

/** Suma montos de varias razones (choices). */
export function sumarMontosRazones(razones) {
  return (razones || []).reduce((acc, r) => acc + parseMontoFromRazon(r), 0);
}
