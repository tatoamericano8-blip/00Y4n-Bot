/**
 * Registro central de emojis del server.
 * Prefijo actual: orange_*
 * Al renovar: actualiza name + id aca (o usa /emojis-sync).
 * Uso: import { E, em } from '../config/emojis.js'
 */

export const EMOJI_DEF = {
  logo: { name: '00Y4n_v4', id: '1562190415933870191' },

  // --- Estáticos orange_* (IDs del server 00Y4n) ---
  uno: { name: 'orange1', id: '1562186705790963782' },
  dos: { name: 'orange2', id: '1562186720856768643' },
  tres: { name: 'orange3', id: '1562186736040288447' },
  cuatro: { name: 'orange4', id: '1562186751101894756' },
  cinco: { name: 'orange5', id: '1562186766180417566' },
  auto: { name: 'orange_auto', id: '1562186781116596264' },
  bot: { name: 'orange_bot', id: '1562186811910918215' },
  carpeta: { name: 'orange_carpeta', id: '1562186827170054285' },
  cigarro: { name: 'orange_cigarro', id: '1562186842319753226' },
  comida: { name: 'orange_comida', id: '1562186857205338202' },
  corona: { name: 'orange_corona', id: '1562186876704784424' },
  cruz: { name: 'orange_cruz', id: '1562186891766538321' },
  dot: { name: 'orange_dot', id: '1562186909529145367' },
  esposas: { name: 'orange_esposas', id: '1562186924712796233' },
  faq: { name: 'orange_faq', id: '1562186939799703695' },
  flecha: { name: 'orange_flecha', id: '1562186956576657498' },
  flechasabajo: { name: 'orange_flechasabajo', id: '1562186971881808023' },
  form: { name: 'orange_form', id: '1562186987618963568' },
  hyperlink: { name: 'orange_hyperlink', id: '1562187002663673997' },
  id: { name: 'orange_id', id: '1562187017402720328' },
  jpuntderecha: { name: 'orange_jpuntderecha', id: '1562187422958092469' },
  llaves: { name: 'orange_llaves', id: '1562187438103994389' },
  lock: { name: 'orange_lock', id: '1562187454306451608' },
  candado: { name: 'orange_lock', id: '1562187454306451608' },
  lock_alt: { name: 'orange_lock', id: '1562187454306451608' },
  manual: { name: 'orange_manual', id: '1562187469862994010' },
  menos: { name: 'orange_menos', id: '1562187485704880208' },
  msj: { name: 'orange_mensaje', id: '1562187501802881034' },
  mensaje: { name: 'orange_mensaje', id: '1562187501802881034' },
  mitadestrella: { name: 'orange_mitadestrella', id: '1562187517330071642' },
  mochila: { name: 'orange_mochila', id: '1562187532698124360' },
  money: { name: 'orange_money', id: '1562187547931844648' },
  perfil: { name: 'orange_perfil', id: '1562187580252889229' },
  pin: { name: 'orange_pin', id: '1562187597344808960' },
  premio: { name: 'orange_premio', id: '1562187613316710452' },
  trofeo: { name: 'orange_premio', id: '1562187613316710452' },
  primer_puesto: { name: 'orange_primer_puesto', id: '1562187628198236300' },
  replican: { name: 'orange_replican', id: '1562187658984165376' },
  flechareplica: { name: 'orange_replican', id: '1562187658984165376' },
  roblox: { name: 'orange_roblox', id: '1562187674608205927' },
  saludo: { name: 'orange_saludo', id: '1562187716571955210' },
  ski: { name: 'orange_ski', id: '1562187763481182289' },
  skirojo: { name: 'skirojo', id: '1534988636460683385' },
  tiempo: { name: 'orange_tiempo', id: '1562187779566338180' },
  tilde: { name: 'orange_tilde', id: '1562187795269681272' },
  triostar: { name: 'orange_triostar', id: '1562187809928777818' },
  warn: { name: 'orange_warn', id: '1562187843470893117' },

  lista: { name: 'orange_pin', id: '1562187597344808960' },
  gift: { name: 'orange_premio', id: '1562187613316710452' },
  multa: { name: 'orange_multa', id: '1562187563450634370' },
  anuncio: { name: 'orange_saludo', id: '1562187716571955210' },
  checkpoint: { name: 'orange_tilde', id: '1562187795269681272' },
  // Sin orange_* equivalente en el pack del server → se mantienen
  staff_icon: { name: 'cielo_staff', id: '1562186876704784424' },
  staff_badge: { name: 'cielo_staff', id: '1562186876704784424' },

  // --- Revamp / extras ---
  blackjack: { name: 'orange_blackjack', id: '1562186796241002637' },
  herramental: { name: 'cielo_herramental', id: '1562201300450414593' },
  rosa: { name: 'orange_rosa', id: '1562187698779983922' },
  segundopuesto: { name: 'orange_segundopuesto', id: '1562187731436703858' },
  shot: { name: 'orange_shot', id: '1562187747148439582' },
  sombreroegresado: { name: 'cielo_sombreroegresado', id: '1548325979381043271' },
  egresado: { name: 'cielo_sombreroegresado', id: '1562186876704784424' },
  staff: { name: 'cielo_staff', id: '1562186876704784424' },
  stafftarjeta: { name: 'cielo_stafftarjeta', id: '1562186876704784424' },
  trofeoalas: { name: 'orange_trofeoalas', id: '1562187826915713104' },
  rating: { name: 'orange_rating', id: '1562187643377418301' },

  // --- Animados orange_* ---
  a2alas: { name: 'orange_2alas', id: '1561520437438058518', animated: true },
  aalas: { name: 'orange_2alas', id: '1561520437438058518', animated: true },
  aboost: { name: 'orange_aboost', id: '1561520378289983558', animated: true },
  aflecha: { name: 'orange_aflecha', id: '1562186200314413086', animated: true },
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
  anubes: { name: 'orange_nubes', id: '1561529976837246996', animated: true },
  anubes2: { name: 'orange_nubes', id: '1561529976837246996', animated: true },
  apunzantes: { name: 'orange_punzantes', id: '1561520591406637130', animated: true },
  atriocorazones: { name: 'orange_triocorazones', id: '1561520575451504660', animated: true },

  alerta: { name: 'orange_aflecha', id: '1562186200314413086', animated: true },
  acajatilde: { name: 'orange_tilde', id: '1562187795269681272' },
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
