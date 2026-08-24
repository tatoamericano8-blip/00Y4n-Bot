import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';
import Vehiculo from '../../../models/Vehiculo.js';
import PermisoMatriculaExtra from '../../../models/PermisoMatriculaExtra.js';
import { patenteValida } from '../../utils/antiAbusoPatentes.js';

const ROL_PROPIETARIOS = '1528877296977711256';
const LIMITE_BASE = 4;

function esPropietario(member) {
  return (
    member.roles.cache.has(ROL_PROPIETARIOS) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName('permiso-matricula')
    .setDescription('Permisos extra de matriculación y baja forzada de patentes (Propietarios).')
    .addSubcommand(sub =>
      sub
        .setName('extra')
        .setDescription('Otorga slots extra de matriculación a un ciudadano.')
        .addUserOption(o => o.setName('usuario').setDescription('Ciudadano').setRequired(true))
        .addIntegerOption(o =>
          o.setName('cantidad').setDescription('Vehículos extra (1–5)').setRequired(true).setMinValue(1).setMaxValue(5)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('quitar-extra')
        .setDescription('Quita el permiso extra de matriculación.')
        .addUserOption(o => o.setName('usuario').setDescription('Ciudadano').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('forzar-quitar')
        .setDescription('Fuerza la baja de una matrícula por patente.')
        .addStringOption(o => o.setName('patente').setDescription('Matrícula a eliminar').setRequired(true))
    ),

  async execute(interaction) {
    if (!esPropietario(interaction.member)) {
      return interaction.reply({
        content: '<:cruz:1534937767652495360> Solo el **Equipo de Propietarios** puede usar este comando.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'extra') {
      const target = interaction.options.getUser('usuario');
      const cantidad = interaction.options.getInteger('cantidad');
      await PermisoMatriculaExtra.findOneAndUpdate(
        { guildId, userId: target.id },
        { extraSlots: cantidad, otorgadoPor: interaction.user.id, otorgadoEn: new Date() },
        { upsert: true, new: true }
      );
      return interaction.editReply({
        content:
          `<:tilde:1534937809733812286> **Permiso extra** a <@${target.id}>.\n` +
          `> Slots extra: **${cantidad}** · Límite total: **${LIMITE_BASE + cantidad}** (base ${LIMITE_BASE} + extra).`
      });
    }

    if (sub === 'quitar-extra') {
      const target = interaction.options.getUser('usuario');
      const deleted = await PermisoMatriculaExtra.findOneAndDelete({ guildId, userId: target.id });
      if (!deleted) {
        return interaction.editReply({
          content: `<:warn:1534937002695327837> <@${target.id}> no tenía permiso extra.`
        });
      }
      return interaction.editReply({
        content:
          `<:tilde:1534937809733812286> Se quitó el permiso extra de <@${target.id}>.\n` +
          `> Vuelve al límite base de **${LIMITE_BASE}**.`
      });
    }

    const check = patenteValida(interaction.options.getString('patente'));
    if (!check.ok) {
      return interaction.editReply({ content: `<:cruz:1534937767652495360> ${check.motivo}` });
    }
    const patente = check.patente;
    const auto = await Vehiculo.findOneAndDelete({ patente });
    if (!auto) {
      return interaction.editReply({
        content: `<:cruz:1534937767652495360> No hay vehículo con la matrícula \`${patente}\`.`
      });
    }
    try {
      const owner = await interaction.client.users.fetch(auto.usuario_id).catch(() => null);
      if (owner) {
        await owner.send(
          `⚠️ **Matrícula dada de baja**\n\n` +
          `Tu vehículo **${auto.marca} ${auto.modelo}** con patente \`${patente}\` fue **removido del sistema** por el staff de 00Y4n.\n` +
          `Si creés que es un error, abrí un ticket de soporte.`
        ).catch(() => null);
      }
    } catch (_) {}
    return interaction.editReply({
      content:
        `<:tilde:1534937809733812286> Matrícula \`${patente}\` eliminada.\n` +
        `> Dueño: <@${auto.usuario_id}> · ${auto.marca} ${auto.modelo}\n` +
        `-# Se intentó notificar por MD al propietario.`
    });
  }
};
