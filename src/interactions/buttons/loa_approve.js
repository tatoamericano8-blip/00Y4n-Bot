import { EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';
import { parseFechaFlexible } from '../../utils/gestorLoa.js';

const ROLE_LOA = '1532459272690991318';

async function cargarModelo(nombre, ruta1, ruta2) {
  if (mongoose.models[nombre]) return mongoose.models[nombre];
  try {
    const mod = await import(ruta1);
    return mod.default || mod;
  } catch {
    try {
      const mod = await import(ruta2);
      return mod.default || mod;
    } catch {
      return null;
    }
  }
}

export default {
  id: 'loa_approve',
  customId: 'loa_approve',
  name: 'loa_approve',
  async execute(interaction, client, args) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate().catch(() => {});
    }

    const guildId = interaction.guildId;
    const embedOriginal = interaction.message?.embeds?.[0];
    let userIdTarget = args && args.length > 0 ? args[0] : null;

    if (!userIdTarget && embedOriginal?.description) {
      const match =
        embedOriginal.description.match(/<@!?(\d+)>/) ||
        embedOriginal.description.match(/(\d{17,19})/);
      if (match) userIdTarget = match[1];
    }

    if (!userIdTarget) {
      return await interaction.followUp({
        content:
          '<:cruz00y4n:1523041302764191844> No se pudo determinar el ID del usuario solicitante.',
        ephemeral: true
      });
    }

    try {
      const Staff = await cargarModelo(
        'Staff',
        '../../../models/Staff.js',
        '../../../models/Staff.js'
      );
      const StaffLog = await cargarModelo(
        'StaffLog',
        '../../../models/StaffLog.js',
        '../../../models/StaffLog.js'
      );

      const inicioArg = args?.[1] || null;
      const finArg = args?.[2] || null;
      const inicioParsed = parseFechaFlexible(inicioArg) || new Date();
      const finParsed = parseFechaFlexible(finArg);

      if (Staff) {
        await Staff.findOneAndUpdate(
          { guildId, userId: userIdTarget },
          {
            $set: {
              estado: 'LOA',
              'loa.activo': true,
              'loa.inicio': inicioParsed,
              'loa.fin': finParsed,
              'loa.motivo': finArg
                ? `LOA hasta ${finArg}`
                : 'LOA Aprobada por Alto Comando'
            }
          },
          { upsert: true, new: true }
        );
      }

      try {
        const member = await interaction.guild.members.fetch(userIdTarget);
        await member.roles.add(ROLE_LOA).catch(() => null);
      } catch {}

      if (StaffLog) {
        await StaffLog.create({
          guildId,
          tipo: 'LOA_APROBADA',
          targetUserId: userIdTarget,
          executorId: interaction.user.id,
          detalles: {
            motivo: 'LOA Aprobada por Alto Comando',
            inicio: inicioArg,
            fin: finArg
          }
        }).catch(() => {});
      }

      const embedEditado = EmbedBuilder.from(embedOriginal || {})
        .setColor(0x2ecc71)
        .setTitle('✅ Solicitud de Ausencia (LOA) — APROBADA')
        .setFooter({
          text: `Aprobada por ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        });

      await interaction.editReply({
        embeds: [embedEditado],
        components: []
      });
    } catch (error) {
      console.error('Error procesando aprobación LOA:', error);
      await interaction.followUp({
        content:
          '<:cruz00y4n:1523041302764191844> Ocurrió un error al procesar la aprobación.',
        ephemeral: true
      });
    }
  }
};
