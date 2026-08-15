import { getFromDb, setInDb } from './database.js';
import { obtenerSaldo, restarSaldo } from './gestorEconomia.js';
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

/** Inventario: { itemId: quantity } */
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

/**
 * Compra un ítem. Devuelve { ok, mensaje, saldoNuevo? }
 */
export async function comprarItem(member, itemId) {
  const item = getItem(itemId);
  if (!item) return { ok: false, mensaje: 'Ítem no encontrado.' };

  const userId = member.id;
  const saldo = await obtenerSaldo(userId);
  if (saldo < item.price) {
    return {
      ok: false,
      mensaje: `No tenés saldo suficiente. Necesitás **${formatMoney(item.price)}** y tenés **${formatMoney(saldo)}**.`
    };
  }

  // Roles permanentes: no recomprar si ya lo tiene
  if (item.type === 'role' && item.roleId) {
    if (member.roles.cache.has(item.roleId)) {
      return { ok: false, mensaje: `Ya tenés el rol de **${item.name}**.` };
    }
  }

  // Seguros: si ya tiene uno, avisar (se reemplaza)
  if (item.type === 'role_weekly') {
    const actual = await obtenerSeguro(userId);
    if (actual && actual.itemId === item.id) {
      return { ok: false, mensaje: `Ya tenés **${item.name}** activo.` };
    }
  }

  const nuevoSaldo = await restarSaldo(userId, item.price, {
    tipo: 'EGRESO',
    motivo: `Tienda: compra de ${item.name}`
  });

  try {
    if (item.type === 'role' || item.type === 'role_weekly') {
      if (item.roleId) {
        // Si compra seguro, quitar el otro seguro si aplica
        if (item.type === 'role_weekly') {
          const prev = await obtenerSeguro(userId);
          if (prev?.roleId && prev.roleId !== item.roleId) {
            try {
              await member.roles.remove(prev.roleId, 'Cambio de seguro en tienda');
            } catch (e) {
              logger.warn(`[tienda] No se pudo quitar rol seguro anterior: ${e.message}`);
            }
          }
          // Quitar el otro rol de seguro del catálogo por si quedó
          for (const rid of [ROLES_TIENDA.seguro_regular, ROLES_TIENDA.seguro_lujo]) {
            if (rid !== item.roleId && member.roles.cache.has(rid)) {
              try {
                await member.roles.remove(rid, 'Cambio de seguro en tienda');
              } catch (_) {}
            }
          }

          const data = {
            itemId: item.id,
            roleId: item.roleId,
            weekly: item.weekly,
            nextCharge: Date.now() + WEEK_MS,
            purchasedAt: Date.now()
          };
          await setInDb(SEGURO_KEY(userId), data);
          await registrarEnIndiceSeguros(userId);
        }

        try {
          await member.roles.add(item.roleId, `Compra en tienda: ${item.name}`);
        } catch (e) {
          logger.error(`[tienda] Error al dar rol ${item.roleId}:`, e.message);
          return {
            ok: true,
            saldoNuevo: nuevoSaldo,
            mensaje:
              `Pagaste **${formatMoney(item.price)}** por **${item.name}**, pero no pude asignar el rol. ` +
              `Avisá a un staff (permisos del bot / jerarquía de roles). Saldo: **${formatMoney(nuevoSaldo)}**.`
          };
        }
      }

      const extra =
        item.type === 'role_weekly'
          ? `\nEl cobro semanal de **${formatMoney(item.weekly)}** se descontará automáticamente. Si no hay saldo, se pierde el seguro.`
          : '';

      return {
        ok: true,
        saldoNuevo: nuevoSaldo,
        mensaje: `Compraste **${item.name}** por **${formatMoney(item.price)}**.${extra}\nSaldo restante: **${formatMoney(nuevoSaldo)}**.`
      };
    }

    // Inventario (comida, fuma, regalos)
    await agregarAlInventario(userId, item.id, 1);
    return {
      ok: true,
      saldoNuevo: nuevoSaldo,
      mensaje: `Compraste **${item.name}** por **${formatMoney(item.price)}**. Se agregó a tu inventario.\nSaldo restante: **${formatMoney(nuevoSaldo)}**.`
    };
  } catch (err) {
    logger.error('[tienda] Error post-compra:', err);
    return {
      ok: true,
      saldoNuevo: nuevoSaldo,
      mensaje: `Se descontó **${formatMoney(item.price)}**, pero hubo un error al entregar el ítem. Contactá staff.`
    };
  }
}

export async function consumirItem(userId, itemId) {
  const item = getItem(itemId);
  if (!item || item.type !== 'consumable') {
    return { ok: false, mensaje: 'Ese ítem no se puede consumir.' };
  }
  const ok = await quitarDelInventario(userId, itemId, 1);
  if (!ok) {
    return { ok: false, mensaje: `No tenés **${item.name}** en el inventario. Compralo en \`/tienda abrir\`.` };
  }
  return { ok: true, item };
}

export async function regalarItem(fromId, toId, itemId) {
  const item = getItem(itemId);
  if (!item || item.type !== 'gift') {
    return { ok: false, mensaje: 'Ese ítem no se puede regalar.' };
  }
  if (String(fromId) === String(toId)) {
    return { ok: false, mensaje: 'No podés regalarte a vos mismo.' };
  }
  const ok = await quitarDelInventario(fromId, itemId, 1);
  if (!ok) {
    return { ok: false, mensaje: `No tenés **${item.name}** en el inventario.` };
  }
  await agregarAlInventario(toId, itemId, 1);
  return { ok: true, item };
}

/**
 * Cobro semanal de seguros. Llamar desde cron.
 */
export async function procesarCobrosSeguros(client) {
  const index = (await getFromDb(SEGURO_INDEX_KEY, [])) || [];
  const userIds = Array.isArray(index) ? index.map(String) : [];
  let cobrados = 0;
  let cancelados = 0;

  for (const userId of userIds) {
    try {
      const data = await obtenerSeguro(userId);
      if (!data || !data.nextCharge) continue;
      if (Date.now() < data.nextCharge) continue;

      const item = getItem(data.itemId);
      const monto = Number(data.weekly || item?.weekly || 0);
      if (monto <= 0) continue;

      const saldo = await obtenerSaldo(userId);
      // Buscar miembro en todos los guilds del bot
      let member = null;
      for (const g of client.guilds.cache.values()) {
        member = await g.members.fetch(userId).catch(() => null);
        if (member) break;
      }

      if (saldo >= monto) {
        await restarSaldo(userId, monto, {
          tipo: 'EGRESO',
          motivo: `Tienda: renovación semanal ${item?.name || data.itemId}`
        });
        data.nextCharge = Date.now() + WEEK_MS;
        await setInDb(SEGURO_KEY(userId), data);
        cobrados += 1;

        // DM opcional
        try {
          const user = await client.users.fetch(userId).catch(() => null);
          if (user) {
            await user.send({
              embeds: [
                {
                  title: 'Póliza de seguro renovada',
                  description:
                    `Se debitó **${formatMoney(monto)}** de tu balance por la renovación de **${item?.name || 'tu seguro'}**.\n` +
                    `Próximo cobro: <t:${Math.floor(data.nextCharge / 1000)}:R>.\n` +
                    `Si no tenés saldo en el próximo cobro, el seguro se cancela y se quita el rol.`,
                  color: 0xfb8b66
                }
              ]
            }).catch(() => null);
          }
        } catch (_) {}
      } else {
        // Cancelar seguro
        if (member && data.roleId) {
          try {
            await member.roles.remove(data.roleId, 'Seguro cancelado: saldo insuficiente');
          } catch (e) {
            logger.warn(`[tienda] No se pudo quitar rol seguro a ${userId}: ${e.message}`);
          }
        }
        await setInDb(SEGURO_KEY(userId), null);
        await quitarDelIndiceSeguros(userId);
        cancelados += 1;

        try {
          const user = await client.users.fetch(userId).catch(() => null);
          if (user) {
            await user.send({
              embeds: [
                {
                  title: 'Seguro cancelado',
                  description:
                    `No tenías saldo suficiente (**${formatMoney(monto)}**) para renovar **${item?.name || 'tu seguro'}**.\n` +
                    `El rol fue removido. Podés volver a comprarlo en \`/tienda abrir\`.`,
                  color: 0xff3333
                }
              ]
            }).catch(() => null);
          }
        } catch (_) {}
      }
    } catch (err) {
      logger.error(`[tienda] Error cobrando seguro a ${userId}:`, err.message);
    }
  }

  if (cobrados || cancelados) {
    logger.info(`[tienda] Seguros: ${cobrados} renovados, ${cancelados} cancelados.`);
  }
  return { cobrados, cancelados };
}

export function textoInventario(inv) {
  const entries = Object.entries(inv || {}).filter(([, q]) => Number(q) > 0);
  if (!entries.length) return '_Inventario vacío._';

  const porCat = { regalos: [], comida: [], fuma: [], otros: [] };
  for (const [id, qty] of entries) {
    const item = TIENDA_ITEMS[id];
    const line = `• **${item?.name || id}** ×${qty}`;
    if (!item) porCat.otros.push(line);
    else if (item.category === 'regalos') porCat.regalos.push(line);
    else if (item.category === 'comida') porCat.comida.push(line);
    else if (item.category === 'fuma') porCat.fuma.push(line);
    else porCat.otros.push(line);
  }

  const parts = [];
  if (porCat.regalos.length) parts.push(`**Regalos**\n${porCat.regalos.join('\n')}`);
  if (porCat.comida.length) parts.push(`**Comida**\n${porCat.comida.join('\n')}`);
  if (porCat.fuma.length) parts.push(`**Fuma y Bebe**\n${porCat.fuma.join('\n')}`);
  if (porCat.otros.length) parts.push(`**Otros**\n${porCat.otros.join('\n')}`);
  return parts.join('\n\n');
}
