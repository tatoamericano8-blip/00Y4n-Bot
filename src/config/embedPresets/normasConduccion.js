import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

/**
 * Parte 1 en embeds directos.
 * embed-send parte por tamaño si hace falta (límite Discord 6000).
 */
export default {
  id: 'normas_conduccion',
  label: 'Normas de conducción · Parte 1',
  description: 'Terminología, logística, normas generales, velocidades y peacetime',

  build() {
    const c = PRIMARIO;
    const d = E.dot;
    const f = E.flecha;

    const intro = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.auto || E.llaves} 00Y4n · Normas de conducción (Parte 1)`)
      .setDescription(
        `${d} Guía de manejo en sesión: tránsito **realista y prolijo**.\n` +
          `${d} **Parte 1:** terminología, logística, normas generales y velocidades / peacetime.\n` +
          `${d} **Parte 2** (carretera, intersecciones, clima, FRP) se publica aparte.\n` +
          `-# Si el host publica otro límite en el inicio, **ese manda**.`
      );

    const terminologia = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.manual || E.carpeta} Terminología`)
      .setDescription(
        `${d} **FRP (Fail Roleplay)** — Conducta poco realista o que ignora el rol a propósito.\n` +
          `${d} **Velocidad FRP** — Límite del servidor en **MPH**. Pasarlo puede ser infracción o FRP.\n` +
          `${d} **Intruso / leaker** — Quien no debería estar en la sesión (sin acceso, link filtrado, etc.).\n` +
          `${d} **Peacetime** — Estricto **75 MPH** · Normal **85 MPH** · Sin PT **120 MPH**.\n` +
          `${d} **Prio** — Criminal prioritario de la escena (sobre todo sin peacetime).\n` +
          `${d} **Scene** — Zona de atención especial (operativo, accidente, evento).\n` +
          `${d} **Void** — No reconocer un hecho; **solo** si lo indica staff o las reglas.`
      );

    const logistica = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.auto} Logística del vehículo`)
      .setDescription(
        `${d} **Licencia** — Se gestiona con el bot (\`/perfil_swfl\`). Si está suspendida, regularizala.\n` +
          `${d} **Seguro** — Desde la tienda del servidor; solo **un plan activo** a la vez.\n` +
          `${d} **Matrícula** — Registrá con \`/matricular\` usando el formato vigente.\n` +
          `${d} **Multas** — Pagalas por el bot; las deudas pueden escalar.\n` +
          `${d} **Acoplados / trailers** — Solo si la sesión y el juego lo permiten.`
      );

    const generales = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.warn || E.dot} Normas generales`)
      .setDescription(
        `${d} Manejá con sentido común: distancia, señales y sin romper escenas ajenas.\n` +
          `${d} Respetá peacetime, cupos criminales e indicaciones del host.\n` +
          `${d} Si no sos el **prio**, no te metas en la persecución a lo loco.\n` +
          `${d} Cedé el paso a emergencias en rol; no bloquees operativos.\n` +
          `${d} **Accidente:** roleá e intercambiá info. **Chocar y huir** no se tolera.\n` +
          `${d} Reaparecer el vehículo **no borra** el rol del choque.`
      );

    const velocidades = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.flecha} Velocidades y peacetime`)
      .setDescription(
        `${d} **Estricto → 75 MPH** · **Normal → 85 MPH** · **Sin PT → 120 MPH**\n` +
          `${d} Si el host publica otro tope, **ese tiene prioridad**.\n` +
          `${d} Pasarte del límite = infracción; si es grave o a propósito, puede ser **FRP**.\n` +
          `${d} En barrios, spawn y estacionamientos andá más despacio.\n` +
          `${d} Sin peacetime **no** es permiso para destruir la sesión.\n` +
          `-# Parte 1 de 2 · Southwest Florida Comunidad 00Y4n`
      );

    return {
      embeds: [intro, terminologia, logistica, generales, velocidades]
    };
  }
};

export function buildSeccionNormasConduccion(seccion) {
  const c = PRIMARIO;
  const d = E.dot;
  const f = E.flecha;
  const map = {
    terminologia: {
      title: `${E.manual || E.carpeta} Terminología`,
      desc: `${d} FRP · velocidad FRP · intruso · peacetime 75/85/120 · prio · scene · void (solo staff).`
    },
    logistica: {
      title: `${E.auto} Logística del vehículo`,
      desc: `${d} Licencia · seguro (un plan) · \`/matricular\` · multas · acoplados según sesión.`
    },
    generales: {
      title: `${E.warn || E.dot} Normas generales`,
      desc: `${d} Sentido común · peacetime/cupos · no romper escenas · emergencias · accidentes se rolean.`
    },
    velocidades: {
      title: `${E.flecha} Velocidades y peacetime`,
      desc: `${d} 75 / 85 / 120. Pasarte del tope = infracción / posible FRP.`
    },
    circulacion: {
      title: `${E.auto} Carretera y circulación`,
      desc:
        `${d} Autopista: izquierda más rápido, derecha entrar/salir.\n` +
        `${d} Semáforos: no pasar en rojo. Giro en U solo con semáforo si es seguro.\n` +
        `${d} Clima adverso: respetá el límite.`
    },
    frp: {
      title: `${E.warn} Imprudencia y FRP`,
      desc: `${d} Manejo imprudente a propósito prohibido. Cero tolerancia a FRP claro.`
    }
  };
  const item = map[seccion];
  if (!item) return null;
  return {
    embeds: [new EmbedBuilder().setColor(c).setTitle(item.title).setDescription(item.desc)]
  };
}
