import instructivo from './instructivo.js';
import reglasDiscord from './reglasDiscord.js';
import serverTienda from './serverTienda.js';
import faq from './faq.js';
import roleplayNormas from './roleplayNormas.js';
import roleplayManejo from './roleplayManejo.js';
import guiaRoleplay from './guiaRoleplay.js';
import guiaCarmeet from './guiaCarmeet.js';
import chatRoleplay from './chatRoleplay.js';
import normasConduccion from './normasConduccion.js';
import normasConduccionP2 from './normasConduccionP2.js';
import staffInfo from './staffInfo.js';
import altoComandoInfo from './altoComandoInfo.js';
import serviciosPublicosInfo from './serviciosPublicosInfo.js';
import serviciosPublicosSoporte from './serviciosPublicosSoporte.js';
import serviciosPublicosBienvenida from './serviciosPublicosBienvenida.js';
import serviciosPublicosFaq from './serviciosPublicosFaq.js';
import serviciosPublicosDeptoPolicial from './serviciosPublicosDeptoPolicial.js';
import serviciosPublicosSignCalls from './serviciosPublicosSignCalls.js';
import sorteos from './sorteos.js';

/** @type {Array<{ id: string, label: string, description?: string, build: Function }>} */
export const EMBED_PRESETS = [
  instructivo,
  reglasDiscord,
  serverTienda,
  faq,
  roleplayNormas,
  roleplayManejo,
  guiaRoleplay,
  guiaCarmeet,
  chatRoleplay,
  normasConduccion,
  normasConduccionP2,
  staffInfo,
  altoComandoInfo,
  serviciosPublicosInfo,
  serviciosPublicosSoporte,
  serviciosPublicosBienvenida,
  serviciosPublicosFaq,
  serviciosPublicosDeptoPolicial,
  serviciosPublicosSignCalls,
  sorteos
];

export function getPreset(id) {
  return EMBED_PRESETS.find((p) => p.id === id) || null;
}

export function listPresetChoices() {
  return EMBED_PRESETS.map((p) => ({
    name: p.label.slice(0, 100),
    value: p.id
  }));
}
