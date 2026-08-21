/**
 * Tienda del servidor 00Y4n — catálogo en español
 * Misma economía que /work (gestorEconomia)
 */

export const TIENDA_BANNER =
  'https://cdn.discordapp.com/attachments/1505017301089652898/1536043757949161492/Server_Tienda_1.png';

export const TIENDA_COLOR = 0xfb8b66;

/** Solo se puede usar /tienda en canales cuyo nombre sea exactamente este */
export const TIENDA_CANAL_NOMBRE = 'comandos';

export const ROLES_TIENDA = {
  seguro_regular: '1538284113532821637',
  seguro_lujo: '1538284038077415474',
  fastpass: '1503769793474597027',
  permiso_discapacidad: '1538284668703608833',
  licencia_conducir: '1529872838557962431',
  // licencia comercial (si se usa otro rol, cambiar ID)
  licencia_comercial: '1529872838557962431',
  permiso_limusina: '1521300094710714568'
};

/**
 * type:
 *  - role          → compra otorga rol (una vez / permanente)
 *  - role_weekly   → seguro: rol + cobro semanal automático
 *  - consumable    → va al inventario, se usa con /tienda comer|fumar
 *  - gift          → va al inventario, se regala con /tienda regalar
 */
export const TIENDA_ITEMS = {
  // —— Permisos y Seguros ——
  permiso_discapacidad: {
    id: 'permiso_discapacidad',
    name: 'Permiso de estacionamiento para discapacitados',
    price: 350,
    category: 'permisos',
    type: 'role',
    roleId: ROLES_TIENDA.permiso_discapacidad,
    description: 'Permiso oficial de estacionamiento prioritario.'
  },
  seguro_regular: {
    id: 'seguro_regular',
    name: 'Seguro Regular',
    price: 750,
    category: 'permisos',
    type: 'role_weekly',
    roleId: ROLES_TIENDA.seguro_regular,
    weekly: 750,
    description: 'Cobertura estándar. Se debita $750 cada 7 días automáticamente.'
  },
  seguro_lujo: {
    id: 'seguro_lujo',
    name: 'Seguro de Lujo',
    price: 1500,
    category: 'permisos',
    type: 'role_weekly',
    roleId: ROLES_TIENDA.seguro_lujo,
    weekly: 1500,
    description: 'Cobertura premium. Se debita $1.500 cada 7 días automáticamente.'
  },
  fastpass: {
    id: 'fastpass',
    name: 'FastPass',
    price: 700000,
    category: 'permisos',
    type: 'role',
    roleId: ROLES_TIENDA.fastpass,
    description: 'Acceso prioritario a sesiones y eventos (rol FastPass).'
  },
  licencia_conducir: {
    id: 'licencia_conducir',
    name: 'Licencia de Conducir (Express)',
    price: 75000,
    category: 'permisos',
    type: 'role',
    roleId: ROLES_TIENDA.licencia_conducir,
    description: 'Vía express: obtenés la licencia de conducir SWFL sin rendir el examen teórico. Precio premium ($75.000).'
  },
  licencia_comercial: {
    id: 'licencia_comercial',
    name: 'Licencia comercial',
    price: 1000000,
    category: 'permisos',
    type: 'role',
    roleId: ROLES_TIENDA.licencia_comercial,
    description: 'Licencia para uso comercial de vehículos (precio premium).'
  },
  permiso_limusina: {
    id: 'permiso_limusina',
    name: 'Permiso de limusina',
    price: 1000000,
    category: 'permisos',
    type: 'role',
    roleId: ROLES_TIENDA.permiso_limusina,
    description: 'Autorización para conducir limusinas en sesiones.'
  },

  // —— Regalos ——
  rosa: {
    id: 'rosa',
    name: 'Rosa',
    price: 10,
    category: 'regalos',
    type: 'gift',
    description: 'Una rosa para regalar a otro ciudadano.'
  },

  // —— Comida ——
  bolsa_bodega: {
    id: 'bolsa_bodega',
    name: 'Bolsa de bodega',
    price: 10,
    category: 'comida',
    type: 'consumable',
    consumeCmd: 'comer',
    description: 'Snack rápido de la bodega de la esquina.'
  },
  bandeja_cookout: {
    id: 'bandeja_cookout',
    name: 'Bandeja Cookout',
    price: 12,
    category: 'comida',
    type: 'consumable',
    consumeCmd: 'comer',
    description: 'Bandeja clásica de cookout.'
  },
  popeyes: {
    id: 'popeyes',
    name: 'Popeyes',
    price: 15,
    category: 'comida',
    type: 'consumable',
    consumeCmd: 'comer',
    description: 'Pollo frito estilo Popeyes.'
  },
  ramen: {
    id: 'ramen',
    name: 'Ramen',
    price: 5,
    category: 'comida',
    type: 'consumable',
    consumeCmd: 'comer',
    description: 'Un bowl de ramen caliente.'
  },
  sushi: {
    id: 'sushi',
    name: 'Sushi',
    price: 26,
    category: 'comida',
    type: 'consumable',
    consumeCmd: 'comer',
    description: 'Bandeja de sushi.'
  },
  langosta: {
    id: 'langosta',
    name: 'Langosta',
    price: 500,
    category: 'comida',
    type: 'consumable',
    consumeCmd: 'comer',
    description: 'Langosta de lujo.'
  },

  // —— Fuma y Bebe ——
  pack_newport: {
    id: 'pack_newport',
    name: 'Pack de Newport',
    price: 17,
    category: 'fuma',
    type: 'consumable',
    consumeCmd: 'fumar',
    description: 'Pack de cigarrillos Newport.'
  },
  shot_henny: {
    id: 'shot_henny',
    name: 'Shot de Henny',
    price: 12,
    category: 'fuma',
    type: 'consumable',
    consumeCmd: 'fumar',
    description: 'Un shot de Hennessy.'
  },
  joint: {
    id: 'joint',
    name: '1 Joint',
    price: 10,
    category: 'fuma',
    type: 'consumable',
    consumeCmd: 'fumar',
    description: 'Un joint para el momento.'
  }
};

export const TIENDA_CATEGORIAS = [
  {
    id: 'permisos',
    label: 'Permisos y Seguros',
    emoji: '📋',
    description: 'Seguros semanales, FastPass y permisos oficiales'
  },
  {
    id: 'regalos',
    label: 'Regalos',
    emoji: '🎁',
    description: 'Ítems para regalar a otros ciudadanos'
  },
  {
    id: 'comida',
    label: 'Comida',
    emoji: '🍔',
    description: 'Comida consumible del servidor'
  },
  {
    id: 'fuma',
    label: 'Fuma y Bebe',
    emoji: '🚬',
    description: 'Cigarrillos, joint y tragos'
  }
];

export function getItem(id) {
  return TIENDA_ITEMS[id] || null;
}

export function getItemsByCategory(categoryId) {
  return Object.values(TIENDA_ITEMS).filter((i) => i.category === categoryId);
}

export function formatMoney(n) {
  return `$${Number(n || 0).toLocaleString('es-AR')}`;
}
