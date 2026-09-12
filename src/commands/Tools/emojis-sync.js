import { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { EMOJI_DEF, em, previewRemapPrefix } from '../../config/emojis.js';

const ROL_SUPERVISOR = '1451956429345919008';
const ROL_ALTO = '1528870731629465752';

export default {
  data: new SlashCommandBuilder()
    .setName('emojis-sync')
    .setDescription('ADMIN: Lista / verifica emojis del registro central vs el server.')
    .addStringOption((o) =>
      o
        .setName('accion')
        .setDescription('Qué hacer')
        .setRequired(true)
        .addChoices(
          { name: 'Verificar (faltantes / OK)', value: 'check' },
          { name: 'Preview remap de prefijo', value: 'remap' },
          { name: 'Exportar mapa (para renovacion)', value: 'export' }
        )
    )
    .addStringOption((o) =>
      o
        .setName('prefijo_viejo')
        .setDescription('Solo remap: ej cielo_')
        .setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName('prefijo_nuevo')
        .setDescription('Solo remap: ej coral_')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(null),

  async execute(interaction) {
    if (
      !interaction.member.roles.cache.has(ROL_SUPERVISOR) &&
      !interaction.member.roles.cache.has(ROL_ALTO) &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: 'Solo Supervisor Ejecutivo / Alto Comando.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await interaction.guild.emojis.fetch().catch(() => null);

    const accion = interaction.options.getString('accion');
    const cache = interaction.guild.emojis.cache;

    if (accion === 'check') {
      const ok = [];
      const miss = [];
      const idMismatch = [];

      for (const [key, def] of Object.entries(EMOJI_DEF)) {
        const byName = cache.find((e) => e.name === def.name);
        const byId = cache.get(def.id);
        if (byName && byId && byName.id === def.id) {
          ok.push(key);
        } else if (byName && byName.id !== def.id) {
          idMismatch.push(
            `${key}: registro id=${def.id} server id=${byName.id} (${def.name})`
          );
        } else if (!byName && !byId) {
          miss.push(`${key} (${def.name})`);
        } else if (byId && byId.name !== def.name) {
          idMismatch.push(
            `${key}: id existe como ${byId.name}, registro dice ${def.name}`
          );
        } else {
          ok.push(key);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('Emojis — verificación registro')
        .setColor('#8ae6fa')
        .setDescription(
          [
            `> **OK:** ${ok.length}`,
            `> **Faltan en server:** ${miss.length}`,
            `> **ID/nombre distinto:** ${idMismatch.length}`,
            miss.length
              ? '\n**Faltantes:**\n```\n' + miss.slice(0, 25).join('\n') + (miss.length > 25 ? '\n…' : '') + '\n```'
              : '',
            idMismatch.length
              ? '\n**Mismatch:**\n```\n' +
                idMismatch.slice(0, 15).join('\n') +
                (idMismatch.length > 15 ? '\n…' : '') +
                '\n```'
              : ''
          ]
            .filter(Boolean)
            .join('\n')
        );

      return interaction.editReply({ embeds: [embed] });
    }

    if (accion === 'remap') {
      const oldP = interaction.options.getString('prefijo_viejo') || 'cielo_';
      const newP = interaction.options.getString('prefijo_nuevo');
      if (!newP) {
        return interaction.editReply({
          content: 'Indicá `prefijo_nuevo` (ej: `coral_`).'
        });
      }
      let np = newP.toLowerCase();
      if (!np.endsWith('_')) np += '_';

      const preview = previewRemapPrefix(oldP, np);
      const lines = Object.entries(preview)
        .filter(([_, d]) => d.name.startsWith(np))
        .slice(0, 30)
        .map(([k, d]) => `${k}: ${d.name}`);

      // Match server emojis by new names
      let found = 0;
      const updates = [];
      for (const [key, def] of Object.entries(preview)) {
        const onServer = cache.find((e) => e.name === def.name);
        if (onServer) {
          found++;
          updates.push(
            `  ${key}: { name: '${onServer.name}', id: '${onServer.id}'${onServer.animated ? ', animated: true' : ''} },`
          );
        }
      }

      return interaction.editReply({
        content:
          `Preview remap \`${oldP}\` → \`${np}\`\n` +
          `Nombres nuevos en registro: **${lines.length}+**\n` +
          `Encontrados ya en el server: **${found}**\n\n` +
          `Copiá esto a \`src/config/emojis.js\` (parcial):\n\`\`\`js\n` +
          updates.slice(0, 20).join('\n') +
          (updates.length > 20 ? '\n// …' : '') +
          `\n\`\`\`\n` +
          `Ejemplos de claves: \`${lines.slice(0, 8).join('`, `')}\``
      });
    }

    // export
    const lines = Object.entries(EMOJI_DEF).map(([key, def]) => {
      const tag = em(key);
      const onServer = cache.find((e) => e.name === def.name || e.id === def.id);
      const st = onServer ? 'OK' : 'MISS';
      return `${st.padEnd(4)} ${key.padEnd(18)} ${tag}`;
    });

    const chunk = lines.slice(0, 40).join('\n');
    return interaction.editReply({
      content:
        `**Export registro** (${lines.length} claves)\n` +
        `Uso en código: \`import { em, E } from '../../config/emojis.js'\` → \`em('cruz')\`\n\`\`\`\n${chunk}\n\`\`\``
    });
  }
};
