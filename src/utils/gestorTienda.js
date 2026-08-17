import { getFromDb, setInDb } from './database.js';
import { obtenerSaldo, restarSaldo, agregarSaldo } from './gestorEconomia.js';
import {
  TIENDA_ITEMS,
  getItem,
  ROLES_TIENDA,
  formatMoney
} from '../config/tiendaServer.js';
import { logger } from './logger.js';

const INV_KEY = (userId) => `tienda:inv:${userId}`;
const SEGURO_KEY = (userId) => `tienda:seguro:${userId}`;
const SEGURO_INDEX_KEY = 'tienda:seguro:index';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function obtenerInventario(userId) {
  const inv = await getFromDb(INV_KEY(userId), {});
  return inv && typeof inv === 'object' ? inv : {};
}
export async function guardarInventario(userId, inv) {
  await setInDb(INV_KEY(userId), inv || {});
}
export async function agregarAlInventario(userId, itemId, cantidad = 1) {
  const inv = await obtenerInventario(userId);
  inv[itemId] = (Number(inv[itemId]) || 0) + cantidad;
  await guardarInventario(userId, inv);
  return inv;
}
export async function quitarDelInventario(userId, itemId, cantidad = 1) {
  const inv = await obtenerInventario(userId);
  const actual = Number(inv[itemId]) || 0;
  if (actual < cantidad) return false;
  const nuevo = actual - cantidad;
  if (nuevo <= 0) delete inv[itemId];
  else inv[itemId] = nuevo;
  await guardarInventario(userId, inv);
  return true;
}
export async function obtenerSeguro(userId) {
  return (await getFromDb(SEGURO_KEY(userId), null)) || null;
}
async function registrarEnIndiceSeguros(userId) {
  const index = (await getFromDb(SEGURO_INDEX_KEY, [])) || [];
  const arr = Array.isArray(index) ? index.map(String) : [];
  if (!arr.includes(String(userId))) {
    arr.push(String(userId));
    await setInDb(SEGURO_INDEX_KEY, arr);
  }
}
async function quitarDelIndiceSeguros(userId) {
  const index = (await getFromDb(SEGURO_INDEX_KEY, [])) || [];
  const arr = (Array.isArray(index) ? index : []).map(String).filter((id) => id !== String(userId));
  await setInDb(SEGURO_INDEX_KEY, arr);
}

export async function comprarItem(member, itemId) {
  const item = getItem(itemId);
  if (!item) return { ok: false, mensaje: 'Ítem no encontrado.' };
  const userId = String(member.id);
  const saldo = await obtenerSaldo(userId);
  if (saldo < item.price) {
    return { ok: false, mensaje: `No tenés saldo suficiente. Necesitás **${formatMoney(item.price)}** y tenés **${formatMoney(saldo)}**.` };
  }
  if (item.type === 'role' && item.roleId && member.roles.cache.has(String(item.roleId))) {
    return { ok: false, mensaje: `Ya tenés el rol de **${item.name}**.` };
  }
  if (item.type === 'role_weekly') {
    const actual = await obtenerSeguro(userId);
    if (actual && actual.itemId === item.id) {
      return { ok: false, mensaje: `Ya tenés **${item.name}** activo.` };
    }
  }

  let guildMember = member;
  let roleObj = null;
  const roleIdStr = item.roleId ? String(item.roleId) : null;

  if (item.type === 'role' || item.type === 'role_weekly') {
    if (!roleIdStr) return { ok: false, mensaje: `El ítem **${item.name}** no tiene rol configurado.` };
    const guild = member.guild;
    if (!guild) return { ok: false, mensaje: 'No pude obtener el servidor.' };
    try { guildMember = await guild.members.fetch({ user: userId, force: true }); } catch (e) { guildMember = member; }
    roleObj = guild.roles.cache.get(roleIdStr) || (await guild.roles.fetch(roleIdStr).catch(() => null));
    if (!roleObj) return { ok: false, mensaje: `El rol de **${item.name}** no existe (ID: \`${roleIdStr}\`).` };
    const me = guild.members.me || (await guild.members.fetchMe().catch(() => null));
    if (me) {
      if (roleObj.position >= me.roles.highest.position) {
        return { ok: false, mensaje: `No puedo dar **${roleObj.name}**: está por encima del rol del bot.` };
      }
      if (!me.permissions.has('ManageRoles')) {
        return { ok: false, mensaje: 'El bot no tiene **Gestionar roles**.' };
      }
    }
  }

  const nuevoSaldo = await restarSaldo(userId, item.price, { tipo: 'EGRESO', motivo: `Tienda: compra de ${item.name}` });
  const reembolsar = async (motivo) => {
    try { await agregarSaldo(userId, item.price, { tipo: 'INGRESO', motivo: `Tienda: reembolso — ${motivo}` }); }
    catch (e) { logger.error(`[tienda] reembolso: ${e.message}`); }
  };

  try {
    if (item.type === 'role' || item.type === 'role_weekly') {
      if (item.type === 'role_weekly') {
        const prev = await obtenerSeguro(userId);
        if (prev?.roleId && String(prev.roleId) !== roleIdStr) {
          try { await guildMember.roles.remove(String(prev.roleId), 'Cambio de seguro'); } catch (_) {}
          try { await quitarDelInventario(userId, prev.itemId, 999); } catch (_) {}
        }
        for (const rid of [ROLES_TIENDA.seguro_regular, ROLES_TIENDA.seguro_lujo]) {
          if (String(rid) !== roleIdStr && guildMember.roles.cache.has(String(rid))) {
            try { await guildMember.roles.remove(String(rid), 'Cambio de seguro'); } catch (_) {}
          }
        }
      }
      try {
        await guildMember.roles.add(roleObj || roleIdStr, `Compra tienda: ${item.name}`);
      } catch (e) {
        await reembolsar(`fallo rol ${item.name}`);
        if (item.type === 'role_weekly') { await setInDb(SEGURO_KEY(userId), null); await quitarDelIndiceSeguros(userId); }
        const s = await obtenerSaldo(userId);
        return { ok: false, saldoNuevo: s, mensaje: `No pude asignar el rol **${item.name}** (\`${e.message}\`). Se reembolsó. Saldo: **${formatMoney(s)}**.` };
      }
      if (item.type === 'role_weekly') {
        await setInDb(SEGURO_KEY(userId), { itemId: item.id, roleId: roleIdStr, weekly: item.weekly, nextCharge: Date.now() + WEEK_MS, purchasedAt: Date.now() });
        await registrarEnIndiceSeguros(userId);
      }
      // Inventario: permisos y seguros también se registran
      try {
        const inv = await obtenerInventario(userId);
        inv[item.id] = 1;
        await guardarInventario(userId, inv);
      } catch (_) {}
      const extra = item.type === 'role_weekly' ? `\nCobro semanal **${formatMoney(item.weekly)}** automático.` : '';
      return {
        ok: true,
        saldoNuevo: nuevoSaldo,
        mensaje: `Compraste **${item.name}** por **${formatMoney(item.price)}** y se te asignó el rol **${roleObj?.name || item.name}**.${extra}\nQuedó en tu inventario.\nSaldo: **${formatMoney(nuevoSaldo)}**.`
      };
    }
    await agregarAlInventario(userId, item.id, 1);
    return { ok: true, saldoNuevo: nuevoSaldo, mensaje: `Compraste **${item.name}** por **${formatMoney(item.price)}**. En inventario.\nSaldo: **${formatMoney(nuevoSaldo)}**.` };
  } catch (err) {
    logger.error('[tienda] post-compra:', err);
    await reembolsar(`error ${item.name}`);
    const s = await obtenerSaldo(userId);
    return { ok: false, saldoNuevo: s, mensaje: `Error al entregar. Se reembolsó. Saldo: **${formatMoney(s)}**.` };
  }
}

export async function consumirItem(userId, itemId) {
  const item = getItem(itemId);
  if (!item || item.type !== 'consumable') return { ok: false, mensaje: 'Ese ítem no se puede consumir.' };
  const ok = await quitarDelInventario(userId, itemId, 1);
  if (!ok) return { ok: false, mensaje: `No tenés **${item.name}** en el inventario.` };
  return { ok: true, item };
}

export async function regalarItem(fromId, toId, itemId) {
  const item = getItem(itemId);
  if (!item || item.type !== 'gift') return { ok: false, mensaje: 'Ese ítem no se puede regalar.' };
  if (String(fromId) === String(toId)) return { ok: false, mensaje: 'No podés regalarte a vos mismo.' };
  const ok = await quitarDelInventario(fromId, itemId, 1);
  if (!ok) return { ok: false, mensaje: `No tenés **${item.name}** en el inventario.` };
  await agregarAlInventario(toId, itemId, 1);
  return { ok: true, item };
}

export async function procesarCobrosSeguros(client) {
  const index = (await getFromDb(SEGURO_INDEX_KEY, [])) || [];
  const userIds = Array.isArray(index) ? index.map(String) : [];
  let cobrados = 0, cancelados = 0;
  for (const userId of userIds) {
    try {
      const data = await obtenerSeguro(userId);
      if (!data || !data.nextCharge || Date.now() < data.nextCharge) continue;
      const item = getItem(data.itemId);
      const monto = Number(data.weekly || item?.weekly || 0);
      if (monto <= 0) continue;
      const saldo = await obtenerSaldo(userId);
      let member = null;
      for (const g of client.guilds.cache.values()) {
        member = await g.members.fetch(userId).catch(() => null);
        if (member) break;
      }
      if (saldo >= monto) {
        await restarSaldo(userId, monto, { tipo: 'EGRESO', motivo: `Tienda: renovación ${item?.name || data.itemId}` });
        data.nextCharge = Date.now() + WEEK_MS;
        await setInDb(SEGURO_KEY(userId), data);
        cobrados++;
      } else {
        if (member && data.roleId) {
          try { await member.roles.remove(data.roleId, 'Seguro cancelado'); } catch (_) {}
        }
        await setInDb(SEGURO_KEY(userId), null);
        await quitarDelIndiceSeguros(userId);
        try { await quitarDelInventario(userId, data.itemId, 999); } catch (_) {}
        cancelados++;
      }
    } catch (err) {
      logger.error(`[tienda] cobro seguro ${userId}:`, err.message);
    }
  }
  if (cobrados || cancelados) logger.info(`[tienda] Seguros: ${cobrados} renovados, ${cancelados} cancelados.`);
  return { cobrados, cancelados };
}

export function textoInventario(inv) {
  const entries = Object.entries(inv || {}).filter(([, q]) => Number(q) > 0);
  if (!entries.length) return '_Inventario vacío._';
  const porCat = { permisos: [], regalos: [], comida: [], fuma: [], otros: [] };
  for (const [id, qty] of entries) {
    const item = TIENDA_ITEMS[id];
    const line = (item?.type === 'role' || item?.type === 'role_weekly')
      ? `• **${item?.name || id}**`
      : `• **${item?.name || id}** ×${qty}`;
    if (!item) porCat.otros.push(line);
    else if (item.category === 'permisos') porCat.permisos.push(line);
    else if (item.category === 'regalos') porCat.regalos.push(line);
    else if (item.category === 'comida') porCat.comida.push(line);
    else if (item.category === 'fuma') porCat.fuma.push(line);
    else porCat.otros.push(line);
  }
  const parts = [];
  if (porCat.permisos.length) parts.push(`**Permisos y Seguros**\n${porCat.permisos.join('\n')}`);
  if (porCat.regalos.length) parts.push(`**Regalos**\n${porCat.regalos.join('\n')}`);
  if (porCat.comida.length) parts.push(`**Comida**\n${porCat.comida.join('\n')}`);
  if (porCat.fuma.length) parts.push(`**Fuma y Bebe**\n${porCat.fuma.join('\n')}`);
  if (porCat.otros.length) parts.push(`**Otros**\n${porCat.otros.join('\n')}`);
  return parts.join('\n\n');
}

export async function armarInventarioCompleto(userId, member = null) {
  const inv = { ...(await obtenerInventario(userId)) };
  const seguro = await obtenerSeguro(userId);
  if (member?.roles?.cache) {
    for (const item of Object.values(TIENDA_ITEMS)) {
      if ((item.type !== 'role' && item.type !== 'role_weekly') || !item.roleId) continue;
      if (member.roles.cache.has(String(item.roleId))) {
        inv[item.id] = Math.max(Number(inv[item.id]) || 0, 1);
      } else if (item.type === 'role' && inv[item.id]) {
        delete inv[item.id];
      }
    }
  }
  if (seguro?.itemId) inv[seguro.itemId] = 1;
  let cuerpo = textoInventario(inv);
  if (seguro?.itemId) {
    const it = getItem(seguro.itemId);
    const cobro = seguro.nextCharge
      ? ` — próximo cobro <t:${Math.floor(seguro.nextCharge / 1000)}:R> (${formatMoney(seguro.weekly)})`
      : '';
    cuerpo += `\n\n**Detalle del seguro**\n• **${it?.name || seguro.itemId}**${cobro}`;
  }
  return { texto: cuerpo, inv, seguro };
}
