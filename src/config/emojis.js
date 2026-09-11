/**
 * Registro central de emojis del server.
 * Al renovar (nuevo prefijo / recolor): actualiza name + id aca (o usa /emojis-sync).
 * Uso: import { E, em } from '../config/emojis.js'
 *      em('cruz')  -> tag Discord
 *      E.cruz      -> mismo string
 */

export const EMOJI_DEF = {
  logo: { name: '00Y4n', id: '1535772407904735302' },
  nivel: { name: 'nivel', id: '1532515659269935256', animated: true },

  cruz: { name: 'nara_cruzmarca', id: '1534937767652495360' },
  tilde: { name: 'nara_tilde', id: '1534937809733812286' },
  dot: { name: 'nara_dot', id: '1534938142665084938' },
  lista: { name: 'nara_lista', id: '1534938422202994755' },
  estrechar: { name: 'nara_estrechar', id: '1534937065089663068' },
  flecha: { name: 'nara_flecha', id: '1534937306191102125' },
  id: { name: 'nara_id', id: '1534937551092187136' },
  llaves: { name: 'nara_llaves', id: '1534937600857608283' },
  lock: { name: 'nara_lockk', id: '1534938648665915577' },
  lock_alt: { name: 'nara_lock', id: '1536868110571806830' },
  candado: { name: 'nara_candado', id: '1534937419231527036' },
  bot: { name: 'nara_bot', id: '1534937988465819799' },
  auto: { name: 'nara_auto', id: '1534938916057120839' },
  autopista: { name: 'nara_autopista', id: '1534938752370344218' },
  staff_badge: { name: 'nara_00y4nstaff', id: '1534938829520244846' },
  carpeta: { name: 'nara_carpeta', id: '1534938334650962115' },
  comida: { name: 'nara_comida', id: '1534939245574099094' },
  cora: { name: 'nara_cora', id: '1535395452235813137' },
  corona: { name: 'nara_corona', id: '1534937949320253610' },
  cuatro: { name: 'nara_cuatro', id: '1534938460228550857' },
  dos: { name: 'nara_dos', id: '1535001133729447987' },
  tres: { name: 'nara_tre', id: '1535001243204718612' },
  uno: { name: 'nara_uno', id: '1534938872977297559' },
  egresado: { name: 'nara_egresado', id: '1534975897633820833' },
  escudo: { name: 'nara_escudo', id: '1535395859196411934' },
  esposas: { name: 'nara_esposas', id: '1535395385508368506' },
  faq: { name: 'nara_faq', id: '1534938077032611851' },
  flechareplica: { name: 'nara_flechareplica', id: '1534982812116062370' },
  form: { name: 'nara_form', id: '1535395536012578978' },
  fugaz: { name: 'nara_fugaz', id: '1535395772684697651' },
  gift: { name: 'nara_gift', id: '1534938520861413376' },
  hyperlink: { name: 'nara_hyperlink', id: '1535045942456090634' },
  jpuntderecha: { name: 'nara_jpuntderecha', id: '1542258368301899866' },
  louis: { name: 'nara_louis', id: '1535049295169065040' },
  manual: { name: 'nara_manual', id: '1534999731019972671' },
  mitadestrella: { name: 'nara_mitadestrella', id: '1535054157868703764' },
  money: { name: 'nara_money', id: '1535395640249684040' },
  multa: { name: 'nara_multa', id: '1534939040963629066' },
  pregunta: { name: 'nara_pregunta', id: '1535395725033340979' },
  primer_puesto: { name: 'nara_primer_puesto', id: '1534937484880904292' },
  replican: { name: 'nara_replican', id: '1542264548801777685' },
  roblox: { name: 'nara_roblox', id: '1535409937189179446' },
  stats: { name: 'nara_stats', id: '1535076684578029650' },
  tiempo: { name: 'nara_tiempo', id: '1535027476559040655' },
  trial: { name: 'nara_trial', id: '1534975844491985030' },
  trofeo: { name: 'nara_trofeo', id: '1534938966950809751' },
  trofy: { name: 'nara_trofy', id: '1535396969076490356' },
  warn: { name: 'nara_warn', id: '1534937002695327837' },
  skirojo: { name: 'skirojo', id: '1534988636460683385' },

  a2alas: { name: 'nara_a2alas', id: '1534954231138746488', animated: true },
  aalas: { name: 'nara_aalas', id: '1534954409145008269', animated: true },
  abats: { name: 'nara_abats', id: '1534954353356705852', animated: true },
  aboost: { name: 'nara_aboost', id: '1534940006395936889', animated: true },
  abow: { name: 'nara_abow', id: '1534940053846097961', animated: true },
  abow2: { name: 'nara_abow2', id: '1534940091976515674', animated: true },
  acadena: { name: 'nara_acadena', id: '1534956246874980394', animated: true },
  acajacruz: { name: 'nara_acajacruz', id: '1534940186193039420', animated: true },
  acajatilde: { name: 'nara_acajatilde', id: '1534940142823804969', animated: true },
  acargando: { name: 'nara_acargando', id: '1534984549929451641', animated: true },
  aconfeti: { name: 'nara_aconfeti', id: '1534940499759206512', animated: true },
  acoradibujo: { name: 'nara_acoradibujo', id: '1534952105561817222', animated: true },
  acoraexplota: { name: 'nara_acoraexplota', id: '1534940261837312060', animated: true },
  acoraflotando: { name: 'nara_acoraflotando', id: '1534953815969890436', animated: true },
  acoraflotante: { name: 'nara_acoraflotante', id: '1534954466535674006', animated: true },
  acoraflotante2: { name: 'nara_acoraflotante2', id: '1534956056877334659', animated: true },
  acorarotacion: { name: 'nara_acorarotacion', id: '1534939964150907000', animated: true },
  aestrellas: { name: 'nara_aestrellas', id: '1534939825042620496', animated: true },
  aestrellasbri: { name: 'nara_aestrellasbri', id: '1534939903085777037', animated: true },
  aestrellitas: { name: 'nara_aestrellitas', id: '1534956201035436082', animated: true },
  aexclamacion: { name: 'nara_aexclamacion', id: '1534953738580660406', animated: true },
  aflecha: { name: 'nara_aflecha', id: '1534939368035324125', animated: true },
  afloral: { name: 'nara_afloral', id: '1534953886526214184', animated: true },
  aflores: { name: 'nara_aflores', id: '1534954286675398686', animated: true },
  aflorexplota: { name: 'nara_aflorexplota', id: '1534953963433230386', animated: true },
  aflotacoras: { name: 'nara_aflotacoras', id: '1534954014335172729', animated: true },
  alerta: { name: 'nara_alerta', id: '1534939309235376328', animated: true },
  amariposa2: { name: 'nara_amariposa2', id: '1534940357236621483', animated: true },
  amariposas: { name: 'nara_amariposas', id: '1534940309723676853', animated: true },
  anubes: { name: 'nara_anubes', id: '1534940407291711651', animated: true },
  anubes2: { name: 'nara_anubes2', id: '1534940454876086393', animated: true },
  apendiente: { name: 'nara_apendiente', id: '1534954134732804308', animated: true },
  apulsacion: { name: 'nara_apulsacion', id: '1534954069880471573', animated: true },
  apunzantes: { name: 'nara_apunzantes', id: '1534956142365507624', animated: true },
  astar: { name: 'nara_astar', id: '1534956096161189898', animated: true }
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
