/**
 * Registro central de emojis del server.
 * Prefijo actual: cielo_*
 * Al renovar: actualiza name + id aca (o usa /emojis-sync).
 * Uso: import { E, em } from '../config/emojis.js'
 */

export const EMOJI_DEF = {
  logo: { name: '00Y4n', id: '1535772407904735302' },

  // --- Estáticos cielo_* ---
  uno: { name: 'cielo_1', id: '1548066862913429625' },
  dos: { name: 'cielo_2', id: '1548066880089227295' },
  tres: { name: 'cielo_3', id: '1548066895490715648' },
  cuatro: { name: 'cielo_4', id: '1548066910707523666' },
  cinco: { name: 'cielo_5', id: '1548066926666977412' },
  auto: { name: 'cielo_auto', id: '1548067053603258440' },
  bot: { name: 'cielo_bot', id: '1548067112445157438' },
  carpeta: { name: 'cielo_carpeta', id: '1548067236777704199' },
  cigarro: { name: 'cielo_cigarro', id: '1548067082527847723' },
  comida: { name: 'cielo_comida', id: '1548121968744730654' },
  corona: { name: 'cielo_corona', id: '1548067147375186010' },
  cruz: { name: 'cielo_cruz', id: '1548067127972335746' },
  dot: { name: 'cielo_dot', id: '1548067176559153194' },
  esposas: { name: 'cielo_esposas', id: '1548067162223017987' },
  faq: { name: 'cielo_faq', id: '1548067191344332832' },
  flecha: { name: 'cielo_flecha', id: '1548066990214742037' },
  flechasabajo: { name: 'cielo_flechasabajo', id: '1548067006576853155' },
  form: { name: 'cielo_form', id: '1548067221444685720' },
  hyperlink: { name: 'cielo_hyperlink', id: '1548067266858324070' },
  id: { name: 'cielo_id', id: '1548067251435872357' },
  jpuntderecha: { name: 'cielo_jpuntderecha', id: '1548067374094352486' },
  llaves: { name: 'cielo_llaves', id: '1548121511599276122' },
  lock: { name: 'cielo_lock', id: '1548128599129981039' },
  candado: { name: 'cielo_lock', id: '1548128599129981039' },
  lock_alt: { name: 'cielo_lock', id: '1548128599129981039' },
  manual: { name: 'cielo_manual', id: '1548121492749811772' },
  menos: { name: 'cielo_menos', id: '1548121545665417366' },
  msj: { name: 'cielo_mensaje', id: '1548067281941041262' },
  mensaje: { name: 'cielo_mensaje', id: '1548067281941041262' },
  mitadestrella: { name: 'cielo_mitadestrella', id: '1548067359544053830' },
  mochila: { name: 'cielo_mochila', id: '1548067038621073499' },
  money: { name: 'cielo_money', id: '1548067297485389974' },
  perfil: { name: 'cielo_perfil', id: '1548067313750908969' },
  pin: { name: 'cielo_pin', id: '1548066941342847036' },
  premio: { name: 'cielo_premio', id: '1548067022083063909' },
  trofeo: { name: 'cielo_premio', id: '1548067022083063909' },
  primer_puesto: { name: 'cielo_primer_puesto', id: '1548067206267404398' },
  replican: { name: 'cielo_replican', id: '1548067329101926474' },
  flechareplica: { name: 'cielo_replican', id: '1548067329101926474' },
  roblox: { name: 'cielo_roblox', id: '1548121948771455029' },
  saludo: { name: 'cielo_saludo', id: '1548067389378265129' },
  ski: { name: 'cielo_ski', id: '1548067344977502278' },
  skirojo: { name: 'cielo_ski', id: '1548067344977502278' },
  tiempo: { name: 'cielo_tiempo', id: '1548067097047998464' },
  tilde: { name: 'cielo_tilde', id: '1548067068002312364' },
  triostar: { name: 'cielo_triostar', id: '154806729180955648' },
  warn: { name: 'cielo_warn', id: '1548066974901338153' },

  lista: { name: 'cielo_pin', id: '1548066941342847036' },
  gift: { name: 'cielo_premio', id: '1548067022083063909' },
  multa: { name: 'cielo_money', id: '1548067297485389974' },
  anuncio: { name: 'cielo_saludo', id: '1548067389378265129' },
  checkpoint: { name: 'cielo_tilde', id: '1548067068002312364' },
  staff_icon: { name: 'cielo_bot', id: '1548067112445157438' },
  staff_badge: { name: 'cielo_bot', id: '1548067112445157438' },

  // --- Animados cielo_* ---
  a2alas: { name: 'cielo_2alas', id: '1548030945607553125', animated: true },
  aalas: { name: 'cielo_2alas', id: '1548030945607553125', animated: true },
  aboost: { name: 'cielo_aboost', id: '154806964960179200', animated: true },
  aflecha: { name: 'cielo_aflecha', id: '1548030909381476442', animated: true },
  abats: { name: 'cielo_bats', id: '1548030770214469734', animated: true },
  abow2: { name: 'cielo_bow2', id: '1548030927656194209', animated: true },
  abow: { name: 'cielo_bow2', id: '1548030927656194209', animated: true },
  aconfeti: { name: 'cielo_confeti', id: '1548069687919648768', animated: true },
  acoraexplota: { name: 'cielo_coraexplota', id: '1548030730184171561', animated: true },
  acoraflotando: { name: 'cielo_coraflotando', id: '1548030814948610889', animated: true },
  acoraflotante: { name: 'cielo_coraflotando', id: '1548030814948610889', animated: true },
  adinero: { name: 'cielo_dinero', id: '1548030839471954346', animated: true },
  aestrellitas: { name: 'cielo_estrellaanimada', id: '1548009451509656123', animated: true },
  aestrellas: { name: 'cielo_estrellas', id: '1548030674311708743', animated: true },
  aestrellasbri: { name: 'cielo_estrellas', id: '1548030674311708743', animated: true },
  afloral: { name: 'cielo_floral', id: '1548030651578722115', animated: true },
  aflores: { name: 'cielo_floral', id: '1548030651578722115', animated: true },
  aflorexplota: { name: 'cielo_florexplota', id: '1548030749574176838', animated: true },
  aflotacoras: { name: 'cielo_flotacoras', id: '1548030857963503736', animated: true },
  amariposa2: { name: 'cielo_mariposa2', id: '1548030633945731214', animated: true },
  amariposas: { name: 'cielo_mariposas', id: '1548030793169899631', animated: true },
  anubes: { name: 'cielo_nubes2', id: '1548030710999055364', animated: true },
  anubes2: { name: 'cielo_nubes2', id: '1548030710999055364', animated: true },
  apunzantes: { name: 'cielo_punzantes', id: '1548030838837485568', animated: true },
  atriocorazones: { name: 'cielo_triocorazones', id: '1548030876972993501', animated: true },

  alerta: { name: 'cielo_aflecha', id: '1548030909381476442', animated: true },
  acajatilde: { name: 'cielo_tilde', id: '1548067068002312364' },
  acargando: { name: 'cielo_confeti', id: '1548069687919648768', animated: true },
  acoradibujo: { name: 'cielo_coraflotando', id: '1548030814948610889', animated: true },
  acorarotacion: { name: 'cielo_coraexplota', id: '1548030730184171561', animated: true },
  nivel: { name: 'cielo_estrellaanimada', id: '1548009451509656123', animated: true }
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
