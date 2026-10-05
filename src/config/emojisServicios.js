/**
 * Emojis del servidor División de Servicios Públicos | 00Y4n
 * Prefijo black_* (+ EGPD y animados).
 * Uso: import { ES, emS } from '../config/emojisServicios.js'
 *
 * NO reemplaza emojis.js (cielo_* de 00Y4n principal).
 * Solo para embeds/mensajes de Servicios Públicos.
 */

export const EMOJI_DEF_SERVICIOS = {
  // --- Números ---
  uno: { name: 'black_1', id: '1555955660863176795' },
  dos: { name: 'black_2', id: '1555955675841036331' },
  tres: { name: 'black_3', id: '1555955691242389555' },
  cuatro: { name: 'black_4', id: '1555955710477607024' },
  cinco: { name: 'black_5', id: '1555955726449385563' },

  // --- Estáticos black_* ---
  tilde: { name: 'black_Accepted', id: '1555955757781090414' },
  accepted: { name: 'black_Accepted', id: '1555955757781090414' },
  alarm: { name: 'black_alarm', id: '1555955741884547144' },
  alerta: { name: 'black_alarm', id: '1555955741884547144' },
  flecha: { name: 'black_arrow', id: '1555955538603417640' },
  flecha_alt: { name: 'black_Arrow', id: '155595555334627391' },
  flecha2: { name: 'black_arrow', id: '1555956693761007646' },
  check: { name: 'black_check', id: '1555955524124672140' },
  corona: { name: 'black_crown', id: '1555956629462319237' },
  crown: { name: 'blackcrown', id: '1555955570970861649' },
  dot: { name: 'black_dot', id: '1555955601362915450' },
  faq: { name: 'black_faq', id: '1555955508891099237' },
  form: { name: 'black_form', id: '1555955493728419970' },
  info: { name: 'black_info', id: '1555955477614174249' },
  lock: { name: 'black_lock', id: '1555955646103556186' },
  candado: { name: 'black_lock', id: '1555955646103556186' },
  partner: { name: 'black_partner', id: '1555956788250026045' },
  perfil: { name: 'black_profile', id: '1555955462325674129' },
  profile: { name: 'black_profile', id: '1555955462325674129' },
  reply: { name: 'black_reply', id: '1555955630945210501' },
  roblox: { name: 'black_roblox', id: '1555956678346936401' },
  roboticarm: { name: 'black_roboticarm', id: '1555956646054854776' },
  brazo: { name: 'black_roboticarm', id: '1555956646054854776' },
  singlekey: { name: 'black_singlekey', id: '1555956742616129692' },
  llave: { name: 'black_singlekey', id: '1555956742616129692' },
  star: { name: 'black_star', id: '1555956758302691338' },
  estrella: { name: 'black_star', id: '1555956758302691338' },
  warn: { name: 'black_warning', id: '1555956663230664786' },
  warning: { name: 'black_warning', id: '1555956663230664786' },
  cruz: { name: 'blackcross', id: '1555955584644620674' },
  blackcross: { name: 'blackcross', id: '1555955584644620674' },
  blackcrown: { name: 'blackcrown', id: '1555955570970861649' },
  corona_alt: { name: 'blackcrown', id: '1555955570970861649' },
  egpd: { name: 'EGPD', id: '1555956773385666682' },
  logo: { name: '00y4n_SP', id: '1555982909108789408' },
  logo_sp: { name: '00y4n_SP', id: '1555982909108789408' },
  sp: { name: '00y4n_SP', id: '1555982909108789408' },

  // --- Animados ---
  butterflies: { name: 'black_butterflies', id: '1555956724782076034', animated: true },
  mariposas: { name: 'black_butterflies', id: '1555956724782076034', animated: true },
  stars: { name: 'black_stars', id: '1555955616537780408', animated: true },
  estrellas: { name: 'black_stars', id: '1555955616537780408', animated: true },
  tada: { name: 'black_tada', id: '1555956709187395715', animated: true },
  confeti: { name: 'black_tada', id: '1555956709187395715', animated: true }
};

/** Tags listos para embeds: ES.flecha, ES.dot, etc. */
export const ES = Object.fromEntries(
  Object.entries(EMOJI_DEF_SERVICIOS).map(([key, def]) => {
    const tag = def.animated
      ? `<a:${def.name}:${def.id}>`
      : `<:${def.name}:${def.id}>`;
    return [key, tag];
  })
);

export function emS(key) {
  return ES[key] || '';
}

export function emSById(id) {
  const found = Object.values(EMOJI_DEF_SERVICIOS).find((d) => d.id === String(id));
  if (!found) return '';
  return found.animated
    ? `<a:${found.name}:${found.id}>`
    : `<:${found.name}:${found.id}>`;
}
