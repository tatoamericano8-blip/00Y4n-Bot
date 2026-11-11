import { EmbedBuilder } from 'discord.js';
import { PRIMARIO } from '../../utils/colores.js';
import { E } from '../emojis.js';

/**
 * Normas de conducción — PARTE 1 (embeds directos, sin menú).
 * Total de texto acotado para no pasar el límite de 6000 chars de Discord.
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
          `${d} **Parte 1:** terminología · logística · normas generales · velocidades / peacetime.\n` +
          `${d} **Parte 2** (carretera, intersecciones, clima, FRP) se publica aparte.\n` +
          `-# Manda lo que publique el host en el inicio de la sesión.`
      );

    const terminologia = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.manual || E.carpeta} Terminología`)
      .setDescription(
        `${d} **FRP** — Conducta poco realista o que ignora el rol a propósito.\n` +
          `${d} **Velocidad FRP** — Límite en **MPH**. Pasarlo puede ser infracción o FRP.\n` +
          `${d} **Intruso / leaker** — Quien no debería estar en la sesión.\n` +
          `${d} **Peacetime** — Estricto **75** · Normal **85** · Sin PT **120** (salvo otro número del host).\n` +
          `${d} **Prio** — Criminal prioritario (sobre todo sin peacetime).\n` +
          `${d} **Scene** — Zona de atención especial (operativo, accidente, evento).\n` +
          `${d} **Void** — No reconocer un hecho; **solo** si lo indica staff/reglas.`
      );

    const logistica = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.auto} Logística del vehículo`)
      .setDescription(
        `${d} **Licencia** — Bot / \`/perfil_swfl\`. Si está suspendida, regularizala.\n` +
          `${d} **Seguro** — Tienda del servidor; **un plan activo** a la vez.\n` +
          `${d} **Matrícula** — \`/matricular\` con el formato vigente.\n` +
          `${d} **Multas** — Pagalas por el bot; las deudas escalan.\n` +
          `${d} **Acoplados** — Solo si la sesión y el juego lo permiten.`
      );

    const generales = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.warn || E.dot} Normas generales`)
      .setDescription(
        `${d} Manejá con sentido común: distancia, señales, sin romper escenas.\n` +
          `${d} Respetá peacetime, cupos criminales e indicaciones del host.\n` +
          `${d} Si no sos el **prio**, no te metas en la persecución a lo loco.\n` +
          `${d} Cedé el paso a emergencias en rol; no bloquees operativos.\n` +
          `${d} **Accidente:** roleá e intercambiá info. **Chocar y huir** no se tolera.\n` +
          `${d} Reaparecer el auto **no borra** el rol del choque.`
      );

    const velocidades = new EmbedBuilder()
      .setColor(c)
      .setTitle(`${E.flecha} Velocidades y peacetime`)
      .setDescription(
        `${d} **Estricto → 75 MPH** · **Normal → 85 MPH** · **Sin PT → 120 MPH**\n` +
          `${d} Si el host publica otro tope en el inicio, **ese manda**.\n` +
          `${d} Pasarte del límite = infracción; si es grave o a propósito, **FRP**.\n` +
          `${d} En barrios, spawn y estacionamientos andá más despacio.\n` +
          `${d} Sin peacetime **no** es permiso para destruir la sesión.\n` +
          `-# Parte 1 de 2 · Southwest Florida Comunidad 00Y4n`
      );

    return {
      embeds: [intro, terminologia, logistica, generales, velocidades]
    };
  }
};

/** Compatibilidad menú antiguo / secciones sueltas. */
export function buildSeccionNormasConduccion(seccion) {
  const c = PRIMARIO;
  const d = E.dot;
  const f = E.flecha;

  const map = {
    terminologia: {
      title: `${E.manual || E.carpeta} Terminología`,
      desc:
        `${d} **FRP** — Poco realista / ignora el rol.\n` +
        `${d} **Velocidad FRP** — Límite MPH.\n` +
        `${d} **Peacetime** — 75 / 85 / 120 (o lo del host).\n` +
        `${d} **Prio · Scene · Void** — prioridad, zona especial, anular solo con staff.`
    },
    logistica: {
      title: `${E.auto} Logística del vehículo`,
      desc:
        `${d} Licencia, seguro (un plan), matrícula \`/matricular\`, multas por bot, acoplados según sesión.`
    },
    generales: {
      title: `${E.warn || E.dot} Normas generales`,
      desc:
        `${d} Sentido común · peacetime/cupos · no romper escenas · emergencias · accidentes se rolean (no huir).`
    },
    velocidades: {
      title: `${E.flecha} Velocidades y peacetime`,
      desc:
        `${d} Estricto 75 · Normal 85 · Sin PT 120. Pasarte del tope = infracción / posible FRP.`
    },
    circulacion: {
      title: `${E.auto} Carretera y circulación`,
      desc:
        `${f} Autopista: izquierda más rápido, derecha entrar/salir.\n` +
        `${d} Sin tejer carriles ni pararte en plena vía.\n` +
        `${d} Semáforos/stops: no pasar en rojo (PT estricto = cero tolerancia).\n` +
        `${d} Giro en U solo en intersección con semáforo si es seguro.\n` +
        `${d} Clima adverso: respetá el límite; no habilita manejar mal.`
    },
    frp: {
      title: `${E.warn} Imprudencia y FRP`,
      desc:
        `${d} Manejo imprudente a propósito está prohibido.\n` +
        `${d} Cero tolerancia a FRP claro. Al entrar a sesiones aceptás estas normas.\n` +
        `-# Southwest Florida Comunidad 00Y4n`
    }
  };

  const item = map[seccion];
  if (!item) return null;
  return {
    embeds: [
      new EmbedBuilder().setColor(c).setTitle(item.title).setDescription(item.desc)
    ]
  };
}
