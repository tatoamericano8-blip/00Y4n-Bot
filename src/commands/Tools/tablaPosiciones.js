import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} from 'discord.js';
import { db } from '../../utils/database.js';
import Staff from '../../../models/Staff.js';

// -------------------------------------------------------------------
// 🏆 CATEGORÍAS DISPONIBLES
// Cada una sabe cómo buscar sus propios datos (100% compatibles con
// lo que el bot ya guarda: economy:, mensajes_totales:, reacciones_sesiones:
// y el modelo Staff).
// -------------------------------------------------------------------
const CATEGORIAS = {
    economia: {
        label: '<:gift:1523041327950856334> Economía',
        emoji: '1523041327950856334',
        async fetch() {
            // ⚠️ El saldo se guarda como economy:{userId} SIN guildId,
            // por lo que este top es global (no exclusivo de este servidor).
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
        label: '<:msj:1523041309139533954> Mensajes Totales',
        emoji: '1523041309139533954',
        async fetch(guildId) {
            const prefix = `mensajes_totales:${guildId}:`;
            const keys = await db.list(prefix);
            const datos = await Promise.all(keys.map(async (key) => {
                const valor = Number(await db.get(key, 0)) || 0;
                return {
                    userId: key.replace(prefix, ''),
                    valor,
                    texto: `${valor.toLocaleString('es-ES')} mensajes`
                };
            }));
            return datos.sort((a, b) => b.valor - a.valor);
        }
    },

    reacciones_sesiones: {
        label: '<:tilde:1524936452574806076> Reacciones en Sesiones',
        emoji: '1524936452574806076',
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
        label: '<:staff:1523027764104659144> Sesiones Hosteadas (Staff)',
        emoji: '1523027764104659144',
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
        label: '<:reloj:1532127960939888700> Horas de Servicio (Staff)',
        emoji: '1532127960939888700',
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
        .setTitle(`${cat.emoji} ${cat.label}`)
        .setColor('#74d4fc')
        .setFooter({ text: guildName })
        .setTimestamp();

    if (!datos.length) {
        embed.setDescription('No hay datos disponibles todavía para esta categoría.');
        return embed;
    }

    const top = datos.slice(0, 10);
    const medallas = ['🥇', '🥈', '🥉'];
    const descripcion = top
        .map((entry, i) => {
            const medalla = medallas[i] || `**${i + 1}.**`;
            return `${medalla} <@${entry.userId}> — ${entry.texto}`;
        })
        .join('\n');

    embed.setDescription(descripcion);
    return embed;
}

function construirMenu(categoriaActual) {
    const opciones = Object.entries(CATEGORIAS).map(([key, cat]) => ({
        label: cat.label.replace(/^\S+\s/, ''),
        value: key,
        emoji: cat.emoji,
        default: key === categoriaActual
    }));

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('tabla_posiciones_categoria')
            .setPlaceholder('Selecciona una categoría...')
            .addOptions(opciones)
    );
}

export default {
    data: {
        name: 'tabla-posiciones',
        description: 'Muestra la tabla de posiciones (leaderboard) del servidor.',
        options: [
            {
                name: 'categoria',
                description: 'Categoría a mostrar (por defecto: Economía).',
                type: ApplicationCommandOptionType.String,
                required: false,
                choices: Object.entries(CATEGORIAS).map(([value, cat]) => ({
                    name: cat.label,
                    value
                }))
            }
        ]
    },

    async execute(interaction) {
        await interaction.deferReply();

        const guildId = interaction.guildId;
        const categoriaInicial = interaction.options.getString('categoria') || 'economia';

        try {
            const datos = await CATEGORIAS[categoriaInicial].fetch(guildId);
            const embed = construirEmbed(categoriaInicial, datos, interaction.guild.name);
            const fila = construirMenu(categoriaInicial);

            const mensaje = await interaction.editReply({ embeds: [embed], components: [fila] });

            const collector = mensaje.createMessageComponentCollector({
                filter: (i) => i.customId === 'tabla_posiciones_categoria' && i.user.id === interaction.user.id,
                time: 60000
            });

            collector.on('collect', async (i) => {
                await i.deferUpdate();
                const categoriaSeleccionada = i.values[0];
                const nuevosDatos = await CATEGORIAS[categoriaSeleccionada].fetch(guildId);
                const nuevoEmbed = construirEmbed(categoriaSeleccionada, nuevosDatos, interaction.guild.name);
                const nuevaFila = construirMenu(categoriaSeleccionada);
                await i.editReply({ embeds: [nuevoEmbed], components: [nuevaFila] });
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] }).catch(() => {});
            });
        } catch (error) {
            console.error('Error en /tabla_posiciones:', error);
            await interaction.editReply({
                content: '❌ Hubo un error al cargar la tabla de posiciones.'
            });
        }
    }
};
