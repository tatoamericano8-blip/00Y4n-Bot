import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import Licencia from '../../../models/Licencia.js';
import { sincronizarRolLicencia } from '../../utils/gestorLicencias.js';

const ROL_POLICIA_ID = '1529146302783422706';

function embedDmLicencia(estado, motivo, oficialTag, guildName) {
  const textos = {
    Activa: {
      emoji: '🟢',
      color: '#57f287',
      titulo: 'Tu licencia de conducir fue ACTIVADA',
      cuerpo:
        'El Departamento de Policía actualizó tu documentación.\n\n' +
        '**Estado:** 🟢 **Activa**\n' +
        'Podés conducir en sesiones respetando las normas de manejo del servidor.\n\n' +
        'Consultá tu estado con `/licencia estado` o `/perfil_swfl`.'
    },
    Suspendida: {
      emoji: '🟡',
      color: '#fee75c',
      titulo: 'Tu licencia de conducir fue SUSPENDIDA',
      cuerpo:
        'El Departamento de Policía **suspendió** tu licencia de conducir.\n\n' +
        '**Estado:** 🟡 **Suspendida**\n' +
        '**No debés conducir** en sesiones hasta que se reactive.\n' +
        'Si lo hacés, podés recibir multas o nuevas sanciones.\n\n' +
        'Para consultas, abrí un ticket o hablá con el personal policial en sesión.'
    },
    Revocada: {
      emoji: '🔴',
      color: '#ed4245',
      titulo: 'Tu licencia de conducir fue REVOCADA',
      cuerpo:
        'El Departamento de Policía **revocó** tu licencia de conducir.\n\n' +
        '**Estado:** 🔴 **Revocada**\n' +
        '**No debés conducir** en sesiones.\n\n' +
        'Para recuperarla:\n' +
        '• Leé el reglamento de manejo\n' +
        '• Usá `/licencia recuperar` (10 preguntas, mínimo 7 correctas)\n' +
        '• Si aprobás, se reactiva automáticamente'
    },
    'Sin licencia': {
      emoji: '⚪',
      color: '#95a5a6',
      titulo: 'Tu documentación quedó sin licencia',
      cuerpo:
        'El Departamento de Policía actualizó tu ficha a **Sin licencia**.\n\n' +
        '**Estado:** ⚪ **Sin licencia**\n' +
        'Para obtenerla de nuevo:\n' +
        '• `/licencia examen` → `/licencia tramitar` ($5.000)\n' +
        '• O comprá **Licencia Express** en `/tienda abrir` ($75.000)'
    }
  };

  const info = textos[estado] || textos['Sin licencia'];
  return new EmbedBuilder()
    .setColor(info.color)
    .setTitle(`${info.emoji} ${info.titulo}`)
    .setDescription(
      info.cuerpo +
        `\n\n**Motivo / observación:** ${motivo}\n` +
        `**Oficial a cargo:** ${oficialTag}\n\n` +
        `*${guildName} • Tránsito SWFL*`
    )
    .setTimestamp();
}

export default {
  data: {
    name: 'licencia_swfl',
    description: 'Gestión policial: Cambia el estado de la licencia de conducir de un ciudadano.',
    options: [
      {
        name: 'usuario',
        description: 'Ciudadano al que se le gestionará la licencia.',
        type: ApplicationCommandOptionType.User,
        required: true
      },
      {
        name: 'estado',
        description: 'Nuevo estado de la licencia.',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: '🟢 Activa', value: 'Activa' },
          { name: '🟡 Suspendida', value: 'Suspendida' },
          { name: '🔴 Revocada', value: 'Revocada' },
          { name: '⚪ Sin licencia', value: 'Sin licencia' }
        ]
      },
      {
        name: 'motivo',
        description: 'Razón del cambio de estado (opcional).',
        type: ApplicationCommandOptionType.String,
        required: false
      }
    ]
  },

  async execute(interaction) {
    const tieneRolPolicia = interaction.member.roles.cache.has(ROL_POLICIA_ID);

    if (!tieneRolPolicia) {
      const embedSinPermiso = new EmbedBuilder()
        .setTitle('❌ ACCESO DENEGADO')
        .setDescription(
          'Este comando está reservado únicamente para el personal que posea el rol del **Departamento de Policía**.'
        )
        .setColor('#ff3333');
      return await interaction.reply({ embeds: [embedSinPermiso], ephemeral: true });
    }

    const usuario = interaction.options.getUser('usuario');
    const nuevoEstado = interaction.options.getString('estado');
    const motivo = interaction.options.getString('motivo') || 'Sin motivo especificado.';

    await Licencia.findOneAndUpdate(
      { usuario_id: usuario.id },
      {
        estado: nuevoEstado,
        oficial_id: interaction.user.id,
        motivo: motivo,
        fecha: new Date()
      },
      { upsert: true, new: true }
    );

    try {
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (miembro) await sincronizarRolLicencia(miembro, nuevoEstado);
    } catch (_) {}

    let emojiEstado = '🟢';
    let colorEmbed = '#57f287';
    if (nuevoEstado === 'Suspendida') {
      emojiEstado = '🟡';
      colorEmbed = '#fee75c';
    } else if (nuevoEstado === 'Revocada') {
      emojiEstado = '🔴';
      colorEmbed = '#ed4245';
    } else if (nuevoEstado === 'Sin licencia') {
      emojiEstado = '⚪';
      colorEmbed = '#95a5a6';
    }

    const embedRespuesta = new EmbedBuilder()
      .setTitle('<:lista:1534938422202994755> Actualización de Licencia de Conducir')
      .setDescription(
        `Se ha actualizado la documentación del ciudadano <@${usuario.id}>.\n\n` +
          `• **Nuevo Estado:** ${emojiEstado} **${nuevoEstado.toUpperCase()}**\n` +
          `• **Oficial a Cargo:** <@${interaction.user.id}>\n` +
          `• **Motivo/Observación:** ${motivo}`
      )
      .setColor(colorEmbed)
      .setFooter({ text: 'Sistema de Tránsito & Control Policial' })
      .setTimestamp();

    await interaction.reply({ embeds: [embedRespuesta] });

    try {
      const dmEmbed = embedDmLicencia(
        nuevoEstado,
        motivo,
        `<@${interaction.user.id}>`,
        interaction.guild?.name || '00Y4n SWFL'
      );
      await usuario.send({ embeds: [dmEmbed] }).catch(() => null);
    } catch (_) {}
  }
};
