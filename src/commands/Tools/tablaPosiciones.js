import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType
} from 'discord.js';
import Staff from '../../../models/Staff.js';
import { db } from '../../utils/database.js';

function parseCustomEmoji(tag) {
    const match = String(tag || '').match(/^<(a?):([\w~]+):(\d+)>$/);
    if (!match) return tag;
    const [, animated, name, id] = match;
    return { id, name, animated: Boolean(animated) };
}

const CATEGORIAS = {
    economia: {
        label: 'Economía',
        emojiTag: '<:gift:1523041327950856334>',
        async fetch() {
            const keys = await db.list('economy:');
            const datos = await Promise.all(keys.map(async (key) => {
                const valor = Number(await db.get(key, 0)) || 0;
                return {
                    userId: key.replace('economy:', ''),
                    valor,
                    texto: `$${valor.toLocaleString('es-ES')}`
                };
            }));
            return datos.sort((a, b) => b.valor - a.valor);
        }
    },

    mensajes: {
        label: 'Mensajes Totales',
        emojiTag: '<:msj:1523041309139533954>',
        async fetch(guildId) {
            // Clave actual: mensajes_totales:{guildId}:{userId}
            // Legacy: mensajes_totales:{userId} — se suma para no perder historial
            const prefix = `mensajes_totales:${guildId}:`;
            const map = new Map();

            const keysGuild = await db.list(prefix);
            for (const key of keysGuild) {
                const userId = key.slice(prefix.length);
                if (!userId) continue;
                const valor = Number(await db.get(key, 0)) || 0;
                map.set(userId, (map.get(userId) || 0) + valor);
            }

            const keysAll = await db.list('mensajes_totales:');
            for (const key of keysAll) {
                const rest = key.slice('mensajes_totales:'.length);
                if (!rest || rest.includes(':')) continue;
                const userId = rest;
                const valor = Number(await db.get(key, 0)) || 0;
                map.set(userId, (map.get(userId) || 0) + valor);
            }

            return [...map.entries()]
                .map(([userId, valor]) => ({
                    userId,
                    valor,
                    texto: `${valor.toLocaleString('es-ES')} mensajes`
                }))
                .filter((d) => d.valor > 0)
                .sort((a, b) => b.valor - a.valor);
        }
    },

    reacciones_sesiones: {
        label: 'Reacciones en Sesiones',
        emojiTag: '<:tilde:1524936452574806076>',
        async fetch(guildId) {
            const prefix = `reacciones_sesiones:${guildId}:`;
            const keys = await db.list(prefix);
            const datos = await Promise.all(keys.map(async (key) => {
                const valor = Number(await db.get(key, 0)) || 0;
                return {
                    userId: key.replace(prefix, ''),
                    valor,
                    texto: `${valor.toLocaleString('es-ES')} reacciones`
                };
            }));
            return datos.sort((a, b) => b.valor - a.valor);
        }
    },

    sesiones_hosteadas: {
        label: 'Sesiones Hosteadas (Staff)',
        emojiTag: '<:staff:1523027764104659144>',
        async fetch(guildId) {
            const staff = await Staff.find({ guildId }).lean();
            return staff
                .map((s) => {
                    const valor = s.estadisticasHistoricas?.sesionesHosteadasTotales || 0;
                    return { userId: s.userId, valor, texto: `${valor.toLocaleString('es-ES')} sesiones` };
                })
                .filter((s) => s.valor > 0)
                .sort((a, b) => b.valor - a.valor);
        }
    },

    horas_servicio: {
        label: 'Horas de Servicio (Staff)',
        emojiTag: '<:reloj:1532127960939888700>',
        async fetch(guildId) {
            const staff = await Staff.find({ guildId }).lean();
            return staff
                .map((s) => {
                    const valor = s.estadisticasHistoricas?.horasTotales || 0;
                    return { userId: s.userId, valor, texto: `${valor.toLocaleString('es-ES')} hrs` };
                })
                .filter((s) => s.valor > 0)
                .sort((a, b) => b.valor - a.valor);
        }
    }
};

function construirEmbed(categoriaKey, datos, guildName) {
    const cat = CATEGORIAS[categoriaKey];
    const embed = new EmbedBuilder()
        .setTitle(`${cat.emojiTag} ${cat.label}`)
        .setColor('#74d4fc');

    if (!datos.length) {
        embed.setDescription('Aún no hay datos registrados en esta categoría.');
    } else {
        const lineas = datos.slice(0, 10).map((d, i) => {
            const medal = i === 0 ? '<:si:1532128342327693352>' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
            return `${medal} <@${d.userId}> — **${d.texto}**`;
        });
        embed.setDescription(lineas.join('\n'));
    }

    embed.setFooter({ text: `${guildName} • Tabla de posiciones` }).setTimestamp();
    return embed;
}

function construirSelect(categoriaActual) {
    const options = Object.entries(CATEGORIAS).map(([key, cat]) => ({
        label: cat.label,
        value: key,
        emoji: parseCustomEmoji(cat.emojiTag),
        default: key === categoriaActual
    }));
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('tabla_posiciones_select')
            .setPlaceholder('Elegí una categoría')
            .addOptions(options)
    );
}

export default {
    data: new SlashCommandBuilder()
        .setName('tabla-posiciones')
        .setDescription('Muestra rankings del servidor (mensajes, economía, staff, etc.)')
        .addStringOption(opt =>
            opt.setName('categoria')
                .setDescription('Categoría a mostrar')
                .addChoices(
                    { name: 'Mensajes Totales', value: 'mensajes' },
                    { name: 'Economía', value: 'economia' },
                    { name: 'Reacciones en Sesiones', value: 'reacciones_sesiones' },
                    { name: 'Sesiones Hosteadas (Staff)', value: 'sesiones_hosteadas' },
                    { name: 'Horas de Servicio (Staff)', value: 'horas_servicio' }
                )
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();
            const guildId = interaction.guild.id;
            const categoria = interaction.options.getString('categoria') || 'mensajes';
            const cat = CATEGORIAS[categoria];
            if (!cat) {
                return interaction.editReply({ content: 'Categoría inválida.' });
            }

            const datos = await cat.fetch(guildId);
            const embed = construirEmbed(categoria, datos, interaction.guild.name);
            const row = construirSelect(categoria);

            const msg = await interaction.editReply({ embeds: [embed], components: [row] });

            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 120_000,
                filter: (i) => i.user.id === interaction.user.id
            });

            collector.on('collect', async (i) => {
                try {
                    const nueva = i.values[0];
                    const catN = CATEGORIAS[nueva];
                    const datosN = await catN.fetch(guildId);
                    await i.update({
                        embeds: [construirEmbed(nueva, datosN, interaction.guild.name)],
                        components: [construirSelect(nueva)]
                    });
                } catch (err) {
                    console.error('Error cambiando categoría tabla-posiciones:', err);
                    try { await i.deferUpdate(); } catch {}
                }
            });

            collector.on('end', async () => {
                try {
                    await msg.edit({ components: [] });
                } catch {}
            });
        } catch (error) {
            console.error('Error en /tabla-posiciones:', error);
            const payload = { content: 'Ocurrió un error al generar la tabla de posiciones.' };
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(payload).catch(() => null);
            } else {
                await interaction.reply({ ...payload, ephemeral: true }).catch(() => null);
            }
        }
    }
};
