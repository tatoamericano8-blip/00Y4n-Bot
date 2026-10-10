import {
  SlashCommandBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags
} from 'discord.js';

export const CANAL_FORMULARIOS = '1532865290529145043';

export const DEPARTAMENTOS = {
  bomberos: {
    nombre: 'Servicio de Bomberos y Rescate de Bonita Springs',
    emoji: '🚒',
    color: 0xe74c3c,
    requierePase: false
  },
  sem: {
    nombre: 'Servicios de Emergencias Médicas',
    emoji: '🚑',
    color: 0x3498db,
    requierePase: false
  },
  policia: {
    nombre: 'Departamento Policial del Condado de Sarasota',
    emoji: '👮',
    color: 0x2c3e50,
    requierePase: false
  },
  sheriff: {
    nombre: 'Oficina del Sheriff del Condado de Sarasota',
    emoji: '⭐',
    color: 0xf1c40f,
    requierePase: true
  }
};

/** Borradores parte 1 (userId -> data). Expira en 15 min. */
export const solicitudPending = new Map();

export function setSolicitudPending(userId, data) {
  solicitudPending.set(String(userId), { ...data, expires: Date.now() + 15 * 60 * 1000 });
}

export function getSolicitudPending(userId) {
  const key = String(userId);
  const data = solicitudPending.get(key);
  if (!data) return null;
  if (Date.now() > data.expires) {
    solicitudPending.delete(key);
    return null;
  }
  return data;
}

export function clearSolicitudPending(userId) {
  solicitudPending.delete(String(userId));
}

/** Paso 1 — datos base (comunes, más evaluables). customId: solicitud_depto:KEY */
export function crearModalPaso1(departamentoKey) {
  const dep = DEPARTAMENTOS[departamentoKey];
  const modal = new ModalBuilder()
    .setCustomId(`solicitud_depto:${departamentoKey}`)
    .setTitle(`${dep.emoji} Solicitud · Parte 1/2`.slice(0, 45));

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('edad')
        .setLabel('Edad aproximada (mínimo 13 años)')
        .setPlaceholder('Ej: 16 — Debe ser 13 o más')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(20)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('mic')
        .setLabel('¿Tenés micrófono?')
        .setPlaceholder('Sí / No. Si sí, ¿podés usarlo en sesión? (recomendado)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('experiencia')
        .setLabel('Experiencia y disponibilidad')
        .setPlaceholder('RP previo, horas/semana, zona horaria (ej. ART, CST)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(800)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('motivacion')
        .setLabel('¿Por qué este departamento?')
        .setPlaceholder('Motivación real. ¿Qué te atrae de este depto?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(800)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('cadena')
        .setLabel('Órdenes y trabajo en equipo')
        .setPlaceholder('¿Cómo reaccionás si un superior te da una orden con la que no estás de acuerdo?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(800)
    )
  );
  return modal;
}

const PREGUNTAS_P2 = {
  bomberos: {
    etica: {
      label: 'Ética en escena',
      placeholder: 'Un civil graba e insulta mientras trabajás. ¿Cómo actuás sin abandonar la emergencia?'
    },
    operativa: {
      label: 'Prioridad al llegar',
      placeholder: 'Incendio con víctimas posibles. ¿Qué priorizás en los primeros minutos?'
    },
    criterio: {
      label: 'Seguridad del equipo',
      placeholder: 'Tu compañero quiere entrar sin equipo completo. ¿Qué hacés?'
    },
    escenario: {
      label: 'Escenario de emergencia',
      placeholder:
        'Incendio residencial en Bonita Springs, humo denso, posibles víctimas en 2° piso. ¿Cómo priorizás y actuás?'
    },
    aporte: {
      label: '¿Qué aportás al depto?',
      placeholder: 'Algo concreto que puedas sumar (constancia, aprendizaje, turno, etc.)'
    }
  },
  sem: {
    etica: {
      label: 'Ética con familiares',
      placeholder: 'Familiares en pánico te empujan y gritan. ¿Cómo controlás la escena y atendés?'
    },
    operativa: {
      label: 'Triaje / prioridad',
      placeholder: 'Dos pacientes: uno inconsciente y otro con dolor fuerte pero consciente. ¿A quién primero y por qué?'
    },
    criterio: {
      label: 'Límite de tu rol',
      placeholder: '¿Qué no harías como SEM aunque te lo pidan en el momento?'
    },
    escenario: {
      label: 'Escenario de emergencia',
      placeholder:
        'Paciente inconsciente, respiración irregular y familiares en pánico. ¿Cómo priorizás y controlás la escena?'
    },
    aporte: {
      label: '¿Qué aportás al depto?',
      placeholder: 'Algo concreto que puedas sumar al SEM'
    }
  },
  policia: {
    etica: {
      label: 'Ética en un control',
      placeholder: 'Un civil te falta el respeto en un control de tránsito. ¿Cómo actuás?'
    },
    operativa: {
      label: 'MDT / radio antes de sancionar',
      placeholder: '¿Qué revisás o comunicás antes de multar o arrestar?'
    },
    criterio: {
      label: 'Respaldo vs actuar solo',
      placeholder: '¿Cuándo pedís unidades de respaldo y cuándo podés resolver solo?'
    },
    escenario: {
      label: 'Escenario de emergencia',
      placeholder:
        'Persecución en la I-75: el sospechoso no se detiene y hay tráfico. ¿Cómo procedés con seguridad?'
    },
    aporte: {
      label: '¿Qué aportás al DPS?',
      placeholder: 'Algo concreto para el Departamento Policial de Sarasota'
    }
  },
  sheriff: {
    etica: {
      label: 'Ética y uso de fuerza',
      placeholder: '¿Cuándo considerás que está justificado escalar la fuerza? Sé concreto.'
    },
    operativa: {
      label: 'Cadena de mando',
      placeholder: 'Llega un llamado serio y no hay supervisor online. ¿Cómo procedés?'
    },
    criterio: {
      label: 'Escena sensible',
      placeholder: 'Sospecha de arma en una vivienda. ¿Qué precauciones tomás al llegar?'
    },
    escenario: {
      label: 'Escenario de emergencia',
      placeholder:
        'Violencia doméstica con gritos y posible arma en la escena. ¿Cómo manejás la situación paso a paso?'
    },
    aporte: {
      label: '¿Qué aportás al Sheriff?',
      placeholder: 'Algo concreto para la Oficina del Sheriff'
    }
  }
};

/** Paso 2 — preguntas del depto. customId: solicitud_depto2:KEY */
export function crearModalPaso2(departamentoKey) {
  const dep = DEPARTAMENTOS[departamentoKey];
  const q = PREGUNTAS_P2[departamentoKey] || PREGUNTAS_P2.policia;

  const modal = new ModalBuilder()
    .setCustomId(`solicitud_depto2:${departamentoKey}`)
    .setTitle(`${dep.emoji} Solicitud · Parte 2/2`.slice(0, 45));

  for (const id of ['etica', 'operativa', 'criterio', 'escenario', 'aporte']) {
    const meta = q[id];
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(id)
          .setLabel(meta.label.slice(0, 45))
          .setPlaceholder((meta.placeholder || '').slice(0, 100))
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000)
      )
    );
  }
  return modal;
}

export default {
  data: new SlashCommandBuilder()
    .setName('solicitud-departamento')
    .setDescription('Postulate a un departamento de servicios públicos de SWFL.')
    .addStringOption((opt) =>
      opt
        .setName('departamento')
        .setDescription('Departamento al que querés postularte.')
        .setRequired(true)
        .addChoices(
          { name: '🚒 Bomberos y Rescate – Bonita Springs', value: 'bomberos' },
          { name: '🚑 Servicios de Emergencias Médicas', value: 'sem' },
          { name: '👮 Policía del Condado de Sarasota', value: 'policia' },
          { name: '⭐ Sheriff del Condado de Sarasota (requiere pase)', value: 'sheriff' }
        )
    ),

  async execute(interaction) {
    const departamentoKey = interaction.options.getString('departamento');
    const dep = DEPARTAMENTOS[departamentoKey];

    if (!dep) {
      return interaction.reply({
        content: '❌ Departamento inválido.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (dep.requierePase) {
      const embedAviso = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle('⭐ Oficina del Sheriff – Requisito obligatorio')
        .setDescription(
          `Para postularte a la **Oficina del Sheriff del Condado de Sarasota** necesitás el **pase de Robux** del juego Southwest Florida.\n\n` +
            `⚠️ Si **no tenés** el pase, **no completes** este formulario.\n\n` +
            `¿Confirmás que tenés el pase de Robux del Sheriff?`
        )
        .setFooter({
          text: '00Y4n Comunidad SWFL • Solicitudes de Departamentos',
          iconURL: interaction.guild.iconURL()
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`sheriff_si_${interaction.user.id}`)
          .setLabel('Sí, tengo el pase')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`sheriff_no_${interaction.user.id}`)
          .setLabel('No tengo el pase')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({
        embeds: [embedAviso],
        components: [row],
        flags: MessageFlags.Ephemeral
      });
      const msg = await interaction.fetchReply();

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60_000
      });

      collector.on('collect', async (btn) => {
        if (btn.user.id !== interaction.user.id) {
          return btn.reply({
            content: '❌ Solo quien ejecutó el comando puede responder.',
            flags: MessageFlags.Ephemeral
          });
        }

        if (btn.customId.startsWith('sheriff_no_')) {
          collector.stop();
          return btn.update({
            content: '❌ Solicitud cancelada. Necesitás el pase de Robux del Sheriff para postularte.',
            embeds: [],
            components: []
          });
        }

        if (btn.customId.startsWith('sheriff_si_')) {
          collector.stop();
          await btn.showModal(crearModalPaso1('sheriff'));
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          try {
            await interaction.editReply({
              content: '⏱️ Tiempo agotado. Volvé a usar el comando si querés postularte.',
              embeds: [],
              components: []
            });
          } catch {}
        }
      });

      return;
    }

    await interaction.showModal(crearModalPaso1(departamentoKey));
  }
};
