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

  const userId = member.id;
  const saldo = await obtenerSaldo(userId);
  if (saldo < item.price) {
    return {
      ok: false,
      mensaje: `No tenés saldo suficiente. Necesitás **${formatMoney(item.price)}** y tenés **${formatMoney(saldo)}**.`
    };
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
    if (!roleIdStr) {
      return { ok: false, mensaje: `El ítem **${item.name}** no tiene rol configurado. Avisá a un staff.` };
    }
    const guild = member.guild;
    if (!guild) return { ok: false, mensaje: 'No pude obtener el servidor. Reintentá.' };

    try {
      guildMember = await guild.members.fetch({ user: userId, force: true });
    } catch (e) {
      logger.warn(`[tienda] fetch member: ${e.message}`);
      guildMember = member;
    }

    roleObj = guild.roles.cache.get(roleIdStr) || (await guild.roles.fetch(roleIdStr).catch(() => null));
    if (!roleObj) {
      return {
        ok: false,
        mensaje: `El rol de **${item.name}** no existe (ID: \`${roleIdStr}\`). Revisá el ID en la configuración.`
      };
    }

    const me = guild.members.me || (await guild.members.fetchMe().catch(() => null));
    if (me) {
      if (roleObj.position >= me.roles.highest.position) {
        return {
          ok: false,
          mensaje:
            `No puedo dar **${roleObj.name}**: está al mismo nivel o por encima del rol del bot (**${me.roles.highest.name}**).\n` +
            `Mové **${roleObj.name}** *debajo* de **${me.roles.highest.name}** en Ajustes → Roles.`
        };
      }
      if (!me.permissions.has('ManageRoles')) {
        return {
          ok: false,
          mensaje: 'El bot no tiene **Gestionar roles**. Activálo en el rol del bot (Southwest Florida 00Y4n).'
        };
      }
    }
  }

  const nuevoSaldo = await restarSaldo(userId, item.price, {
    tipo: 'EGRESO',
    motivo: `Tienda: compra de ${item.name}`
  });

  const reembolsar = async (motivo) => {
    try {
      await agregarSaldo(userId, item.price, { tipo: 'INGRESO', motivo: `Tienda: reembolso — ${motivo}` });
    } catch (e) {
      logger.error(`[tienda] Falló reembolso a ${userId}:`, e.message);
    }
  };

  try {
    if (item.type === 'role' || item.type === 'role_weekly') {
      if (item.type === 'role_weekly') {
        const prev = await obtenerSeguro(userId);
        if (prev?.roleId && String(prev.roleId) !== roleIdStr) {
          try { await guildMember.roles.remove(String(prev.roleId), 'Cambio de seguro en tienda'); } catch (e) {
            logger.warn(`[tienda] No se pudo quitar rol seguro anterior: ${e.message}`);
          }
        }
        for (const rid of [ROLES_TIENDA.seguro_regular, ROLES_TIENDA.seguro_lujo]) {
          if (String(rid) !== roleIdStr && guildMember.roles.cache.has(String(rid))) {
            try { await guildMember.roles.remove(String(rid), 'Cambio de seguro en tienda'); } catch (_) {}
          }
        }
      }

      try {
        await guildMember.roles.add(roleObj || roleIdStr, `Compra en tienda: ${item.name}`);
      } catch (e) {
        logger.error(`[tienda] Error al dar rol ${roleIdStr}:`, e.message);
        await reembolsar(`fallo al asignar rol ${item.name}`);
        if (item.type === 'role_weekly') {
          await setInDb(SEGURO_KEY(userId), null);
          await quitarDelIndiceSeguros(userId);
        }
        const saldoAhora = await obtenerSaldo(userId);
        return {
          ok: false,
          saldoNuevo: saldoAhora,
          mensaje:
            `No pude asignar el rol **${item.name}**.\nError: \`${e.message}\`\n` +
            `Se te **reembolsó**. Saldo: **${formatMoney(saldoAhora)}**.\n` +
            `Revisá: Gestionar roles + el rol de la tienda **debajo** del bot.`
        };
      }

      // Confiar en roles.add si no tiró error; force fetch solo para log
      let tieneRol = guildMember.roles.cache.has(roleIdStr) || (roleObj && guildMember.roles.cache.has(roleObj.id));
      if (!tieneRol) {
        try {
          const refreshed = await guildMember.guild.members.fetch({ user: userId, force: true });
          tieneRol = refreshed.roles.cache.has(roleIdStr) || (roleObj && refreshed.roles.cache.has(roleObj.id));
        } catch (_) {}
      }
      if (!tieneRol) {
        try {
          await guildMember.roles.add(roleObj || roleIdStr, `Compra en tienda (reintento): ${item.name}`);
          const again = await guildMember.guild.members.fetch({ user: userId, force: true }).catch(() => guildMember);
          tieneRol = again.roles.cache.has(roleIdStr) || (roleObj && again.roles.cache.has(roleObj.id));
        } catch (e) {
          logger.error(`[tienda] Reintento add: ${e.message}`);
        }
      }

      // Si add no tiró error, damos por buena la compra aunque el cache falle
      // (el falso negativo de cache era el bug anterior)
      if (!tieneRol) {
        logger.warn(`[tienda] Cache no muestra rol ${roleIdStr} en ${userId}, pero add no falló — se considera OK`);
      }

      if (item.type === 'role_weekly') {
        await setInDb(SEGURO_KEY(userId), {
          itemId: item.id,
          roleId: roleIdStr,
          weekly: item.weekly,
          nextCharge: Date.now() + WEEK_MS,
          purchasedAt: Date.now()
        });
        await registrarEnIndiceSeguros(userId);
      }

      const extra = item.type === 'role_weekly'
        ? `\nEl cobro semanal de **${formatMoney(item.weekly)}** se descontará automáticamente. Si no hay saldo, se pierde el seguro.`
        : '';

      return {
        ok: true,
        saldoNuevo: nuevoSaldo,
        mensaje:
          `Compraste **${item.name}** por **${formatMoney(item.price)}** y se te asignó el rol **${roleObj?.name || item.name}**.${extra}\n` +
          `Saldo restante: **${formatMoney(nuevoSaldo)}**.`
      };
    }

    await agregarAlInventario(userId, item.id, 1);
    return {
      ok: true,
      saldoNuevo: nuevoSaldo,
      mensaje: `Compraste **${item.name}** por **${formatMoney(item.price)}**. Se agregó a tu inventario.\nSaldo restante: **${formatMoney(nuevoSaldo)}**.`
    };
  } catch (err) {
    logger.error('[tienda] Error post-compra:', err);
    await reembolsar(`error post-compra ${item.name}`);
    const saldoAhora = await obtenerSaldo(userId);
    return {
      ok: false,
      saldoNuevo: saldoAhora,
      mensaje: `Error al entregar el ítem. Se intentó reembolsar. Saldo: **${formatMoney(saldoAhora)}**.`
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
        try {
          const user = await client.users.fetch(userId).catch(() => null);
          if (user) {
            await user.send({
              embeds: [{
                title: 'Póliza de seguro renovada',
                description:
                  `Se debitó **${formatMoney(monto)}** por **${item?.name || 'tu seguro'}**.\n` +
                  `Próximo cobro: <t:${Math.floor(data.nextCharge / 1000)}:R>.`,
                color: 0xfb8b66
              }]
            }).catch(() => null);
          }
        } catch (_) {}
      } else {
        if (member && data.roleId) {
          try { await member.roles.remove(data.roleId, 'Seguro cancelado: saldo insuficiente'); } catch (e) {
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
              embeds: [{
                title: 'Seguro cancelado',
                description: `Sin saldo para renovar **${item?.name || 'tu seguro'}**. El rol fue removido.`,
                color: 0xff3333
              }]
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
