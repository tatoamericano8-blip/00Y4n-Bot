import {
  SlashCommandBuilder,
  MessageFlags
} from 'discord.js';
import {
  esEquipoPropietarios,
  parseDuracionSorteo,
  buildEmbedSorteo,
  buildRowSorteo,
  guardarSorteo,
  finalizarSorteo,
  rerollSorteo,
  obtenerSorteo
} from '../../utils/gestorSorteos.js';
import { E } from '../../config/emojis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sorteo')
    .setDescription('Sistema de sorteos de la comunidad 00Y4n.')
    .addSubcommand((s) =>
      s
        .setName('iniciar')
        .setDescription('Publicar un sorteo en este canal.')
        .addStringOption((o) =>
          o
            .setName('premio')
            .setDescription('Qué se sortea (ej: 12.000 ROBUX)')
            .setRequired(true)
            .setMaxLength(200)
        )
        .addStringOption((o) =>
          o
            .setName('duracion')
            .setDescription('Cuánto dura: 30m, 2h, 11d…')
            .setRequired(true)
        )
        .addIntegerOption((o) =>
          o
            .setName('ganadores')
            .setDescription('Cantidad de ganadores (default 1)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(20)
        )
    )
    .addSubcommand((s) =>
      s
        .setName('finalizar')
        .setDescription('Cerrar un sorteo antes de tiempo y elegir ganador(es).')
        .addStringOption((o) =>
          o
            .setName('mensaje_id')
            .setDescription('ID del mensaje del sorteo')
            .setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s
        .setName('reroll')
        .setDescription('Volver a elegir ganador(es) de un sorteo ya finalizado.')
        .addStringOption((o) =>
          o
            .setName('mensaje_id')
            .setDescription('ID del mensaje del sorteo')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (!esEquipoPropietarios(interaction.member)) {
      return interaction.reply({
        content:
          E.cruz +
          ' Solo el **Equipo de Propietarios** puede gestionar sorteos.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'iniciar') {
      const premio = interaction.options.getString('premio', true).trim();
      const duracionRaw = interaction.options.getString('duracion', true);
      const ganadores = interaction.options.getInteger('ganadores') || 1;

      const parsed = parseDuracionSorteo(duracionRaw);
      if (!parsed.ok) {
        return interaction.reply({
          content: E.cruz + ' ' + parsed.error,
          flags: MessageFlags.Ephemeral
        });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const endsAt = Date.now() + parsed.ms;
      const data = {
        premio,
        hostId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        winnerCount: ganadores,
        participantes: [],
        endsAt,
        ended: false,
        createdAt: Date.now()
      };

      const msg = await interaction.channel.send({
        embeds: [buildEmbedSorteo(data)],
        components: [buildRowSorteo()]
      });

      data.messageId = msg.id;
      await guardarSorteo(data);

      return interaction.editReply({
        content: E.tilde + ` Sorteo publicado: **${premio}** · finaliza <t:${Math.floor(endsAt / 1000)}:R>.`
      });
    }

    if (sub === 'finalizar') {
      const messageId = interaction.options.getString('mensaje_id', true).trim();
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const res = await finalizarSorteo(interaction.client, messageId, {
        endedBy: interaction.user.id
      });

      if (!res.ok) {
        const map = {
          no_existe: 'No encontré ese sorteo.',
          ya_finalizado: 'Ese sorteo ya estaba finalizado.'
        };
        return interaction.editReply({
          content: E.cruz + ' ' + (map[res.reason] || 'No se pudo finalizar.')
        });
      }

      return interaction.editReply({
        content:
          E.tilde +
          ` Sorteo finalizado. Ganador${(res.winners || []).length === 1 ? '' : 'es'}: ` +
          ((res.winners || []).map((id) => `<@${id}>`).join(', ') || 'nadie')
      });
    }

    if (sub === 'reroll') {
      const messageId = interaction.options.getString('mensaje_id', true).trim();
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const res = await rerollSorteo(interaction.client, messageId);
      if (!res.ok) {
        const map = {
          no_existe: 'No encontré ese sorteo.',
          no_finalizado: 'El sorteo todavía no finalizó. Usá `/sorteo finalizar`.',
          sin_participantes: 'No hay participantes para hacer reroll.'
        };
        return interaction.editReply({
          content: E.cruz + ' ' + (map[res.reason] || 'No se pudo hacer reroll.')
        });
      }

      return interaction.editReply({
        content:
          E.tilde +
          ` Reroll listo. Nuevo${(res.winners || []).length === 1 ? '' : 's'}: ` +
          (res.winners || []).map((id) => `<@${id}>`).join(', ')
      });
    }
  }
};
