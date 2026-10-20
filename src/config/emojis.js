/**
 * Registro central de emojis del server.
 * Prefijo actual: orange_*
 * Al renovar: actualiza name + id aca (o usa /emojis-sync).
 * Uso: import { E, em } from '../config/emojis.js'
 */

export const EMOJI_DEF = {
  logo: { name: 'Logo_00y4n_v3', id: '1548155893256953926' },

  // --- Estáticos orange_* ---
  uno: { name: 'orange1', id: '1561521388039315467' },
  dos: { name: 'orange2', id: '1561521809323720796' },
  tres: { name: 'orange3', id: '1561521824913952788' },
  cuatro: { name: 'orange4', id: '1561521841171079221' },
  cinco: { name: 'orange5', id: '1561521855956000789' },
  auto: { name: 'orange_auto', id: '1562180755319160922' },
  bot: { name: 'orange_bot', id: '1561522030476664872' },
  carpeta: { name: 'orange_carpeta', id: '1561524196977152121' },
  cigarro: { name: 'orange_cigarro', id: '1561521995802353697' },
  comida: { name: 'orange_comida', id: '1561524154862149674' },
  corona: { name: 'orange_corona', id: '1561522066648465469' },
  cruz: { name: 'orange_cruz', id: '1561522050798194750' },
  dot: { name: 'orange_dot', id: '1561522113637130321' },
  esposas: { name: 'orange_esposas', id: '1561522082570043543' },
  faq: { name: 'orange_faq', id: '1561524116257906812' },
  flecha: { name: 'orange_flecha', id: '1561521901988225137' },
  flechasabajo: { name: 'orange_flechasabajo', id: '1561521918685745242' },
  form: { name: 'orange_form', id: '1561524181290586174' },
  hyperlink: { name: 'orange_hyperlink', id: '1561524272961429564' },
  id: { name: 'orange_id', id: '1561524211556687894' },
  jpuntderecha: { name: 'orange_jpuntderecha', id: '1561524915931447409' },
  llaves: { name: 'orange_llaves', id: '1561524242300936292' },
  lock: { name: 'orange_lock', id: '1561524288249663532' },
  candado: { name: 'orange_lock', id: '1561524288249663532' },
  lock_alt: { name: 'orange_lock', id: '1561524288249663532' },
  manual: { name: 'orange_manual', id: '1561524226748579860' },
  menos: { name: 'orange_menos', id: '1561522098600542208' },
  msj: { name: 'orange_mensaje', id: '1561524303487442944' },
  mensaje: { name: 'orange_mensaje', id: '1561524303487442944' },
  mitadestrella: { name: 'orange_mitadestrella', id: '1561524855290204160' },
  mochila: { name: 'orange_mochila', id: '1561521949925056627' },
  money: { name: 'orange_money', id: '1561524320424173638' },
  perfil: { name: 'orange_perfil', id: '1561524335859081297' },
  pin: { name: 'orange_pin', id: '1561521871483044061' },
  premio: { name: 'orange_premio', id: '1561521934968029314' },
  trofeo: { name: 'orange_premio', id: '1561521934968029314' },
  primer_puesto: { name: 'orange_primer_puesto', id: '1561524132145799208' },
  replican: { name: 'orange_replican', id: '1561524366892728512' },
  flechareplica: { name: 'orange_replican', id: '1561524366892728512' },
  roblox: { name: 'orange_roblox', id: '1561524381564534824' },
  saludo: { name: 'orange_saludo', id: '1561524946784485456' },
  ski: { name: 'orange_ski', id: '1561524840039452672' },
  skirojo: { name: 'skirojo', id: '1534988636460683385' },
  tiempo: { name: 'orange_tiempo', id: '1561522014185988298' },
  tilde: { name: 'orange_tilde', id: '1561521981130801273' },
  triostar: { name: 'orange_triostar', id: '1561536487814733856' },
  warn: { name: 'orange_warn', id: '1561521886679138307' },

  lista: { name: 'orange_pin', id: '1561521871483044061' },
  gift: { name: 'orange_premio', id: '1561521934968029314' },
  multa: { name: 'orange_multa', id: '1561524885447250061' },
  anuncio: { name: 'orange_saludo', id: '1561524946784485456' },
  checkpoint: { name: 'orange_tilde', id: '1561521981130801273' },
  // Sin equivalente orange_* en el pack → se mantienen
  staff_icon: { name: 'cielo_staff', id: '1548325926738067616' },
  staff_badge: { name: 'cielo_staff', id: '1548325926738067616' },

  // --- Revamp / extras ---
  blackjack: { name: 'orange_blackjack', id: '1561521964718231584' },
  herramental: { name: 'cielo_herramental', id: '1548325589199185941' },
  rosa: { name: 'orange_rosa', id: '1561524396365979779' },
  segundopuesto: { name: 'orange_segundopuesto', id: '1561524412484812841' },
  shot: { name: 'orange_shot', id: '1561524429563891772' },
  sombreroegresado: { name: 'cielo_sombreroegresado', id: '1548325979381043271' },
  egresado: { name: 'cielo_sombreroegresado', id: '1548325979381043271' },
  staff: { name: 'cielo_staff', id: '1548325926738067616' },
  stafftarjeta: { name: 'cielo_stafftarjeta', id: '1548325953833533491' },
  trofeoalas: { name: 'orange_trofeoalas', id: '1561524901096067162' },
  rating: { name: 'orange_rating', id: '1561524351407227021' },

  // --- Animados orange_* ---
  a2alas: { name: 'orange_2alas', id: '1561520437438058518', animated: true },
  aalas: { name: 'orange_2alas', id: '1561520437438058518', animated: true },
  aboost: { name: 'orange_aboost', id: '1561520378289983558', animated: true },
  // sin orange_aflecha en el pack → se mantiene cielo
  aflecha: { name: 'cielo_aflecha', id: '1548030909381476442', animated: true },
  abats: { name: 'orange_bats', id: '1561520499735920744', animated: true },
  abow2: { name: 'orange_bow2', id: '1561520422430834700', animated: true },
  abow: { name: 'orange_bow2', id: '1561520422430834700', animated: true },
  aconfeti: { name: 'orange_confeti', id: '1561520468446412855', animated: true },
  acoraexplota: { name: 'orange_coraexplota', id: '1561520515208970252', animated: true },
  acoraflotando: { name: 'orange_coraflotando', id: '1561520452772565154', animated: true },
  acoraflotante: { name: 'orange_coraflotando', id: '1561520452772565154', animated: true },
  adinero: { name: 'orange_dinero', id: '1561529992880332900', animated: true },
  dinero: { name: 'orange_dinero', id: '1561529992880332900', animated: true },
  aestrellitas: { name: 'orange_estrellaanimada', id: '1561520393033097327', animated: true },
  aestrellas: { name: 'orange_estrellas', id: '1561520362888499281', animated: true },
  aestrellasbri: { name: 'orange_estrellas', id: '1561520362888499281', animated: true },
  afloral: { name: 'orange_floral', id: '1561520545579663380', animated: true },
  aflores: { name: 'orange_floral', id: '1561520545579663380', animated: true },
  aflorexplota: { name: 'orange_florexplota', id: '1561520407733866632', animated: true },
  aflotacoras: { name: 'orange_flotacoras', id: '1561520484946813028', animated: true },
  amariposa2: { name: 'orange_mariposa2', id: '1561520560104804384', animated: true },
  amariposas: { name: 'orange_mariposas', id: '1561520530035581059', animated: true },
  // orange_nubes (equivalente a cielo_nubes2)
  anubes: { name: 'orange_nubes', id: '1561529976837246996', animated: true },
  anubes2: { name: 'orange_nubes', id: '1561529976837246996', animated: true },
  apunzantes: { name: 'orange_punzantes', id: '1561520591406637130', animated: true },
  atriocorazones: { name: 'orange_triocorazones', id: '1561520575451504660', animated: true },

  alerta: { name: 'cielo_aflecha', id: '1548030909381476442', animated: true },
  acajatilde: { name: 'orange_tilde', id: '1561521981130801273' },
  acargando: { name: 'orange_confeti', id: '1561520468446412855', animated: true },
  acoradibujo: { name: 'orange_coraflotando', id: '1561520452772565154', animated: true },
  acorarotacion: { name: 'orange_coraexplota', id: '1561520515208970252', animated: true },
  nivel: { name: 'nivel', id: '1532515659269935256', animated: true }
};

export const E = Object.fromEntries(
  Object.entries(EMOJI_DEF).map(([key, def]) => {
    const tag = def.animated
      ? `<a:${def.name}:${def.id}>`
      : `<:${def.name}:${def.id}>`;
    return [key, tag];
  })
);

export function em(key) {
  return E[key] || '';
}

export function emById(id) {
  const found = Object.values(EMOJI_DEF).find((d) => d.id === String(id));
  if (!found) return '';
  return found.animated
    ? `<a:${found.name}:${found.id}>`
    : `<:${found.name}:${found.id}>`;
}

export function emGuild(guild, key) {
  const def = EMOJI_DEF[key];
  if (!def) return '';
  const cached = guild?.emojis?.cache?.find(
    (e) => e.name === def.name || e.id === def.id
  );
  if (cached) return cached.toString();
  return em(key);
}

export function previewRemapPrefix(oldPrefix, newPrefix) {
  const out = {};
  for (const [key, def] of Object.entries(EMOJI_DEF)) {
    if (!def.name.startsWith(oldPrefix)) {
      out[key] = { ...def };
      continue;
    }
    out[key] = {
      ...def,
      name: newPrefix + def.name.slice(oldPrefix.length)
    };
  }
  return out;
}
